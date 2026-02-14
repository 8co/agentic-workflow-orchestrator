import { test } from 'node:test';
import assert from 'node:assert';
import { scanCode, formatViolations, requiresSecurityScan, readFileAndScan } from '../src/security-scanner.js';
import * as fs from 'fs';

// Mocking the required fs module to provide file reading functionality
jest.mock('fs');

// Define a simple utility function to create mock implementation of fs.readFileSync
const mockFileRead = (content: string): void => {
  (fs.readFileSync as jest.Mock).mockImplementation(() => content);
};

test('scanCode: Detects critical patterns', () => {
  const code = `
    const dangerousEval = eval('1 + 1');
    Function('return this')();
    const process = require('child_process');
    process.exec('command');
    rm -rf /
    fs.unlink({ recursive: true });
  `;
  const result = scanCode(code, 'test.ts');
  assert.strictEqual(result.safe, false);
  assert.strictEqual(result.violations.length, 5);
  assert.strictEqual(result.violations[0].severity, 'critical');
});

test('scanCode: Detects high-risk patterns', () => {
  const code = `
    while (true) {
      // infinite loop
    }
    
    for (;;) {
      // another infinite loop
    }

    try {
      // do something risky
    } catch (e) {
      process.exit(0);
    }

    const { spawn } = require('child_process');
    spawn(\`ls \${directory}\`);
  `;
  const result = scanCode(code, 'test.ts');
  assert.strictEqual(result.safe, false);
  assert.strictEqual(result.violations.length, 4);
  assert.strictEqual(result.violations[0].severity, 'high');
});

test('scanCode: Detects medium-risk patterns', () => {
  const code = `
    process.env.SECRET_KEY = 'someKey';
    const fs = require('fs');
    fs.readFile('../../../../etc/passwd', (err, data) => {});
    
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        for (let k = 0; k < 5; k++) {
          // triple nested loop
        }
      }
    }
  `;
  const result = scanCode(code, 'test.ts');
  assert.strictEqual(result.safe, true);
  assert.strictEqual(result.violations.length, 3);
  assert.strictEqual(result.violations[0].severity, 'medium');
});

test('formatViolations: Formats security scan result', () => {
  const violations = {
    safe: false,
    violations: [
      { line: 1, severity: 'critical', pattern: '\\beval\\s*\\(', message: 'eval at line 1' },
      { line: 3, severity: 'high', pattern: 'while\\s*\\(\\s*true\\s*\\)', message: 'while true at line 3' },
      { line: 5, severity: 'medium', pattern: '\\.\\.\\/\\.\\.\\/\\.\\.\\/', message: 'path traversal at line 5' },
    ]
  };
  const output = formatViolations(violations, 'test.ts');
  assert.match(output, /🔴 CRITICAL VIOLATIONS/);
  assert.match(output, /🟠 HIGH RISK/);
  assert.match(output, /🟡 MEDIUM RISK/);
});

test('requiresSecurityScan: Identifies critical files', () => {
  assert.strictEqual(requiresSecurityScan('src/cli.ts'), true);
  assert.strictEqual(requiresSecurityScan('src/scheduler.ts'), true);
  assert.strictEqual(requiresSecurityScan('src/unknown.ts'), false);
});

test('readFileAndScan: Reads file and scans for issues', () => {
  const code = `
    const foo = eval('bar');
  `;
  mockFileRead(code);
  
  const result = readFileAndScan('src/sample.ts');
  assert.strictEqual(result.safe, false);
  assert.strictEqual(result.violations.length, 1);
  assert.strictEqual(result.violations[0].severity, 'critical');
});
