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
  const version = extractPackageVersion();
  const memoryUsageMB = getSafeMemoryUsageMB();
  const uptime = Number(process.uptime().toFixed(2));

  const status: HealthStatus = {
    status: 'ok',
    uptime,
    memoryUsage: memoryUsageMB,
    timestamp: new Date().toISOString(),
    version,
  };

  logHealthStatus(uptime, memoryUsageMB, version);
  logMemoryUsageWarnings(memoryUsageMB);

  return status;
}

function extractPackageVersion(): string | undefined {
  const packageJsonPath = join(process.cwd(), 'package.json');
  try {
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent) as PackageJson;
    const version = packageJson.version ?? 'unknown';
    logger.debug(`Package version extracted: ${version}`);
    return version !== 'unknown' ? version : undefined;
  } catch (error) {
    logger.error(`Failed to read or parse package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return undefined;
  }
}

function getSafeMemoryUsageMB(): number {
  try {
    const heapUsed = process.memoryUsage().heapUsed;
    if (isNaN(heapUsed)) throw new Error('Heap used is NaN');
    return Number((heapUsed / 1048576).toFixed(2));
  } catch (error) {
    logger.error(`Error retrieving memory usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 0; // return 0 if there is an error retrieving memory usage
  }
}

function logHealthStatus(uptime: number, memoryUsageMB: number, version?: string): void {
  logger.info(`Health status fetched at ${new Date().toISOString()}. Uptime: ${uptime} seconds, Memory Usage: ${memoryUsageMB} MB, Version: ${version ?? 'N/A'}`);
}

function logMemoryUsageWarnings(memoryUsage: number): void {
  const warnings = [
    { threshold: 700, level: 'error', message: 'Critical memory usage detected: {memoryUsage} MB. Immediate attention required!' },
    { threshold: 500, level: 'warn', message: 'High memory usage detected: {memoryUsage} MB. Consider investigating memory usage.' },
    { threshold: 300, level: 'info', message: 'Moderate memory usage: {memoryUsage} MB. Running smoothly but keep monitoring.' },
  ];

  for (const { threshold, level, message } of warnings) {
    if (memoryUsage > threshold) {
      logger[level as keyof typeof logger](message.replace('{memoryUsage}', memoryUsage.toString()));
      return;
    }
  }
  
  logger.info(`Normal memory usage: ${memoryUsage} MB. System is healthy.`);
}
