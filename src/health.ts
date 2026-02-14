import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from './logger.js';

type HealthStatus = {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  memoryUsage: number; // in megabytes
  timestamp: string; // ISO format
  version: string;
};

const logger = createLogger('health');

export function getHealthStatus(): HealthStatus {
  const packageJsonPath = join(process.cwd(), 'package.json');
  let version: string = 'unknown';

  try {
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    try {
      const packageJson: { version?: string } = JSON.parse(packageJsonContent);
      version = packageJson.version ?? 'unknown';
      logger.debug(`Health: Package version extracted: ${version}`);
    } catch (jsonError) {
      logger.error(`Health: Failed to parse package.json: ${(jsonError as Error).message}`);
    }
  } catch (fsError) {
    logger.error(`Health: Failed to read package.json: ${(fsError as Error).message}`);
  }

  const status: HealthStatus = {
    status: 'ok',
    uptime: Number(process.uptime().toFixed(2)),
    memoryUsage: Number((process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2)), // converting bytes to MB
    timestamp: new Date().toISOString(), // ISO 8601 formatted string
    version,
  };

  logger.info(`Health: Status fetched: ${JSON.stringify(status)}`);

  if (status.memoryUsage > 500) {
    logger.warn(`Health: High memory usage detected: ${status.memoryUsage} MB`);
  }

  return status;
}
