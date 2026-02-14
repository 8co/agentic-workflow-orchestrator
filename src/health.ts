import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from './logger.js';

type PackageJson = {
  version?: string;
};

type HealthStatus = {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  memoryUsage: number; // in megabytes
  timestamp: string; // ISO format
  version?: string;
};

const logger = createLogger('health');

export function getHealthStatus(): HealthStatus {
  const version = extractPackageVersion();
  const memoryUsageMB = getMemoryUsageMB();

  const status: HealthStatus = {
    status: 'ok',
    uptime: Number(process.uptime().toFixed(2)),
    memoryUsage: memoryUsageMB,
    timestamp: new Date().toISOString(),
    version: version,
  };

  logger.info(`Status fetched: ${JSON.stringify(status)}`);
  logMemoryUsageWarnings(memoryUsageMB);

  return status;
}

function extractPackageVersion(): string | undefined {
  const packageJsonPath = join(process.cwd(), 'package.json');
  try {
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    const packageJson: PackageJson = JSON.parse(packageJsonContent);
    const version = packageJson.version ?? 'unknown';
    logger.debug(`Package version extracted: ${version}`);
    return version !== 'unknown' ? version : undefined;
  } catch (error) {
    logger.error(`Failed to handle package.json: ${(error as Error).message}`);
    return undefined;
  }
}

function getMemoryUsageMB(): number {
  return Number((process.memoryUsage().heapUsed / 1048576).toFixed(2));
}

function logMemoryUsageWarnings(memoryUsage: number): void {
  if (memoryUsage > 700) {
    logger.error(`Critical memory usage detected: ${memoryUsage} MB`);
  } else if (memoryUsage > 500) {
    logger.warn(`High memory usage detected: ${memoryUsage} MB`);
  } else if (memoryUsage > 300) {
    logger.info(`Moderate memory usage: ${memoryUsage} MB`);
  } else {
    logger.info(`Normal memory usage: ${memoryUsage} MB`);
  }
}
