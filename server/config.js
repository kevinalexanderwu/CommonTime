import 'dotenv/config';
import path from 'node:path';

function readInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: readInteger(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientDistPath: process.env.CLIENT_DIST_PATH
    ? path.resolve(process.env.CLIENT_DIST_PATH)
    : path.resolve(process.cwd(), 'dist'),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: readInteger(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'commontime',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'commontime',
  },
};
