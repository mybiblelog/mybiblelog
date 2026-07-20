#!/usr/bin/env node

// Runs the Nuxt (Nitro) server standalone, for the legacy two-process
// topology (`npm run start:legacy`). The production build uses the
// 'node-listener' Nitro preset, whose output exports a request handler
// instead of listening on its own — this wrapper restores the old
// self-listening behavior so the same build artifact works in both the
// single-process and two-process modes.

import http from 'node:http';

const { listener } = await import(
  new URL('../web/.output/server/index.mjs', import.meta.url).href
);

const port = parseInt(process.env.PORT || '3000', 10);

http.createServer(listener).listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});
