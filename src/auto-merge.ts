/**
 * Auto-Merge System
 * Safely merges branches to main with health checks and rollback capability
 */

import { spawn } from 'node:child_process';
import { getCurrentBranch, getHeadSha } from './git-ops.js';
import { runVerification, defaultVerifyCommands } from './verify-runner.js';
import type { PerformanceMetrics } from './observabilityUtil.js';
import { generatePerformanceMetrics } from './observabilityUtil.js';
import { rollbackToCommit, canSafelyRollback } from './rollback-manager.js';

export interface MergeResult {
  safe: boolean;
  reason: string;
}

export interface MergeSafety {
  safe: boolean;
  reason: string;
}

/**
 * Execute a git command
 */
async function execGit(args: string[], cwd: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    
    const proc = spawn('git', args, { cwd });
    
    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    proc.on('close', (exitCode) => {
      resolve({
        success: exitCode === 0,
        output: stdout.trim() || stderr.trim()
      });
    });
  });
}

/**
 * Check if a branch can safely be merged to main
 */
export async function canMergeToMain(
  branchName: string,
  targetDir: string = process.cwd()
): Promise<MergeSafety> {
  // 1. Check if branch exists
  const branchCheck = await execGit(['rev-parse', '--verify', branchName], targetDir);
  if (!branchCheck.success) {
    return { safe: false, reason: `Branch ${branchName} does not exist` };
  }

  // 2. Run verification (build, tests, security)
  const verifyResult = await runVerification(defaultVerifyCommands(), targetDir);
  if (!verifyResult.allPassed) {
    return {
      safe: false,
      reason: `Verification failed: ${verifyResult.errorSummary}`
    };
  }

  // 3. Check for conflicts with main
  const mergeTest = await execGit(
    ['merge-tree', 'main', branchName],
    targetDir
  );
  
  if (!mergeTest.success || mergeTest.output.includes('<<<<<<')) {
    return {
      safe: false,
      reason: 'Merge conflicts detected with main branch'
    };
  }

  return { safe: true, reason: 'All checks passed' };
}

/**
 * Safely merge a branch to main with health checks
 */
export async function autoMergeWithChecks(
  branchName: string,
  targetDir: string = process.cwd()
): Promise<boolean> {
  console.log(`🔄 Auto-merge: Checking if ${branchName} can be merged...`);

  // Pre-merge checks
  const safetyCheck = await canMergeToMain(branchName, targetDir);
  if (!safetyCheck.safe) {
    console.error(`❌ Cannot merge: ${safetyCheck.reason}`);
    return false;
  }

  console.log(`✅ Safety checks passed`);

  // Capture current state
  const currentBranch = await getCurrentBranch(targetDir);
  const beforeSha = await getHeadSha(targetDir);
  const beforeMetrics = generatePerformanceMetrics();

  console.log(`📸 Checkpoint created: ${beforeSha}`);

  // Switch to main
  const checkoutMain = await execGit(['checkout', 'main'], targetDir);
  if (!checkoutMain.success) {
    console.error(`❌ Failed to checkout main: ${checkoutMain.output}`);
    return false;
  }

  // Merge the branch
  console.log(`🔀 Merging ${branchName} into main...`);
  const mergeResult = await execGit(['merge', '--no-ff', branchName], targetDir);
  
  if (!mergeResult.success) {
    console.error(`❌ Merge failed: ${mergeResult.output}`);
    // Revert to original branch
    await execGit(['checkout', currentBranch], targetDir);
    return false;
  }

  console.log(`✅ Merge successful`);

  // Monitor post-merge
  const shouldRollback = await monitorPostMerge(beforeMetrics, targetDir);
  
  if (shouldRollback) {
    console.warn(`⚠️  Post-merge checks failed, rolling back...`);
    
    const canRollback = await canSafelyRollback(beforeSha, targetDir);
    if (canRollback) {
      await rollbackToCommit(beforeSha, targetDir);
      console.log(`✅ Rolled back to ${beforeSha}`);
    } else {
      console.error(`❌ Cannot safely rollback!`);
    }
    
    return false;
  }

  console.log(`🎉 Auto-merge complete and verified!`);
  return true;
}

/**
 * Monitor system after merge and decide if rollback is needed
 */
export async function monitorPostMerge(
  beforeMetrics: PerformanceMetrics,
  targetDir: string = process.cwd()
): Promise<boolean> {
  console.log(`🔍 Monitoring post-merge health...`);

  // Re-run verification
  const verifyResult = await runVerification(defaultVerifyCommands(), targetDir);
  if (!verifyResult.allPassed) {
    console.error(`❌ Post-merge verification failed`);
    return true; // Should rollback
  }

  // Check metrics degradation
  const afterMetrics = generatePerformanceMetrics();
  
  const memoryBefore = beforeMetrics.memory.usedMemory;
  const memoryAfter = afterMetrics.memory.usedMemory;
  const memoryChange = ((memoryAfter - memoryBefore) / memoryBefore) * 100;

  if (memoryChange > 5) {
    console.warn(`⚠️  Memory usage increased by ${memoryChange.toFixed(2)}%`);
    return true; // Should rollback
  }

  console.log(`✅ Post-merge health checks passed`);
  return false; // No rollback needed
}

