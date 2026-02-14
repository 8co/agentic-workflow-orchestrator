import assert from 'node:assert';
import test from 'node:test';
import { scanCode, formatViolations, requiresSecurityScan, readFileAndScan } from '../src/security-scanner.js';

test('scanCode detects critical violations', () => {
  const code = `
    const dangerous = eval('console.log("Hello")');
    function risky() { return new Function("return 1;"); }
    require('child_process').exec('rm -rf /');
  `;
  const result = scanCode(code, 'test.js');
  assert.strictEqual(result.safe, false);
  assert.strictEqual(result.violations.length, 3);
  assert.strictEqual(result.violations[0].severity, 'critical');
  assert.strictEqual(result.violations[1].severity, 'critical');
  assert.strictEqual(result.violations[2].severity, 'critical');
});

test('scanCode detects high risk violations', () => {
  const code = `
    while (true) {}
    for (;;) {}
    process.exit(0).catch(err => {});
    const { spawn } = require('child_process'); spawn(\`\${cmd}\`);
  `;
  const result = scanCode(code, 'test.js');
  assert.strictEqual(result.safe, false);
  assert.strictEqual(result.violations.length, 4);
  assert.strictEqual(result.violations.every(v => v.severity === 'high'), true);
});

test('scanCode detects medium risk violations', () => {
  const code = `
    process.env.MY_VAR = 'value';
    const path = '../../../../etc/passwd';
    for (let i = 0; i < 1; i++) { for (let j = 0; j < 1; j++) { for (let k = 0; k < 1; k++) {} } }
  `;
  const result = scanCode(code, 'test.js');
  assert.strictEqual(result.safe, true);
  assert.strictEqual(result.violations.length, 3);
  assert.strictEqual(result.violations.every(v => v.severity === 'medium'), true);
});

test('formatViolations formats messages correctly', () => {
  const code = `
    eval('console.log("This is a test")');
  `;
  const result = scanCode(code, 'test.js');
  const formattedMessage = formatViolations(result, 'test.js');
  assert.match(formattedMessage, /🔴 CRITICAL VIOLATIONS \(blocking\):\s*Line 2:/);
  assert.match(formattedMessage, /❌ Security check FAILED - changes blocked/);
});

test('requiresSecurityScan returns true for critical files', () => {
  assert.strictEqual(requiresSecurityScan('src/cli.ts'), true);
  assert.strictEqual(requiresSecurityScan('src/scheduler.ts'), true);
});

test('requiresSecurityScan returns false for non-critical files', () => {
  assert.strictEqual(requiresSecurityScan('src/utils.ts'), false);
});

test('readFileAndScan handles file reading errors gracefully', () => {
  const originalFs = fs.readFileSync;
  fs.readFileSync = () => { throw new Error('File not found'); };
  const result = readFileAndScan('nonexistent.js');
  assert.strictEqual(result.safe, false);
  assert.strictEqual(result.violations.length, 1);
  assert.strictEqual(result.violations[0].severity, 'critical');
  fs.readFileSync = originalFs;
});
