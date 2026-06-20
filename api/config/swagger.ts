import swaggerJSDoc from 'swagger-jsdoc';
import { generateOpenApiPaths } from '../http/openapi/generate';
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

// Options for the swagger docs
// Paths are relative to the api directory (where the server runs from)
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './router/routes/*.ts',
    './mongoose/schemas/*.ts',
  ],
};

// Initialize swagger-jsdoc for the routers still using hand-written JSDoc.
const swaggerSpec = swaggerJSDoc(options) as Record<string, any>;

// Overlay the paths generated from migrated, schema-driven route tables. These
// take precedence over any JSDoc for the same path (there should be none, since
// migrated routers have their JSDoc removed).
const generated = generateOpenApiPaths(documentedRoutes);
swaggerSpec.paths = { ...swaggerSpec.paths, ...generated.paths };

export default swaggerSpec;
