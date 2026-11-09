import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config } from './config.js';
import { checkDatabase } from './db.js';
import { ApiError } from './lib/http.js';
import pollsRouter from './routes/polls.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'same-origin');
  next();
});

app.get('/health', async (request, response) => {
  try {
    await checkDatabase();
    response.status(200).json({
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString(),
    });
  } catch {
    response.status(503).json({
      status: 'error',
      database: 'down',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/polls', pollsRouter);

app.use('/api', (request, response) => {
  response.status(404).json({
    error: {
      code: 'API_NOT_FOUND',
      message: 'API endpoint not found.',
    },
  });
});

if (existsSync(config.clientDistPath)) {
  app.use(
    express.static(config.clientDistPath, {
      index: false,
      maxAge: config.nodeEnv === 'production' ? '1h' : 0,
    }),
  );

  app.get('*', (request, response) => {
    response.sendFile(path.join(config.clientDistPath, 'index.html'));
  });
}

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);

  if (error instanceof ApiError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    response.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON.',
      },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred.',
    },
  });
});

export default app;
