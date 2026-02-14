import { 
  revertChanges,
  getCurrentBranch,
  getHeadSha,
  commitChanges,
  hasChanges,
} from './git-ops.js';

export interface RollbackResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Rollback to the previous commit in case of failed deployment.
 */
export async function rollbackToPreviousCommit(cwd: string): Promise<RollbackResult> {
  try {
    const hasUncommittedChanges = await hasChanges(cwd);
    
    if (hasUncommittedChanges) {
      return {
        success: false,
        message: 'Uncommitted changes present. Please commit or stash them before rollback.',
      };
    }
    
    console.log('🔙 Rolling back to the previous commit.');
    const revertResult = await revertChanges(cwd);

    if (!revertResult.success) {
      return {
        success: false,
        message: 'Failed to revert changes.',
        error: revertResult.error,
      };
    }
    
    console.log('✅ Rollback succeeded.');
    return {
      success: true,
      message: 'Successfully rolled back to the previous commit.',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error during rollback.',
      error: (error as Error).message,
    };
  }
}

/**
 * Get rollback status and information.
 */
export async function getRollbackState(cwd: string): Promise<string> {
  const currentBranch = await getCurrentBranch(cwd);
  const currentCommitSha = await getHeadSha(cwd);
  return `Current state: Branch - ${currentBranch}, Commit - ${currentCommitSha}`;
}
