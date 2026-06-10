import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import errorhandler from 'errorhandler';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import config from './config';
import apiRouter from './router/router';
import { ApiResponse } from './router/response';
import { AppError } from './router/errors/app-error';
import { InternalError } from './router/errors/internal-error';
import { NotFoundError, UnauthorizedError } from './router/errors/http-errors';

const isProduction = config.nodeEnv === 'production';
const allowedOrigin = new URL(config.siteUrl).origin;

const buildApp = (): express.Application => {
  const app = express();

  app.use(compression());

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable COEP to avoid issues with external resources
  }));

  // Configure CORS to only allow specific origins
  const corsOptions = {
    origin(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) { return callback(null, true); }

      // Allow the configured site URL
      if (origin === config.siteUrl) {
        return callback(null, true);
      }

      // In development, allow localhost with any port
      if (!isProduction && origin && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      // In development, also allow 127.0.0.1 with any port
      if (!isProduction && origin && origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  app.use(morgan('dev'));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  if (!isProduction) {
    app.use(errorhandler());
  }

  // Origin-based CSRF protection:
  // Reject state-changing requests when an Origin header is present
  // and does not match our configured site URL.
  app.use((req, res, next) => {
    const method = req.method?.toUpperCase();
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH' && method !== 'DELETE') {
      return next();
    }

    const originHeader = req.headers.origin;
    const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
    if (!origin) {
      return next();
    }

    let requestOrigin: string;
    try {
      requestOrigin = new URL(origin).origin;
    }
    catch {
      throw new UnauthorizedError();
    }

    if (requestOrigin !== allowedOrigin) {
      throw new UnauthorizedError();
    }

    return next();
  });

  // Trust security claims of proxy in front of app
  app.set('trust proxy', true);

  // Redirect insecure requests
  app.use((req, res, next) => {
    if (
      isProduction &&
      config.siteUrl.includes('https://') &&
      !req.secure &&
      !req.get('host')?.includes('localhost')
    ) {
      console.log('Redirecting API request to HTTPS');
      return res.redirect('https://' + req.headers.host + req.originalUrl);
    }
    next();
  });

  if (!isProduction) {
    // Swagger API Documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Serve Swagger JSON
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.json(swaggerSpec);
    });
  }

  // Router
  app.use('/api', apiRouter);

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    next(new NotFoundError());
  });

  // Handle any other errors
  const apiRouterErrorHandler = (err, req, res, next) => {
    const error =
      err instanceof AppError ?
        err :
        new InternalError();

    const body: ApiResponse = {
      error: {
        code: error.code,
        errors: error.details,
      },
    };

    res.status(error.status).json(body satisfies ApiResponse);
  };

  app.use(apiRouterErrorHandler);

  return app;
};

// Export the server middleware
export default buildApp;
