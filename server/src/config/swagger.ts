import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Taskcat App API',
      version: '0.1.0',
      description: 'API for the taskcat-app backend.',
    },
    servers: [{ url: '/', description: 'Local server' }],
    tags: [
      { name: 'Authentication', description: 'Register, login, sessions and OAuth' },
      { name: 'Users', description: 'User profiles, preferences and management' },
      { name: 'Projects', description: 'Projects, members and lifecycle' },
      { name: 'Tasks', description: 'Tasks, status, history, comments and links' },
      { name: 'Admin', description: 'Global administration: statistics, analytics and audit logs' },
      { name: 'Health', description: 'Liveness checks' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      responses: {
        BadRequest: {
          description: 'Validation or request error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Unauthorized: {
          description:
            'Missing or invalid credentials. Also returned when the token is valid but the account no longer exists or is not active (soft-deleted or deactivated), since requireAuth re-reads the account before the handler runs.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Forbidden: {
          description: 'Operation not allowed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        InternalServerError: {
          description: 'Unexpected server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          required: ['error'],
          properties: { error: { type: 'string' } },
        },
        Preferences: {
          type: 'object',
          properties: {
            theme: { type: 'string', enum: ['light', 'dark'] },
            notifications: { type: 'boolean' },
            timezone: { type: 'string' },
          },
        },
        PublicUser: {
          type: 'object',
          required: ['id', 'email', 'name', 'role', 'preferences'],
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'worker'] },
            preferences: { $ref: '#/components/schemas/Preferences' },
          },
        },
        RegisterSuccess: {
          type: 'object',
          required: ['id', 'email', 'token', 'refreshToken', 'user'],
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            token: { type: 'string', description: 'Access token (15 min)' },
            refreshToken: { type: 'string', description: 'Refresh token (7 days)' },
            user: { $ref: '#/components/schemas/PublicUser' },
          },
        },
        SessionSuccess: {
          type: 'object',
          required: ['id', 'email', 'token', 'refreshToken', 'user'],
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            token: { type: 'string', description: 'Access token (15 min)' },
            refreshToken: { type: 'string', description: 'Refresh token (7 days)' },
            user: { $ref: '#/components/schemas/PublicUser' },
          },
        },
        RefreshSuccess: {
          type: 'object',
          required: ['token', 'refreshToken'],
          properties: {
            token: { type: 'string', description: 'Access token (15 min)' },
            refreshToken: { type: 'string', description: 'New refresh token (7 days)' },
          },
        },
        LogoutSuccess: {
          type: 'object',
          required: ['success'],
          properties: { success: { type: 'boolean' } },
        },
        Project: {
          type: 'object',
          required: ['id', 'title', 'status', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            clientName: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            reason: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TaskLink: {
          type: 'object',
          required: ['id', 'taskId', 'userId', 'url', 'title', 'createdAt'],
          properties: {
            id: { type: 'string' },
            taskId: { type: 'string' },
            userId: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TaskComment: {
          type: 'object',
          required: ['id', 'taskId', 'userId', 'content', 'createdAt'],
          properties: {
            id: { type: 'string' },
            taskId: { type: 'string' },
            userId: { type: 'string' },
            content: { type: 'string', maxLength: 2000 },
            createdAt: { type: 'string', format: 'date-time' },
            editedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        TaskHistoryEntry: {
          type: 'object',
          required: ['id', 'taskId', 'userId', 'action', 'createdAt'],
          properties: {
            id: { type: 'string' },
            taskId: { type: 'string' },
            userId: { type: 'string' },
            action: { type: 'string', example: 'status_changed' },
            oldValue: { type: 'string', nullable: true },
            newValue: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          required: ['id', 'projectId', 'title', 'status', 'priority', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string' },
            projectId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['pending', 'working', 'finished'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            assignedTo: { type: 'string', nullable: true },
            estimatedHours: { type: 'number', nullable: true },
            actualHours: { type: 'number', nullable: true },
            endDate: { type: 'string', format: 'date', nullable: true },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuditLog: {
          type: 'object',
          required: ['id', 'entityType', 'entityId', 'action', 'summary', 'createdAt'],
          properties: {
            id: { type: 'string' },
            entityType: { type: 'string', enum: ['user', 'project', 'task'] },
            entityId: { type: 'string' },
            action: { type: 'string', example: 'status_changed' },
            actorId: { type: 'string', nullable: true },
            summary: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/**/*.ts',
    './src/app.ts',
    './src/index.ts',
    './dist/routes/**/*.js',
    './dist/app.js',
    './dist/index.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);