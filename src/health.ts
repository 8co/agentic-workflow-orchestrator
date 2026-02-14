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
  let version: string | undefined;
  let memoryUsageMB: number = 0;
  let status: 'ok' | 'degraded' = 'ok';
  
  try {
    version = extractPackageVersion();
  } catch (error) {
    logger.error(`Version extraction error: Failed to parse package.json for version. ${error instanceof Error ? error.message : 'Unknown error'}`);
    status = 'degraded';
  }
  
  try {
    memoryUsageMB = getSafeMemoryUsageMB();
  } catch (error) {
    logger.error(`Memory usage retrieval error: Unable to calculate memory usage. ${error instanceof Error ? error.message : 'Unknown error'}`);
    status = 'degraded';
  }

  const uptime = Number(process.uptime().toFixed(2));

  const healthStatus: HealthStatus = {
    status,
    uptime,
    memoryUsage: memoryUsageMB,
    timestamp: new Date().toISOString(),
    version,
  };

  try {
    logHealthStatus(uptime, memoryUsageMB, version);
    logMemoryUsageWarnings(memoryUsageMB);
  } catch (error) {
    logger.error(`Logging error: Could not log health status and warnings. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return healthStatus;
}

function extractPackageVersion(): string | undefined {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent) as PackageJson;
  const version = packageJson.version ?? 'unknown';
  logger.debug(`Package version extracted: ${version}`);
  return version !== 'unknown' ? version : undefined;
}

function getSafeMemoryUsageMB(): number {
  const heapUsed = process.memoryUsage().heapUsed;
  if (isNaN(heapUsed)) throw new Error('Heap used is NaN');
  return Number((heapUsed / 1048576).toFixed(2));
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
