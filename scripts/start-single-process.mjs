#!/usr/bin/env node

// Production entry point that serves the Express API and the Nuxt (Nitro)
// app from ONE Node process. Running a single process instead of the old
// npm-run-all pair keeps the dyno under Heroku's 512MB cap (one V8 baseline,
// no resident npm process tree) and removes the /api proxy hop entirely:
// requests are dispatched in-process to whichever handler owns the path.
//
// Requires the web workspace to be built with the 'node-listener' Nitro
// preset (see web/nuxt.config.ts), which exports a request handler instead
// of starting its own server. Rollback path: `npm run start:legacy`.

import http from 'node:http';

const apiModule = await import(
  new URL('../api/dist/bootstrap.js', import.meta.url).href
);
const { bootApi, closeConnection } = apiModule;
if (typeof bootApi !== 'function' || typeof closeConnection !== 'function') {
  throw new Error('api/dist/bootstrap.js did not expose bootApi/closeConnection — was the API built?');
}

// Boot the API fully (Mongo connection, indexes, email + reminder services)
// before accepting any traffic. On failure, crash so Heroku restarts the
// dyno rather than serving requests against a broken backend.
let apiApp;
try {
  apiApp = await bootApi();
}
catch (error) {
  console.error('API boot failed:', error);
  process.exit(1);
}

// SSR-internal fetches of '/api/**' route through Nitro's internal router and
// hit the baked '/api/**' proxy routeRule targeting localhost:API_PORT (see
// web/nuxt.config.ts). Keep a loopback-only Express listener on that port so
// those fetches work; external /api traffic never touches it — the main
// server below dispatches it to Express directly.
const apiPort = parseInt(process.env.API_PORT || '8080', 10);
const apiServer = http.createServer(apiApp);
apiServer.listen(apiPort, '127.0.0.1', () => {
  console.log(`Internal API listener (SSR proxy target) on 127.0.0.1:${apiPort}`);
});

const { listener } = await import(
  new URL('../web/.output/server/index.mjs', import.meta.url).href
);

// Only true /api requests go to Express — a bare startsWith('/api') would
// also capture unrelated paths like /api-docs.
const isApiRequest = (url) =>
  url === '/api' || url.startsWith('/api/') || url.startsWith('/api?');

const port = parseInt(process.env.PORT || '3000', 10);

const server = http.createServer((req, res) => {
  if (isApiRequest(req.url ?? '')) {
    return apiApp(req, res);
  }
  return listener(req, res);
});

server.listen(port, () => {
  console.log(`Single-process server (web + api) listening on port ${port}`);
});

// Heroku sends SIGTERM and allows 30s before SIGKILL (dynos also restart
// daily). Stop accepting connections, close Mongo, then exit — with a
// failsafe in case an open connection keeps server.close() hanging.
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  setTimeout(() => process.exit(0), 10 * 1000).unref();
  apiServer.close();
  server.close(() => {
    closeConnection()
      .catch((error) => console.error('Error closing Mongo connection:', error))
      .finally(() => process.exit(0));
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
