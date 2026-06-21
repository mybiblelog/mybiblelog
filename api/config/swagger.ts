import { generateOpenApiPaths, generateOpenApiComponents } from '../http/openapi/generate';
import { documentedRoutes } from '../http/routes';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'My Bible Log API',
    version: '1.0.0',
    description: 'API documentation for the My Bible Log application',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'My Bible Log Support',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication. Obtain a token by logging in via /auth/login or /auth/google endpoints.',
      },
    },
  },
  // This applies bearerAuth globally - individual endpoints can override
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Endpoints for user authentication, registration, and account management',
    },
    {
      name: 'LogEntries',
      description: 'Endpoints for managing Bible reading log entries (requires authentication)',
    },
    {
      name: 'PassageNotes',
      description: 'Endpoints for managing passage notes (requires authentication)',
    },
    {
      name: 'PassageNoteTags',
      description: 'Endpoints for managing passage note tags (requires authentication)',
    },
    {
      name: 'Settings',
      description: 'Endpoints for managing user settings (requires authentication)',
    },
    {
      name: 'Reminders',
      description: 'Endpoints for managing daily reminders (requires authentication)',
    },
    {
      name: 'Feedback',
      description: 'Endpoints for submitting feedback (authentication optional)',
    },
    {
      name: 'Admin',
      description: 'Admin-only endpoints (requires authentication with admin privileges)',
    },
    {
      name: 'Sitemap',
      description: 'Public endpoints for sitemap generation',
    },
  ],
};

// The spec is assembled entirely programmatically: paths are generated from the
// schema-driven route tables, and the component schemas (error envelopes plus
// every entity) are generated from the same zod schemas the handlers use.
const swaggerSpec = {
  ...swaggerDefinition,
  paths: generateOpenApiPaths(documentedRoutes).paths,
  components: {
    ...swaggerDefinition.components,
    schemas: generateOpenApiComponents().schemas,
  },
};

export default swaggerSpec;
