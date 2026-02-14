/**
 * Git Operations
 * Handles auto-commit on success and revert on failure.
 * Uses child_process to shell out to git.
 */

import { spawn } from 'node:child_process';

interface GitResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Execute a git command and return the result.
 */
function git(args: string[], cwd: string): Promise<GitResult> {
  return new Promise((resolvePromise) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn('git', args, { cwd, shell: false });

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (exitCode) => {
      resolvePromise({
        success: exitCode === 0,
        output: stdout.trim(),
        error: exitCode !== 0 ? stderr.trim() : undefined,
      });
    });

    proc.on('error', (err) => {
      resolvePromise({
        success: false,
        output: '',
        error: err.message,
      });
    });
  });
}

/**
 * Check if working directory has uncommitted changes.
 */
export async function hasChanges(cwd: string): Promise<boolean> {
  const result = await git(['status', '--porcelain'], cwd);
  return result.success && result.output.length > 0;
}

/**
 * Get list of changed files.
 */
export async function getChangedFiles(cwd: string): Promise<string[]> {
  const result = await git(['status', '--porcelain', '-uall'], cwd);
  if (!result.success) return [];

  return result.output
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
}

/**
 * Create a snapshot (stash) that can be used to revert.
 * Returns the stash ref or null if nothing to stash.
 */
export async function createSnapshot(cwd: string): Promise<string | null> {
  // Stage everything first to capture new files
  await git(['add', '-A'], cwd);

  const result = await git(
    ['stash', 'push', '-m', `orchestrator-snapshot-${Date.now()}`],
    cwd
  );

  if (result.success && !result.output.includes('No local changes')) {
    // Pop it back so files are in working tree
    await git(['stash', 'pop'], cwd);
    return 'stash@{0}';
  }

  return null;
}

/**
 * Stage all changes and commit with a message.
 */
export async function commitChanges(
  cwd: string,
  message: string
): Promise<GitResult> {
  console.log(`  📦 Staging all changes...`);
  const addResult = await git(['add', '-A'], cwd);
  if (!addResult.success) {
    return addResult;
  }

  console.log(`  💾 Committing: ${message}`);
  return git(['commit', '-m', message], cwd);
}

/**
 * Revert all changes since last commit (discard working tree changes).
 */
export async function revertChanges(cwd: string): Promise<GitResult> {
  console.log(`  ⏪ Reverting all changes...`);

  // Reset staged changes
  await git(['reset', 'HEAD'], cwd);

  // Discard working tree changes
  const cleanResult = await git(['checkout', '--', '.'], cwd);

  // Remove untracked files
  await git(['clean', '-fd'], cwd);

  return cleanResult;
}

/**
 * Create a branch for the autonomous work.
 */
export async function createBranch(
  cwd: string,
  branchName: string
): Promise<GitResult> {
  console.log(`  🌿 Creating branch: ${branchName}`);
  return git(['checkout', '-b', branchName], cwd);
}

/**
 * Get the current branch name.
 */
export async function getCurrentBranch(cwd: string): Promise<string> {
  const result = await git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
  return result.success ? result.output : 'unknown';
}

/**
 * Get the short SHA of the current HEAD.
 */
export async function getHeadSha(cwd: string): Promise<string> {
  const result = await git(['rev-parse', '--short', 'HEAD'], cwd);
  return result.success ? result.output : 'unknown';
}

/**
 * Resolve the git repository root from any subdirectory.
 * Critical for monorepos where the workspace dir differs from the git root.
 * Example: athlete-mono-app/infra/ -> athlete-mono-app/
 */
export async function resolveGitRoot(cwd: string): Promise<string> {
  const result = await git(['rev-parse', '--show-toplevel'], cwd);
  if (!result.success) {
    throw new Error(`Not a git repository: ${cwd}`);
  }
  return result.output.trim();
}

