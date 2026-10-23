import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

export function createApp() {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    })
  );

  // CORS configuration for React Web, Flutter Mobile, and local dev
  const allowedOrigins = config.clientUrls;
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps, postman, curl (which have no origin header)
        if (!origin) return callback(null, true);

        // Allow localhost origins, custom Flutter web origins, capacitor
        if (
          allowedOrigins.includes(origin) ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'x-refresh-token',
      ],
    })
  );

  // Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Static serving for local uploads (avatars fallback)
  app.use('/uploads', express.static(path.resolve(config.uploadDir)));

  // Root welcome / info
  app.get('/', (_req, res) => {
    res.json({
      name: 'Match My Jobs API',
      version: '1.0.0',
      description: 'Phase 1 - Auth & Profiles REST API',
      docs: '/api/health',
    });
  });

  // Mount API routes at both / and /api for client flexibility
  app.use('/api', routes);
  app.use('/', routes);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
