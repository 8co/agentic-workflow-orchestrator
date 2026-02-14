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
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 100; // in milliseconds

export function getHealthStatus(): HealthStatus {
  let version: string | undefined;
  let memoryUsageMB = 0;
  let status: 'ok' | 'degraded' | 'down' = 'ok';

  try {
    version = retryOperation(extractPackageVersion);
  } catch (error) {
    logDetailedError('Version extraction error', 'Failed to parse package.json for version.', error);
    status = 'degraded';
  }

  try {
    memoryUsageMB = retryOperation(getSafeMemoryUsageMB);
  } catch (error) {
    logDetailedError('Memory usage retrieval error', 'Unable to calculate memory usage.', error);
    status = 'degraded';
  }

  const uptime = retryOperation(getUptimeSafely);

  if (uptime === null) {
    logDetailedError('Uptime retrieval error', 'Failed to retrieve system uptime.', new Error('Uptime is NaN'));
    status = 'down';
  }

  const healthStatus: HealthStatus = {
    status,
    uptime: uptime || 0,
    memoryUsage: memoryUsageMB,
    timestamp: new Date().toISOString(),
    version,
  };

  logHealthMonitoringData(healthStatus);

  return healthStatus;
}

function retryOperation<T>(operation: () => T, retriesLeft = MAX_RETRIES, delay = INITIAL_RETRY_DELAY): T {
  try {
    return operation();
  } catch (error) {
    if (retriesLeft > 0) {
      sleep(delay);
      return retryOperation(operation, retriesLeft - 1, delay * 2);
    }
    throw error;
  }
}

function sleep(ms: number): void {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Busy wait
  }
}

function extractPackageVersion(): string | undefined {
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent) as PackageJson;
    const version = packageJson.version ?? 'unknown';
    logger.debug(`Package version extracted: ${version}`);
    return version !== 'unknown' ? version : undefined;
  } catch (error) {
    throw new Error('Failed to extract package version: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

function getSafeMemoryUsageMB(): number {
  try {
    const heapUsed = process.memoryUsage().heapUsed;
    if (isNaN(heapUsed)) throw new Error('Heap used is NaN');
    return Number((heapUsed / 1048576).toFixed(2));
  } catch (error) {
    throw new Error('Failed to retrieve memory usage: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

function getUptimeSafely(): number | null {
  const uptime = Number(process.uptime().toFixed(2));
  return isNaN(uptime) ? null : uptime;
}

function logHealthMonitoringData(healthStatus: HealthStatus): void {
  try {
    logHealthStatus(healthStatus);
    logMemoryUsageWarnings(healthStatus.memoryUsage);
  } catch (error) {
    logDetailedError('Logging error', 'Could not log health status and warnings.', error);
  }
}

function logHealthStatus({ uptime, memoryUsage, version }: HealthStatus): void {
  logger.info(
    `Health Check - Time: ${new Date().toISOString()}, Uptime: ${uptime} seconds, Memory Usage: ${memoryUsage} MB, Version: ${version ?? 'N/A'}`
  );
}

function logMemoryUsageWarnings(memoryUsage: number): void {
  const formattedMemoryUsage = memoryUsage.toFixed(2) + ' MB';
  const warnings = [
    { threshold: 700, level: 'error', message: `Critical memory usage detected: ${formattedMemoryUsage}. Immediate attention required!` },
    { threshold: 500, level: 'warn', message: `High memory usage detected: ${formattedMemoryUsage}. Consider investigating memory usage.` },
    { threshold: 300, level: 'info', message: `Moderate memory usage: ${formattedMemoryUsage}. Running smoothly but keep monitoring.` },
  ];

  const warning = warnings.find(w => memoryUsage > w.threshold);
  if (warning) {
    logger[warning.level as keyof typeof logger](
      `Memory Usage Warning - ${warning.message}`
    );
  } else {
    logger.info(`Memory Usage - Normal: ${formattedMemoryUsage}. System is healthy.`);
  }
}

function logDetailedError(type: string, context: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const stackTrace = error instanceof Error && error.stack ? `\nStack Trace: ${error.stack}` : '';
  logger.error(`${type}: ${context} - ${errorMessage}${stackTrace}`);
}
