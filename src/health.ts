import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from './logger.js';

interface PackageJson {
  version?: string;
}

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  memoryUsage: number; // in megabytes
  timestamp: string; // ISO format
  version?: string;
}

const logger = createLogger('health');

export function getHealthStatus(): HealthStatus {
  const version: string | undefined = extractPackageVersion();
  const memoryUsageMB: number = getMemoryUsageMB();
  const uptime: number = Number(process.uptime().toFixed(2));

  const status: HealthStatus = {
    status: 'ok',
    uptime: uptime,
    memoryUsage: memoryUsageMB,
    timestamp: new Date().toISOString(),
    version: version,
  };

  logger.info(`Health status fetched at ${status.timestamp}. Uptime: ${uptime} seconds, Memory Usage: ${memoryUsageMB} MB, Version: ${version ?? 'N/A'}`);
  logMemoryUsageWarnings(memoryUsageMB);

  return status;
}

function extractPackageVersion(): string | undefined {
  const packageJsonPath: string = join(process.cwd(), 'package.json');
  try {
    const packageJsonContent: string = readFileSync(packageJsonPath, 'utf-8');
    const packageJson: PackageJson = JSON.parse(packageJsonContent);
    const version: string = packageJson.version ?? 'unknown';
    logger.debug(`Package version extracted: ${version}`);
    return version !== 'unknown' ? version : undefined;
  } catch (error: unknown) {
    logger.error(`Failed to handle package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return undefined;
  }
}

function getMemoryUsageMB(): number {
  return Number((process.memoryUsage().heapUsed / 1048576).toFixed(2));
}

function logMemoryUsageWarnings(memoryUsage: number): void {
  if (memoryUsage > 700) {
    logger.error(`Critical memory usage detected: ${memoryUsage} MB. Immediate attention required!`);
  } else if (memoryUsage > 500) {
    logger.warn(`High memory usage detected: ${memoryUsage} MB. Consider investigating memory usage.`);
  } else if (memoryUsage > 300) {
    logger.info(`Moderate memory usage: ${memoryUsage} MB. Running smoothly but keep monitoring.`);
  } else {
    logger.info(`Normal memory usage: ${memoryUsage} MB. System is healthy.`);
  }
}
