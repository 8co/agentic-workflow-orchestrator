import { 
  hasChanges, 
  revertChanges, 
  getHeadSha 
} from './git-ops.js';
import { appendFileSync } from 'fs';

interface RollbackRecord {
  timestamp: string;
  commitHash: string;
  reason: string;
}

/**
 * Logs rollback history with the given details.
 */
function logRollbackHistory(commitHash: string, reason: string): void {
  const timestamp = new Date().toISOString();
  const record: RollbackRecord = { timestamp, commitHash, reason };

  try {
    appendFileSync('rollback-history.log', JSON.stringify(record) + '\n');
  } catch (error: unknown) {
    console.error('Failed to log rollback history:', error);
  }
}

/**
 * Create a checkpoint by getting the current HEAD SHA.
 */
export async function createCheckpoint(cwd: string): Promise<string> {
  const sha = await getHeadSha(cwd);
  if (sha === 'unknown') {
    throw new Error('Failed to get current HEAD SHA');
  }
  return sha;
}

/**
 * Determine if it's safe to rollback to the specified commit hash.
 */
export async function canSafelyRollback(cwd: string, commitHash: string): Promise<boolean> {
  const hasUncommittedChanges = await hasChanges(cwd);
  return !hasUncommittedChanges;
}

/**
 * Rollback to a specific commit hash after performing health checks.
 */
export async function rollbackToCommit(cwd: string, commitHash: string): Promise<void> {
  if (!await canSafelyRollback(cwd, commitHash)) {
    throw new Error('Uncommitted changes present. Please commit or stash them before rollback.');
  }

  const revertResult = await revertChanges(cwd);
  if (!revertResult.success) {
    throw new Error(`Failed to revert changes: ${revertResult.error}`);
  }

  logRollbackHistory(commitHash, 'Rollback to a previous commit');
}
