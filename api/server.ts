#!/usr/bin/env node

import http from 'node:http';
import debug from 'debug';

import { getConfig } from './config';
import bootApi from './bootstrap';

// Normalize a port into a number, string, or false.
const normalizePort = (val: string) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val; // named pipe
  }
  if (port >= 0) {
    return port; // port number
  }
  return false;
};

const onListening = (server: http.Server) => () => {
  const addr = server.address()!;
  const bind =
    typeof addr === 'string' ?
      'pipe ' + addr :
      'port ' + addr.port;
  debug('Listening on ' + bind);
};

const startServer = async () => {
  const port = normalizePort(getConfig().apiPort || '8080');

  const onError = (error: any) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind =
      typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break; // eslint rule
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break; // eslint rule
    default:
      throw error;
    }
  };

  const app = await bootApi();

  app.set('port', port);

  // Create HTTP server.
  const server = http.createServer(app);

  // Listen on provided port, on all network interfaces.
  server.on('error', onError);
  server.on('listening', onListening(server));
  server.listen(port);
};

startServer();
