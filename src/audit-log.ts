import { readFile, writeFile } from 'node:fs/promises';

export interface AuditEntry {
  id: string;
  taskId: string;
  timestamp: string; // ISO format
  durationMs: number;
  tokensIn: number;
  tokensOut: number;
  estimatedCost: number;
  status: 'completed' | 'failed';
  filesChanged: string[];
  branch?: string;
  error?: string;
}

const AUDIT_LOG_FILE_PATH = 'audit-log.jsonl';

export async function logEntry(entry: AuditEntry): Promise<void> {
  const logLine = JSON.stringify(entry) + '\n';
  await writeFile(AUDIT_LOG_FILE_PATH, logLine, { flag: 'a', encoding: 'utf-8' });
}

export async function loadAuditLog(): Promise<AuditEntry[]> {
  try {
    const content = await readFile(AUDIT_LOG_FILE_PATH, 'utf-8');
    return content.trim().split('\n').map(line => JSON.parse(line) as AuditEntry);
  } catch {
    return [];
  }
}

export async function getAuditSummary(): Promise<{
  totalRuns: number;
  successRate: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCost: number;
  avgDurationMs: number;
}> {
  const entries = await loadAuditLog();

  if (entries.length === 0) {
    return {
      totalRuns: 0,
      successRate: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      totalCost: 0,
      avgDurationMs: 0,
    };
  }

  const totalRuns = entries.length;
  const successfulRuns = entries.filter(entry => entry.status === 'completed').length;
  const successRate = successfulRuns / totalRuns;
  const totalTokensIn = entries.reduce((acc, entry) => acc + entry.tokensIn, 0);
  const totalTokensOut = entries.reduce((acc, entry) => acc + entry.tokensOut, 0);
  const totalCost = entries.reduce((acc, entry) => acc + entry.estimatedCost, 0);
  const avgDurationMs = entries.reduce((acc, entry) => acc + entry.durationMs, 0) / totalRuns;

  return {
    totalRuns,
    successRate,
    totalTokensIn,
    totalTokensOut,
    totalCost,
    avgDurationMs,
  };
}
