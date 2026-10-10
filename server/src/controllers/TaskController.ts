import { Request, Response } from 'express';
import { AuthError } from '../services/AuthService';
import { logger } from '../config/logger';
import {
  bulkCreateTasks,
  createTask,
  createTaskComment,
  createTaskLink,
  deleteTask,
  deleteTaskComment,
  deleteTaskLink,
  filterProjectTasks,
  getTaskDetail,
  getTaskComments,
  getTaskHistory,
  getUserTaskHistory,
  getTaskLinks,
  listProjectTasks,
  searchProjectTasks,
  updateTask,
  updateTaskStatus,
} from '../services/TaskService';

function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}

export async function createTaskHandler(req: Request, res: Response) {
  const { title, description, assigned_to, priority, end_date, estimated_hours } = req.body ?? {};

  if (typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  try {
    const result = await createTask(param(req, 'projectId'), req.user!, {
      title,
      description: typeof description === 'string' ? description : undefined,
      assigned_to: typeof assigned_to === 'string' ? assigned_to : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      end_date: typeof end_date === 'string' ? end_date : undefined,
      estimated_hours: typeof estimated_hours === 'number' ? estimated_hours : undefined,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('createTask error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function bulkCreateTasksHandler(req: Request, res: Response) {
  const { tasks } = req.body ?? {};

  if (!Array.isArray(tasks)) {
    res.status(400).json({ error: 'Tasks must be an array' });
    return;
  }

  try {
    const created = await bulkCreateTasks(param(req, 'projectId'), req.user!, { tasks });
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('bulkCreateTasks error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listTasksHandler(req: Request, res: Response) {
  try {
    const { status, priority, assigned_to, search } = req.query;
    const result = await listProjectTasks(param(req, 'projectId'), req.user!, {
      status: typeof status === 'string' ? status : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      assigned_to: typeof assigned_to === 'string' ? assigned_to : undefined,
      search: typeof search === 'string' ? search : undefined,
    });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('listTasks error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function filterTasksHandler(req: Request, res: Response) {
  const { status, priority, assigned_to, page, limit } = req.query;

  try {
    const result = await filterProjectTasks(param(req, 'projectId'), req.user!, {
      status: typeof status === 'string' ? status : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      assigned_to: typeof assigned_to === 'string' ? assigned_to : undefined,
      page: page === undefined ? undefined : Number(page),
      limit: limit === undefined ? undefined : Number(limit),
    });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('filterTasks error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function searchTasksHandler(req: Request, res: Response) {
  const { search, page, limit } = req.query;

  if (typeof search !== 'string' || search.trim().length === 0) {
    res.status(400).json({ error: 'A search term is required' });
    return;
  }

  try {
    const result = await searchProjectTasks(param(req, 'projectId'), req.user!, {
      search,
      page: page === undefined ? undefined : Number(page),
      limit: limit === undefined ? undefined : Number(limit),
    });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('searchTasks error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTaskHandler(req: Request, res: Response) {
  try {
    const result = await getTaskDetail(param(req, 'projectId'), param(req, 'taskId'), req.user!);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('getTask error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserTaskHistoryHandler(req: Request, res: Response) {
  const { status, priority, from_date, to_date, page, limit } = req.query;

  try {
    const result = await getUserTaskHistory(param(req, 'id'), req.user!, {
      status: typeof status === 'string' ? status : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      from_date: typeof from_date === 'string' ? from_date : undefined,
      to_date: typeof to_date === 'string' ? to_date : undefined,
      page: page === undefined ? undefined : Number(page),
      limit: limit === undefined ? undefined : Number(limit),
    });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('getUserTaskHistory error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTaskHistoryHandler(req: Request, res: Response) {
  const { limit } = req.query;

  try {
    const result = await getTaskHistory(
      param(req, 'projectId'),
      param(req, 'taskId'),
      req.user!,
      limit === undefined ? {} : { limit: Number(limit) }
    );
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('getTaskHistory error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTaskCommentsHandler(req: Request, res: Response) {
  try {
    const result = await getTaskComments(param(req, 'projectId'), param(req, 'taskId'), req.user!);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('getTaskComments error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createTaskCommentHandler(req: Request, res: Response) {
  const { content } = req.body ?? {};

  if (typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: 'Comment content is required' });
    return;
  }

  try {
    const result = await createTaskComment(param(req, 'projectId'), param(req, 'taskId'), req.user!, { content });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('createTaskComment error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteTaskCommentHandler(req: Request, res: Response) {
  try {
    await deleteTaskComment(
      param(req, 'projectId'),
      param(req, 'taskId'),
      param(req, 'commentId'),
      req.user!
    );
    res.status(204).send();
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('deleteTaskComment error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTaskLinksHandler(req: Request, res: Response) {
  try {
    const result = await getTaskLinks(param(req, 'projectId'), param(req, 'taskId'), req.user!);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('getTaskLinks error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createTaskLinkHandler(req: Request, res: Response) {
  const { url, title, description } = req.body ?? {};

  if (typeof url !== 'string' || url.trim().length === 0) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }
  if (typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  try {
    const result = await createTaskLink(param(req, 'projectId'), param(req, 'taskId'), req.user!, {
      url,
      title,
      description: typeof description === 'string' ? description : undefined,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('createTaskLink error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteTaskLinkHandler(req: Request, res: Response) {
  try {
    await deleteTaskLink(
      param(req, 'projectId'),
      param(req, 'taskId'),
      param(req, 'linkId'),
      req.user!
    );
    res.status(204).send();
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('deleteTaskLink error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateTaskHandler(req: Request, res: Response) {
  const { title, description, assigned_to, priority, end_date, estimated_hours } = req.body ?? {};

  try {
    const result = await updateTask(param(req, 'projectId'), param(req, 'taskId'), req.user!, {
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : undefined,
      assigned_to: typeof assigned_to === 'string' ? assigned_to : assigned_to === null ? null : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
end_date: typeof end_date === 'string' ? end_date : end_date === null ? null : undefined,
        estimated_hours:
          typeof estimated_hours === 'number'
            ? estimated_hours
            : estimated_hours === null
              ? null
              : undefined,
      });
      res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('updateTask error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteTaskHandler(req: Request, res: Response) {
  try {
    await deleteTask(param(req, 'projectId'), param(req, 'taskId'), req.user!);
    res.status(204).send();
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('deleteTask error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateTaskStatusHandler(req: Request, res: Response) {
  const { status } = req.body ?? {};

  if (typeof status !== 'string' || status.length === 0) {
    res.status(400).json({ error: 'Status is required' });
    return;
  }

  try {
    const result = await updateTaskStatus(param(req, 'projectId'), param(req, 'taskId'), req.user!, { status });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('updateTaskStatus error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


