import { app } from './app.js';
import { config } from './config.js';
import { closeDatabase } from './db.js';

const server = app.listen(config.port, () => {
  console.log(`CommonTime server listening on port ${config.port}`);
});

server.on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}. Shutting down.`);

  const forceExitTimer = setTimeout(() => process.exit(1), 10000);
  forceExitTimer.unref();

  server.close(async () => {
    try {
      await closeDatabase();
    } catch (error) {
      console.error('Failed to close the database pool:', error);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
