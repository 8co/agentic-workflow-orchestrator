import { strict as assert } from 'node:assert';
import test from 'node:test';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { deploy } from '../src/scripts/deploy';

// Mock the necessary functions
const mockReadFile = async (path: string): Promise<Buffer> => {
  if (path === 'valid/config.json') {
    return Buffer.from(JSON.stringify({ deployScript: 'echo "Deploy"' }));
  } else if (path === 'invalid/config.json') {
    return Buffer.from("{ invalidJson: true }");
  } else if (path === 'malformed/config.json') {
    return Buffer.from('{"noDeployScript": true}');
  }
  throw new Error('File not found');
};

const mockExec = (cmd: string, callback: (error: Error | null, stdout: string, stderr: string) => void): void => {
  if (cmd === 'echo "Deploy"') {
    callback(null, 'Deployment script executed', '');
  } else {
    callback(new Error('Script failed'), '', 'Error executing script');
  }
};

// Tests
test('Deploy successful', async () => {
  fs.readFile = mockReadFile;
  exec.mockExec = mockExec;

  const result = await deploy('valid/config.json');
  assert.deepStrictEqual(result, { success: true, message: 'Deployment succeeded' });
});

test('Deploy fails with invalid JSON configuration', async () => {
  fs.readFile = mockReadFile;
  exec.mockExec = mockExec;

  const result = await deploy('invalid/config.json');
  assert.deepStrictEqual(result, { success: false, message: 'Deployment failed: Error parsing configuration file' });
});

test('Deploy fails with malformed configuration', async () => {
  fs.readFile = mockReadFile;
  exec.mockExec = mockExec;

  const result = await deploy('malformed/config.json');
  assert.deepStrictEqual(result, { success: false, message: 'Deployment failed: Invalid configuration structure' });
});

test('Deploy fails with command execution error', async () => {
  fs.readFile = mockReadFile;
  exec.mockExec = mockExec;

  const result = await deploy('valid/config.json');
  assert.deepStrictEqual(result, { success: false, message: 'Deployment failed: Command failed: Error executing script' });
});
