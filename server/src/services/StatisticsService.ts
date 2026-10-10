import { getAuditLogCollection } from '../models/AuditLog';
import { getProjectCollection, getProjectMemberCollection } from '../models/Project';
import { getTaskCollection } from '../models/Task';
import { getUserCollection } from '../models/User';
import { getProjectAccess } from './ProjectService';

export interface AdminStatistics {
  users: {
    total: number;
    active: number;
    admins: number;
    workers: number;
  };
  projects: {
    total: number;
    active: number;
    inactive: number;
    members: number;
  };
  tasks: {
    total: number;
    pending: number;
    working: number;
    finished: number;
    unassigned: number;
  };
  auditLogs: number;
}

/**
 * Dashboard metrics for the admin panel. Every count is a targeted
 * countDocuments call so the numbers stay exact without loading documents.
 */
export async function getAdminStatistics(): Promise<AdminStatistics> {
  const users = getUserCollection();
  const projects = getProjectCollection();
  const members = getProjectMemberCollection();
  const tasks = getTaskCollection();
  const auditLogs = getAuditLogCollection();

  const notDeleted = { status: { $ne: 'deleted' as const } };

  const [
    totalUsers,
    activeUsers,
    admins,
    workers,
    totalProjects,
    activeProjects,
    inactiveProjects,
    totalMembers,
    totalTasks,
    pendingTasks,
    workingTasks,
    finishedTasks,
    unassignedTasks,
    totalAuditLogs,
  ] = await Promise.all([
    users.countDocuments(notDeleted),
    users.countDocuments({ status: 'active' }),
    users.countDocuments({ ...notDeleted, role: 'admin' }),
    users.countDocuments({ ...notDeleted, role: 'worker' }),
    projects.countDocuments({}),
    projects.countDocuments({ status: 'active' }),
    projects.countDocuments({ status: 'inactive' }),
    members.countDocuments({}),
    tasks.countDocuments({}),
    tasks.countDocuments({ status: 'pending' }),
    tasks.countDocuments({ status: 'working' }),
    tasks.countDocuments({ status: 'finished' }),
    tasks.countDocuments({ assignedTo: null }),
    auditLogs.countDocuments({}),
  ]);

  return {
    users: { total: totalUsers, active: activeUsers, admins, workers },
    projects: {
      total: totalProjects,
      active: activeProjects,
      inactive: inactiveProjects,
      members: totalMembers,
    },
    tasks: {
      total: totalTasks,
      pending: pendingTasks,
      working: workingTasks,
      finished: finishedTasks,
      unassigned: unassignedTasks,
    },
    auditLogs: totalAuditLogs,
  };
}

export interface ProjectStatistics {
  projectId: string;
  title: string;
  status: string;
  tasks: {
    total: number;
    pending: number;
    working: number;
    finished: number;
    unassigned: number;
    progress: number;
  };
  team: {
    size: number;
    admins: number;
  };
}

/**
 * Metrics for a single project. Access follows the same rules as
 * getProjectDetail: global admins pass, everyone else must be a member.
 */
export async function getProjectStatistics(
  projectId: string,
  requester: { userId: string; role: string }
): Promise<ProjectStatistics> {
  const access = await getProjectAccess(projectId, requester);
  const projectObjectId = access.project._id;

  const tasks = getTaskCollection();
  const members = getProjectMemberCollection();

  const [totalTasks, pendingTasks, workingTasks, finishedTasks, unassignedTasks, totalMembers, adminMembers] =
    await Promise.all([
      tasks.countDocuments({ projectId: projectObjectId }),
      tasks.countDocuments({ projectId: projectObjectId, status: 'pending' }),
      tasks.countDocuments({ projectId: projectObjectId, status: 'working' }),
      tasks.countDocuments({ projectId: projectObjectId, status: 'finished' }),
      tasks.countDocuments({ projectId: projectObjectId, assignedTo: null }),
      members.countDocuments({ projectId: projectObjectId }),
      members.countDocuments({ projectId: projectObjectId, role: 'admin' }),
    ]);

  return {
    projectId: projectObjectId.toHexString(),
    title: access.project.title ?? '',
    status: access.project.status ?? 'active',
    tasks: {
      total: totalTasks,
      pending: pendingTasks,
      working: workingTasks,
      finished: finishedTasks,
      unassigned: unassignedTasks,
      progress: totalTasks === 0 ? 0 : Math.round((finishedTasks / totalTasks) * 100),
    },
    team: { size: totalMembers, admins: adminMembers },
  };
}

export interface MemberWorkload {
  userId: string;
  name: string;
  email: string;
  assignedTasks: number;
  openTasks: number;
  completedTasks: number;
  estimatedHours: number;
}

export interface ProjectAnalytics {
  projectId: string;
  title: string;
  status: string;
  totalTasks: number;
  pending: number;
  working: number;
  finished: number;
  progress: number;
}

