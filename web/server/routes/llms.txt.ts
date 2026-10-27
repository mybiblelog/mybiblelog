// An llms.txt (https://llmstxt.org) so AI agents can find the API without
// crawling the app. Served dynamically, like robots.txt, because the links must
// be absolute and the site origin comes from runtime config.
export default defineEventHandler((event) => {
  const siteUrl = (useRuntimeConfig().public.siteUrl as string) || getRequestURL(event).origin;
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8');
  return `# My Bible Log

> A free Bible reading tracker and journal. People log the passages they read each day, see their progress through the Bible, and write notes about passages, organized with tags.

An AI agent can act for a user through the HTTP API with a personal access token the user creates in Settings → Tokens (${siteUrl}/settings/access-tokens). Each token carries only the scopes the user chose (reading log, notes, Scripture text), expires, and can be revoked at any time. A token can never change the account, its password, email or settings, so never ask a user for their password.

## API

- [OpenAPI specification](${siteUrl}/api/openapi.json): the full API (operations that list \`x-required-scopes\` accept an access token), with a guide to authentication, dates and USFM passage references (e.g. JHN.3.16-18) in its description
- [MCP server](https://github.com/mybiblelog/mybiblelog/tree/main/mcp): Model Context Protocol tools for logging reading, summarizing progress, and taking and organizing notes

## About

- [About My Bible Log](${siteUrl}/about/overview)
- [Frequently asked questions](${siteUrl}/faq)
`;
});
