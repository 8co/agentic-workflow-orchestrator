import { deploy } from '../../src/scripts/deploy';
import assert from 'node:assert';
import { test } from 'node:test';
import fs from 'fs/promises';
import { exec } from 'child_process';

// Mock fs.promises.readFile
const readFileMock = (path: string): Promise<Buffer> => {
  if (path === 'path/to/valid-config.json') {
    return Promise.resolve(Buffer.from(JSON.stringify({ deployScript: 'echo "Deploying..."' })));
  } else if (path === 'path/to/invalid-config.json') {
    return Promise.resolve(Buffer.from(JSON.stringify({ script: 'echo "Deploying..."' })));
  } else if (path === 'path/to/malformed-config.json') {
    return Promise.resolve(Buffer.from("{ deployScript: 'echo \"Deploying...\"' "));
  }
  return Promise.reject(new Error('File not found'));
};

// Mock child_process.exec
const execMock = (cmd: string, callback: (error: Error | null, stdout: string, stderr: string) => void): void => {
  if (cmd === 'echo "Deploying..."') {
    callback(null, 'Deploying...\n', '');
  } else {
    callback(new Error('Command failed'), '', 'Command failed');
  }
};

test('deploy - valid configuration', async () => {
  // Arrange
  fs.readFile = readFileMock;
  exec = execMock;

  // Act
  const result = await deploy('path/to/valid-config.json');

  // Assert
  assert.deepStrictEqual(result, { success: true, message: 'Deployment succeeded' });
});

test('deploy - invalid configuration structure', async () => {
  // Arrange
  fs.readFile = readFileMock;
  exec = execMock;

  // Act
  const result = await deploy('path/to/invalid-config.json');

  // Assert
  assert.deepStrictEqual(result, { success: false, message: 'Deployment failed: Invalid configuration structure' });
});

test('deploy - malformed JSON configuration', async () => {
  // Arrange
  fs.readFile = readFileMock;
  exec = execMock;

  // Act
  const result = await deploy('path/to/malformed-config.json');

  // Assert
  assert.deepStrictEqual(result, { success: false, message: 'Deployment failed: Error parsing configuration file' });
});

test('deploy - non-existent configuration path', async () => {
  // Arrange
  fs.readFile = readFileMock;
  exec = execMock;
  
  // Act
  const result = await deploy('path/to/non-existent-config.json');

  // Assert
  assert.deepStrictEqual(result, { success: false, message: 'Deployment failed: File not found' });
});
