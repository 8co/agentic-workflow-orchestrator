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
const MAX_RETRIES: number = 3;
const INITIAL_RETRY_DELAY: number = 100; // in milliseconds

export function getHealthStatus(): HealthStatus {
  let version: string | undefined;
  let memoryUsageMB: number = 0;
  let status: 'ok' | 'degraded' | 'down' = 'ok';

  version = handleOperation(retryOperation<string | undefined>(extractPackageVersion), 'Version extraction error', 'Failed to parse package.json for version.');
  memoryUsageMB = handleOperation(retryOperation<number>(getSafeMemoryUsageMB), 'Memory usage retrieval error', 'Unable to calculate memory usage.');

  const uptime: number | null = handleOperation(retryOperation<number | null>(getUptimeSafely), 'Uptime retrieval error', 'Failed to retrieve system uptime.', true);

  if (uptime === null) {
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

function retryOperation<T>(operation: () => T, retriesLeft: number = MAX_RETRIES, delay: number = INITIAL_RETRY_DELAY): T {
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
  const start: number = Date.now();
  while (Date.now() - start < ms) {
    // Busy wait
  }
}

function extractPackageVersion(): string | undefined {
  const packageJsonPath: string = join(process.cwd(), 'package.json');
  const packageJsonContent: string = readFileSync(packageJsonPath, 'utf-8');
  const packageJson: PackageJson = JSON.parse(packageJsonContent) as PackageJson;
  const version: string = packageJson.version ?? 'unknown';
  logger.debug(`Package version extracted: ${version}`);
  return version !== 'unknown' ? version : undefined;
}

function getSafeMemoryUsageMB(): number {
  const heapUsed: number = process.memoryUsage().heapUsed;
  if (isNaN(heapUsed)) throw new Error('Heap used is NaN');
  return Number((heapUsed / 1048576).toFixed(2));
}

function getUptimeSafely(): number | null {
  const uptime: number = Number(process.uptime().toFixed(2));
  return isNaN(uptime) ? null : uptime;
}

function logHealthMonitoringData(healthStatus: HealthStatus): void {
  logHealthStatus(healthStatus);
  logMemoryUsageWarnings(healthStatus.memoryUsage);
}

function logHealthStatus({ uptime, memoryUsage, version }: HealthStatus): void {
  logger.info(
    `Health Check - Time: ${new Date().toISOString()}, Uptime: ${uptime} seconds, Memory Usage: ${memoryUsage} MB, Version: ${version ?? 'N/A'}`
  );
}

function logMemoryUsageWarnings(memoryUsage: number): void {
  const formattedMemoryUsage: string = memoryUsage.toFixed(2) + ' MB';
  const warnings: Array<{ threshold: number; level: 'error' | 'warn' | 'info'; message: string }> = [
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
  const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
  const stackTrace: string = error instanceof Error && error.stack ? `\nStack Trace: ${error.stack}` : '';
  logger.error(`${type}: ${context} - ${errorMessage}${stackTrace}`);
}

function handleOperation<T>(operationResult: T | null, errorType: string, errorMessage: string, isCritical: boolean = false): T {
  if (operationResult === null && isCritical) {
    logDetailedError(errorType, errorMessage, new Error(errorMessage));
    return operationResult as T;
  }
  
  try {
    if (operationResult === null) throw new Error(errorMessage);
    return operationResult;
  } catch (error) {
    logDetailedError(errorType, errorMessage, error);
    return isCritical ? (null as T) : (typeof operationResult === 'undefined' ? (undefined as T) : ({} as T));
  }
}
