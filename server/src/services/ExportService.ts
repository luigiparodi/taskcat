import ExcelJS from 'exceljs';
import { ObjectId } from 'mongodb';
import { getProjectCollection, getProjectMemberCollection } from '../models/Project';
import { getTaskCollection } from '../models/Task';
import { getUserCollection } from '../models/User';
import { AuthError } from './AuthService';
import { getProjectAccess } from './ProjectService';

const STATUS_COLORS: Record<string, string> = {
  pending: 'FFF2CC',
  working: 'DDEBF7',
  finished: 'E2EFDA',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'E2EFDA',
  medium: 'FFF2CC',
  high: 'FCE4D6',
  urgent: 'F8CBAD',
};

export async function exportProjectToExcel(
  projectId: string,
  requester: { userId: string; role: string }
): Promise<Buffer> {
  const access = await getProjectAccess(projectId, requester);
  const project = access.project;

  const tasks = await getTaskCollection()
    .find({ projectId: project._id as ObjectId })
    .sort({ createdAt: -1 })
    .toArray();

  const memberships = await getProjectMemberCollection()
    .find({ projectId: project._id as ObjectId })
    .toArray();
  const userIds = memberships.map((m) => m.userId as ObjectId);
  const users = userIds.length
    ? await getUserCollection().find({ _id: { $in: userIds } }).toArray()
    : [];
  const userMap = new Map(users.map((u) => [(u._id as ObjectId).toHexString(), u]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TaskCat';
  workbook.created = new Date();
  workbook.title = `${project.title} — Export`;

  // ---------- Project sheet ----------
  const projectSheet = workbook.addWorksheet('Project', {
    properties: { tabColor: { argb: '1F4E79' } },
  });
  projectSheet.columns = [{ width: 26 }, { width: 74 }];

  const titleRow = projectSheet.addRow([`TaskCat — ${project.title}`]);
  titleRow.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };
  titleRow.height = 26;
  projectSheet.mergeCells('A1:B1');

  const kvRows: Array<[string, string | number]> = [
    ['Title', project.title ?? ''],
    ['Description', project.description ?? '—'],
    ['Client', project.clientName ?? '—'],
    ['Status', (project.status ?? '').toString().toUpperCase()],
    ['Start date', project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'],
    ['End date', project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'],
    ['Members', memberships.length],
    ['Total tasks', tasks.length],
    ['Pending', tasks.filter((t) => t.status === 'pending').length],
    ['Working', tasks.filter((t) => t.status === 'working').length],
    ['Finished', tasks.filter((t) => t.status === 'finished').length],
    ['Created', project.createdAt ? new Date(project.createdAt).toLocaleString() : '—'],
    ['Last updated', project.updatedAt ? new Date(project.updatedAt).toLocaleString() : '—'],
  ];

  for (const [key, value] of kvRows) {
    const row = projectSheet.addRow([key, value]);
    row.getCell(1).font = { bold: true, color: { argb: '1F4E79' } };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCE6F1' } };
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  }

  // ---------- Members sheet ----------
  const membersSheet = workbook.addWorksheet('Members', {
    properties: { tabColor: { argb: '548235' } },
  });
  membersSheet.columns = [
    { header: 'Name', key: 'name', width: 28 },
    { header: 'Email', key: 'email', width: 34 },
    { header: 'Role', key: 'role', width: 12 },
    { header: 'Joined', key: 'joined', width: 18 },
  ];
  styleHeader(membersSheet.getRow(1));
  for (const m of memberships) {
    const u = userMap.get((m.userId as ObjectId).toHexString());
    membersSheet.addRow({
      name: u?.name ?? 'Unknown',
      email: u?.email ?? '',
      role: m.role,
      joined: m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '',
    });
  }
  membersSheet.autoFilter = { from: 'A1', to: 'D1' };
  membersSheet.views = [{ state: 'frozen', ySplit: 1 }];

  // ---------- Tasks sheet ----------
  const tasksSheet = workbook.addWorksheet('Tasks', {
    properties: { tabColor: { argb: 'BF8F00' } },
  });
  tasksSheet.columns = [
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Description', key: 'description', width: 52 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Assignee', key: 'assignee', width: 24 },
    { header: 'Estimated (h)', key: 'estimated', width: 15 },
    { header: 'Actual (h)', key: 'actual', width: 13 },
    { header: 'Due date', key: 'due', width: 14 },
    { header: 'Created', key: 'created', width: 18 },
    { header: 'Updated', key: 'updated', width: 18 },
  ];
  styleHeader(tasksSheet.getRow(1));
  for (const task of tasks) {
    const assignee = task.assignedTo
      ? userMap.get(task.assignedTo.toHexString())?.name ?? 'Unknown'
      : 'Unassigned';
    const row = tasksSheet.addRow({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      assignee,
      estimated: task.estimatedHours ?? '',
      actual: task.actualHours ?? '',
      due: task.endDate ? new Date(task.endDate).toLocaleDateString() : '',
      created: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '',
      updated: task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : '',
    });
    const statusCell = row.getCell(3);
    statusCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: STATUS_COLORS[task.status] ?? 'FFFFFF' },
    };
    statusCell.font = { bold: true };
    const priorityCell = row.getCell(4);
    priorityCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: PRIORITY_COLORS[task.priority] ?? 'FFFFFF' },
    };
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  }
  tasksSheet.autoFilter = { from: 'A1', to: 'J1' };
  tasksSheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };
  row.alignment = { vertical: 'middle', horizontal: 'left' };
  row.height = 22;
}