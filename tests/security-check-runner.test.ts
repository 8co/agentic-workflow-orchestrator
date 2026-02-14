import { execSync } from 'child_process'; 
import assert from 'node:assert';
import test from 'node:test';
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

test('should handle non-git repository gracefully', () => {
  const nonGitDirectory = '/tmp/non-git-directory';
  const mkdirResult = spawnSync('mkdir', ['-p', nonGitDirectory]);
  assert.strictEqual(mkdirResult.status, 0);

  const result = spawnSync('node', ['src/security-check-runner.ts'], { cwd: nonGitDirectory });
  assert.ok(result.stdout.toString().includes('No git repository or no changes detected.'));
  assert.strictEqual(result.status, 0);
});

test('should detect no changes for a clean git directory', () => {
  const tempGitRepo = '/tmp/clean-git-repo';
  execSync('mkdir -p ' + tempGitRepo);
  execSync('git init', { cwd: tempGitRepo });
  execSync('touch test.txt', { cwd: tempGitRepo });
  execSync('git add .', { cwd: tempGitRepo });
  execSync('git commit -m "Initial commit"', { cwd: tempGitRepo });
  
  const result = spawnSync('node', ['src/security-check-runner.ts'], { cwd: tempGitRepo });
  assert.ok(result.stdout.toString().includes('✅ No changed files to scan'));
  assert.strictEqual(result.status, 0);
});

test('should handle uncommitted changes in a git repository', () => {
  const tempGitRepo = '/tmp/uncommitted-git-repo';
  execSync('mkdir -p ' + tempGitRepo);
  execSync('git init', { cwd: tempGitRepo });
  writeFileSync(join(tempGitRepo, 'uncommitted.txt'), 'Uncommitted change');
  execSync('git add .', { cwd: tempGitRepo });

  const result = spawnSync('node', ['src/security-check-runner.ts'], { cwd: tempGitRepo });
  assert.ok(result.stdout.toString().includes('✅ No changed files to scan') === false);
});

test('should handle unauthorized file access attempts', () => {
  const tempGitRepo = '/tmp/unauthorized-access-git-repo';
  execSync('mkdir -p ' + tempGitRepo);
  execSync('git init', { cwd: tempGitRepo });
  
  const filePath = join(tempGitRepo, 'restricted.txt');
  writeFileSync(filePath, 'Restricted data');
  execSync('git add .', { cwd: tempGitRepo });
  execSync('git commit -m "Add restricted file"', { cwd: tempGitRepo });
  try {
    execSync(`chmod 000 ${filePath}`);
  } catch (error) {
    console.warn('Unable to change file permissions, test might not be effective on this environment!');
  }

  const result = spawnSync('node', ['src/security-check-runner.ts'], { cwd: tempGitRepo });
  assert.ok(result.stderr.toString().includes('⚠️  Could not read restricted.txt'));
});
