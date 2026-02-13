import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  memoryUsage: number;
  timestamp: string;
  version: string;
}

export function getHealthStatus(): HealthStatus {
  const packageJsonPath = join(process.cwd(), 'package.json');
  let version: string;

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    version = packageJson.version || 'unknown';
  } catch {
    version = 'unknown';
  }

  const status: HealthStatus = {
    status: 'ok',
    uptime: Number(process.uptime().toFixed(2)),
    memoryUsage: Number((process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2)),
    timestamp: new Date().toISOString(),
    version,
  };

  return status;
}
