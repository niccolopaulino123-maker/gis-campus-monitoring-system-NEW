/**
 * Hand-authored OpenAPI 3.0 spec for the Campus Environmental Monitoring API.
 * Served at /api/openapi and rendered by Swagger UI at /docs.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ICCT Binangonan — Campus Environmental Monitoring API',
    version: '1.0.0',
    description:
      'Serverless REST API for environmental issue reports and user role ' +
      'management. All endpoints require a Firebase ID token sent as ' +
      '`Authorization: Bearer <token>`. Role management endpoints require the ' +
      '`admin` role.',
  },
  servers: [{ url: '/api', description: 'Serverless API (Next.js route handlers)' }],
  tags: [
    { name: 'Issues', description: 'Environmental issue reports' },
    { name: 'Roles', description: 'User role administration (admin only)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Firebase ID token',
      },
    },
    schemas: {
      Issue: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          category: {
            type: 'string',
            enum: ['waste', 'drainage', 'maintenance', 'electrical', 'safety', 'other'],
          },
          title: { type: 'string' },
          description: { type: 'string' },
          locationName: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          status: { type: 'string', enum: ['open', 'in_progress', 'resolved'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          imageUrls: { type: 'array', items: { type: 'string', format: 'uri' } },
          reportedBy: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      NewIssue: {
        type: 'object',
        required: ['category', 'title', 'description', 'locationName', 'lat', 'lng', 'priority'],
        properties: {
          category: {
            type: 'string',
            enum: ['waste', 'drainage', 'maintenance', 'electrical', 'safety', 'other'],
          },
          title: { type: 'string', example: 'Overflowing trash bin' },
          description: { type: 'string', example: 'Bin near Canteen is overflowing.' },
          locationName: { type: 'string', example: 'Canteen' },
          lat: { type: 'number', example: 930 },
          lng: { type: 'number', example: 625 },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
          imageUrls: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
            example: ['https://res.cloudinary.com/duno60adn/image/upload/sample.jpg'],
          },
        },
      },
      StatusUpdate: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['open', 'in_progress', 'resolved'] },
        },
      },
      UserRecord: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'student', 'maintenance'] },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RoleAssignment: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: { type: 'string', example: 'student@icct.edu.ph' },
          role: {
            type: 'string',
            enum: ['admin', 'student', 'maintenance'],
            example: 'student',
          },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/issues': {
      get: {
        tags: ['Issues'],
        summary: 'List all environmental issues',
        responses: {
          '200': {
            description: 'Array of issues',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Issue' } },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Issues'],
        summary: 'Create a new environmental issue report',
        description: 'Requires role: admin or student.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/NewIssue' } },
          },
        },
        responses: {
          '201': {
            description: 'Created issue',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Issue' } },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/issues/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      patch: {
        tags: ['Issues'],
        summary: 'Update an issue status',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/StatusUpdate' } },
          },
        },
        responses: {
          '200': {
            description: 'Updated issue',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Issue' } },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Issues'],
        summary: 'Delete an issue report',
        description: 'Requires role: admin.',
        responses: {
          '204': { description: 'Deleted' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/roles': {
      get: {
        tags: ['Roles'],
        summary: 'List users and their roles',
        description: 'Requires role: admin.',
        responses: {
          '200': {
            description: 'Array of user records',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/UserRecord' } },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Roles'],
        summary: 'Assign a role to a user (by email)',
        description:
          'Sets a Firebase Auth custom claim and mirrors it to the `users` ' +
          'Firestore collection. Requires role: admin.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RoleAssignment' } },
          },
        },
        responses: {
          '200': {
            description: 'Updated user record',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UserRecord' } },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
} as const

// Shared response components referenced above.
;(openApiSpec.components as Record<string, unknown>).responses = {
  Unauthorized: {
    description: 'Missing or invalid token',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  },
  Forbidden: {
    description: 'Insufficient role',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  },
  BadRequest: {
    description: 'Invalid request body',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  },
  NotFound: {
    description: 'Resource not found',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  },
}
