import { ACCESS_TOKEN_SCOPES } from '@mybiblelog/shared';
import { generateOpenApiPaths, generateOpenApiComponents, type SpecAudience } from '../http/openapi/generate';
import { documentedRoutes } from '../http/routes';

/**
 * Orientation for whoever reads the spec cold, an AI agent most of all: the
 * conventions every operation shares but no single schema states.
 */
const API_GUIDE = `
API for My Bible Log, a Bible reading tracker and journal. A user logs the passages
they read each day and writes notes about passages, organized with tags.

## Authentication

Send \`Authorization: Bearer <token>\`. Two kinds of token are accepted:

- **Personal access token** (\`mbl_pat_…\`): what scripts and AI agents should use. The
  user creates one in Settings → Tokens, choosing its scopes and lifetime, and can
  revoke it there at any time. A token works only on operations that list
  \`x-required-scopes\`, and only when it holds every scope listed. Account, sign-in,
  password, email, settings-change, reminder and admin operations never accept one.
- **Session token**: the JWT the web and mobile apps get from signing in. Do not ask a
  user for their password or session token; ask them to create an access token instead.

Scopes: ${ACCESS_TOKEN_SCOPES.map((scope) => `\`${scope}\``).join(', ')}. \`notes:*\` covers
notes and tags. \`logs:read\` also allows reading the user's settings, which hold their
daily verse goal and the look-back date their progress is measured from.

## Responses

Success bodies are \`{ "data": … }\`. Errors are \`{ "error": { "code", "errors": [{ "field",
"code", "properties" }] } }\`, where \`code\` is a stable machine-readable string.
\`401\` means the token is missing, expired or revoked. \`403\` means the token lacks a
scope (or the operation never accepts access tokens). \`429\` means slow down: access
tokens are rate-limited per token and per operation.

## Dates

\`date\` fields are the user's own calendar day as \`YYYY-MM-DD\`, with no time or time
zone. "Today" means today where the user lives, so use their local date, not UTC.

## Passages

Prefer USFM references (\`passage\`) over the integer verse IDs. The grammar is
\`BOOK\`, \`BOOK.C\`, \`BOOK.C-C\`, \`BOOK.C.V\`, \`BOOK.C.V-V\` or \`BOOK.C.V-C.V\`, with
uppercase three-character USFM book codes, e.g. \`GEN\`, \`PSA.23\`, \`JHN.3.16-18\`,
\`1CO.13\`, \`GEN.1.1-2.3\`. A reference covers exactly one book, so a reading that spans
books is sent as one entry per book. Responses always give the shortest form, so compare
passages by their verse IDs, never as strings. Chapter and verse numbers follow the
English (NASB) versification: for example \`MAL.4\` exists and \`3JN.1.15\` does not.

## Operations to confirm first

Operations marked \`x-destructive\` delete data permanently. Confirm with the user before
calling one, and say exactly what will be deleted.
`.trim();

const tags = [
  { name: 'Authentication', description: 'Sign-in, registration and account security (session tokens only)' },
  { name: 'LogEntries', description: 'The reading log: one entry per passage read on a given date' },
  { name: 'PassageNotes', description: 'Notes the user has written, each about zero or more passages and tagged with zero or more tags' },
  { name: 'PassageNoteTags', description: 'Tags the user organizes notes with' },
  { name: 'Settings', description: 'User settings and account deletion' },
  { name: 'Scripture', description: 'Bible text for a passage, in chunks' },
  { name: 'Reminders', description: 'Daily reminder emails (session tokens only)' },
  { name: 'Feedback', description: 'Submitting feedback (authentication optional)' },
  { name: 'Admin', description: 'Admin-only endpoints' },
  { name: 'Sitemap', description: 'Public sitemap generation' },
  { name: 'Mobile', description: 'Mobile app upgrade checks' },
  { name: 'AccessTokens', description: 'Managing personal access tokens (session tokens only)' },
];

/**
 * Builds the OpenAPI document. Paths are generated from the schema-driven route
 * tables, and the component schemas (error envelopes plus every entity) from the
 * same zod schemas the handlers use.
 *
 * `audience: 'public'` is the spec served in production at `/api/openapi.json`;
 * it leaves out routes marked `docs.internal` and their tags.
 */
export const buildOpenApiSpec = (
  { audience = 'all', serverUrl = '/api' }: { audience?: SpecAudience; serverUrl?: string } = {},
) => {
  const { paths } = generateOpenApiPaths(documentedRoutes, { audience });
  const usedTags = new Set(Object.values(paths).flatMap((ops: any) => Object.values(ops).flatMap((op: any) => op.tags ?? [])));

  return {
    openapi: '3.0.0',
    info: {
      title: 'My Bible Log API',
      version: '1.0.0',
      description: API_GUIDE,
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'My Bible Log Support',
      },
    },
    servers: [{ url: serverUrl, description: 'API Server' }],
    tags: tags.filter((tag) => usedTags.has(tag.name)),
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Session token from signing in to the web or mobile app (`/auth/login`, `/auth/oauth2/google/*`).',
        },
        accessToken: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'mbl_pat_…',
          description: 'Personal access token the user creates in Settings → Tokens. Accepted only on operations that list `x-required-scopes`, and only with every scope listed.',
        },
      },
      schemas: generateOpenApiComponents().schemas,
    },
  };
};

const swaggerSpec = buildOpenApiSpec();

export default swaggerSpec;
