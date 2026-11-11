import { generateOpenApiPaths, generateOpenApiComponents } from '../http/openapi/generate';
import { documentedRoutes } from '../http/routes';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'My Bible Log API',
    version: '1.0.0',
    description: 'API documentation for the My Bible Log application. '
      + 'Passages can be sent as USFM references (`JHN.3.16-18`) in place of integer verse IDs, and responses include both. '
      + '[Guide for scripts and AI agents](/about/how-to--use-an-ai-agent-with-my-bible-log).',
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
        description: 'JWT bearer token, valid for 30 days. `POST /auth/login` returns it as `data.token` (omitted for requests that send `X-Platform: web`, which get a cookie instead).',
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

const INTERNAL_TAGS = new Set(['Admin', 'Test', 'Sitemap', 'Mobile']);

const isInternalOperation = (operation: { tags?: string[] }): boolean =>
  operation.tags?.some((tag) => INTERNAL_TAGS.has(tag)) ?? false;

// Published spec for third-party clients: routes only our own apps, crawlers, or
// admins can use would just mislead them.
export const publicSwaggerSpec = {
  ...swaggerSpec,
  paths: Object.fromEntries(
    Object.entries(swaggerSpec.paths).flatMap(([path, operations]) => {
      const publicOperations = Object.fromEntries(
        Object.entries(operations).filter(([, operation]) => !isInternalOperation(operation as { tags?: string[] })),
      );
      return Object.keys(publicOperations).length ? [[path, publicOperations]] : [];
    }),
  ),
};

export default swaggerSpec;
