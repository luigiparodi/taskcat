import { Request, Response } from 'express';
import { AuthError } from '../services/AuthService';
import {
  activateProject,
  addProjectMembers,
  createProject,
  deactivateProject,
  deleteProject,
  getProjectDetail,
  listAvailableUsers,
  listProjectMembers,
  listProjects,
  removeProjectMember,
  updateProject,
} from '../services/ProjectService';
import { getProjectStatistics } from '../services/StatisticsService';
import { logger } from '../config/logger';

export async function createProjectHandler(req: Request, res: Response) {
  const { title, description, clientName, startDate, endDate } = req.body ?? {};

  if (typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  try {
    const result = await createProject(req.user!, {
      title,
      description: typeof description === 'string' ? description : undefined,
      clientName: typeof clientName === 'string' ? clientName : undefined,
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('createProject error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listProjectsHandler(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const result = await listProjects(req.user!, { page, limit, search, status });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('listProjects error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProjectHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getProjectDetail(id, req.user!);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('getProject error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProjectHandler(req: Request, res: Response) {
  const { title, description, clientName, startDate, endDate } = req.body ?? {};

  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await updateProject(id, req.user!, {
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : undefined,
      clientName: typeof clientName === 'string' ? clientName : undefined,
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
    });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('updateProject error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteProjectHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteProject(id, req.user!);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('deleteProject error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deactivateProjectHandler(req: Request, res: Response) {
  const { reason } = req.body ?? {};

  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deactivateProject(id, req.user!, typeof reason === 'string' ? reason : undefined);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('deactivateProject error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function activateProjectHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await activateProject(id, req.user!);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('activateProject error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listMembersHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await listProjectMembers(id, req.user!);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('listMembers error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listAvailableUsersHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const result = await listAvailableUsers(id, req.user!, { page, limit, search });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('listAvailableUsers error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProjectStatisticsHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getProjectStatistics(id, req.user!);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('getProjectStatistics error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addMembersHandler(req: Request, res: Response) {  const { userIds } = req.body ?? {};

  if (!Array.isArray(userIds) || userIds.some((id) => typeof id !== 'string')) {
    res.status(400).json({ error: 'userIds must be an array of strings' });
    return;
  }

  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await addProjectMembers(id, req.user!, userIds);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('addMembers error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeMemberHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const memberId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const result = await removeProjectMember(id, req.user!, memberId);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('removeMember error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


