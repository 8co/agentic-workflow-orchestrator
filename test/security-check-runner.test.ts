import { strict as assert } from 'node:assert';
import { execSync, spawnSync } from 'node:child_process';
import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Helper function to create a temporary file
function createTempFile(content: string, filename: string): string {
  const filepath = join(tmpdir(), filename);
  writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

// Test suite for security-check-runner
describe('security-check-runner', () => {
  const TEMP_GIT_REPO_PATH = join(tmpdir(), 'temp-git-repo');

  before(() => {
    // Create a temporary git repository
    execSync('mkdir -p ' + TEMP_GIT_REPO_PATH);
    execSync('git init', { cwd: TEMP_GIT_REPO_PATH });
  });

  after(() => {
    // Clean up the temporary git repository
    execSync('rm -rf ' + TEMP_GIT_REPO_PATH);
  });

  it('should exit with code 0 when no changes are detected', () => {
    const result = spawnSync('node', ['src/security-check-runner.ts'], { cwd: TEMP_GIT_REPO_PATH });
    assert.equal(result.status, 0);
    assert.match(result.stdout.toString(), /No changed files to scan/);
  });

  it('should handle changed files and exit with the correct code based on security scan', () => {
    const testFileName = 'testFile.ts';
    const testFilePath = createTempFile('console.log("test");', testFileName);
    execSync(`git add ${testFileName}`, { cwd: TEMP_GIT_REPO_PATH });
    
    // Setup mock implementations for the security scan functions
    const requiresSecurityScanMock = (file: string) => file === testFileName;
    const scanCodeMock = (code: string, file: string) => ({ safe: code.includes('safe') });
    const formatViolationsMock = () => 'Mock Violation Report';

    import('../src/security-scanner.js').then((scannerModule) => {
      const originalRequiresSecurityScan = scannerModule.requiresSecurityScan;
      const originalScanCode = scannerModule.scanCode;
      const originalFormatViolations = scannerModule.formatViolations;
      
      scannerModule.requiresSecurityScan = requiresSecurityScanMock;
      scannerModule.scanCode = scanCodeMock;
      scannerModule.formatViolations = formatViolationsMock;

      try {
        const resultSafe = spawnSync('node', ['src/security-check-runner.ts'], { cwd: TEMP_GIT_REPO_PATH });
        assert.equal(resultSafe.status, 0);
        assert.match(resultSafe.stdout.toString(), /Security scan passed/);

        // Test failing scenario
        writeFileSync(testFilePath, 'console.log("unsafe");', 'utf-8');
        const resultUnsafe = spawnSync('node', ['src/security-check-runner.ts'], { cwd: TEMP_GIT_REPO_PATH });
        assert.equal(resultUnsafe.status, 1);
        assert.match(resultUnsafe.stdout.toString(), /Security scan failed/);
      } finally {
        scannerModule.requiresSecurityScan = originalRequiresSecurityScan;
        scannerModule.scanCode = originalScanCode;
        scannerModule.formatViolations = originalFormatViolations;
        unlinkSync(testFilePath);
      }
    });
  });

  it('should handle errors during file read', () => {
    const invalidFileName = 'nonExistentFile.ts';
    const result = spawnSync('node', ['src/security-check-runner.ts'], { cwd: TEMP_GIT_REPO_PATH });
    assert.match(result.stderr.toString(), new RegExp(`Could not read ${invalidFileName}`));
  });

  it('should handle git command errors gracefully', () => {
    const result = spawnSync('node', ['src/security-check-runner.ts'], { cwd: '/invalid/path' });
    assert.equal(result.status, 1);
    assert.match(result.stderr.toString(), /Unexpected error/);
  });

});