export interface ActivityPoint {
  date: string;
  created: number;
}

export interface AdminAnalytics {
  overview: {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    openTasks: number;
    overdueTasks: number;
    activeMembers: number;
  };
  taskStatus: { pending: number; working: number; finished: number };
  workload: MemberWorkload[];
  projects: ProjectAnalytics[];
  activity: ActivityPoint[];
}

const ACTIVITY_DAYS = 14;

function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function buildActivityWindow(today: Date): { days: ActivityPoint[]; start: Date } {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - (ACTIVITY_DAYS - 1));
  const days: ActivityPoint[] = [];
  for (let i = 0; i < ACTIVITY_DAYS; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push({ date: toDateKey(day), created: 0 });
  }
  return { days, start };
}

/**
 * Task analytics for the admin dashboard: overview counters, status
 * breakdown, per-worker workload, per-project breakdown and task creation
 * volume bucketed by local calendar day (last 14 days).
 *
 * The groupings (status, assignedTo, projectId, createdAt) come from loading
 * each document once and reducing in memory, so the endpoint stays
 * mock-friendly without aggregation pipelines. Creation volume is bucketed
 * from the tasks collection because task creation is not recorded in
 * task_history (only field and status changes are).
 */
export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const now = new Date();
  const users = getUserCollection();
  const projects = getProjectCollection();
  const tasks = getTaskCollection();

  const notFinished = { status: { $ne: 'finished' as const } };

  const [totalProjects, activeProjects, totalTasks, overdueTasks, activeMembers, members, taskDocs, projectDocs] =
    await Promise.all([
      projects.countDocuments({}),
      projects.countDocuments({ status: 'active' }),
      tasks.countDocuments({}),
      tasks.countDocuments({ ...notFinished, endDate: { $lt: now } }),
      users.countDocuments({ status: 'active' }),
      users.find({ role: 'worker', status: 'active' }, { projection: { name: 1, email: 1 } }).toArray(),
      tasks.find({}, { projection: { projectId: 1, status: 1, assignedTo: 1, estimatedHours: 1, createdAt: 1 } }).toArray(),
      projects.find({}, { projection: { title: 1, status: 1 } }).toArray(),
    ]);

  const statusCounts = { pending: 0, working: 0, finished: 0 };
  let openTasks = 0;

  const workloadById = new Map<string, MemberWorkload>();
  for (const member of members) {
    if (!member._id) continue;
    const userId = member._id.toHexString();
    workloadById.set(userId, {
      userId,
      name: member.name ?? '',
      email: member.email ?? '',
      assignedTasks: 0,
      openTasks: 0,
      completedTasks: 0,
      estimatedHours: 0,
    });
  }

  const projectTotals = new Map<string, { totalTasks: number; pending: number; working: number; finished: number }>();
  for (const project of projectDocs) {
    if (!project._id) continue;
    projectTotals.set(project._id.toHexString(), { totalTasks: 0, pending: 0, working: 0, finished: 0 });
  }

  const activity = buildActivityWindow(now);

  for (const task of taskDocs) {
    statusCounts[task.status] += 1;
    if (task.status !== 'finished') openTasks += 1;

    if (task.assignedTo) {
      const workload = workloadById.get(task.assignedTo.toHexString());
      if (workload) {
        workload.assignedTasks += 1;
        if (task.status === 'finished') workload.completedTasks += 1;
        else workload.openTasks += 1;
        workload.estimatedHours += task.estimatedHours ?? 0;
      }
    }

    const projectEntry = projectTotals.get(task.projectId.toHexString());
    if (projectEntry) {
      projectEntry.totalTasks += 1;
      if (task.status === 'pending') projectEntry.pending += 1;
      else if (task.status === 'working') projectEntry.working += 1;
      else projectEntry.finished += 1;
    }

    if (task.createdAt >= activity.start) {
      const key = toDateKey(task.createdAt);
      const point = activity.days.find((day) => day.date === key);
      if (point) point.created += 1;
    }
  }

  return {
    overview: { totalProjects, activeProjects, totalTasks, openTasks, overdueTasks, activeMembers },
    taskStatus: statusCounts,
    workload: Array.from(workloadById.values()).sort(
      (a, b) => b.openTasks - a.openTasks || a.name.localeCompare(b.name)
    ),
    projects: projectDocs
      .filter((project) => project._id)
      .map((project) => {
        const totals = projectTotals.get(project._id.toHexString());
        return {
          projectId: project._id.toHexString(),
          title: project.title,
          status: project.status,
          totalTasks: totals?.totalTasks ?? 0,
          pending: totals?.pending ?? 0,
          working: totals?.working ?? 0,
          finished: totals?.finished ?? 0,
          progress: totals?.totalTasks ? Math.round((totals.finished / totals.totalTasks) * 100) : 0,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title)),
    activity: activity.days,
  };
}



