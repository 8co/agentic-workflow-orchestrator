import { test, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { deploy } from '../src/scripts/deploy.js';

// Mock fs.promises.readFile
const originalReadFile = fs.readFile;
let mockedReadFile: jest.SpyInstance;

// Mock child_process.exec
const originalExec = exec;
let mockedExec: jest.SpyInstance;

beforeEach(() => {
  mockedReadFile = jest.spyOn(fs, 'readFile');
  mockedExec = jest.spyOn(child_process, 'exec');
});

test('should deploy successfully with valid config and command', async () => {
  // Arrange
  const validConfig = JSON.stringify({ deployScript: 'echo "Hello"' });
  mockedReadFile.mockResolvedValue(Buffer.from(validConfig));
  mockedExec.mockImplementation((command, callback) => {
    callback(null, 'Hello', '');
  });

  // Act
  const result = await deploy('valid/path/to/config.json');

  // Assert
  assert.deepStrictEqual(result, {
    success: true,
    message: 'Deployment succeeded'
  });
});

test('should fail deployment with malformed JSON config', async () => {
  // Arrange
  const malformedConfig = JSON.stringify({ deployScript: 123 });
  mockedReadFile.mockResolvedValue(Buffer.from(malformedConfig));

  // Act
  const result = await deploy('path/to/malformed/config.json');

  // Assert
  assert.deepStrictEqual(result, {
    success: false,
    message: 'Deployment failed: Invalid configuration structure'
  });
});

test('should fail deployment if config read throws error', async () => {
  // Arrange
  mockedReadFile.mockRejectedValue(new Error('File not found'));

  // Act
  const result = await deploy('path/to/missing/config.json');

  // Assert
  assert.deepStrictEqual(result, {
    success: false,
    message: 'Deployment failed: Error parsing configuration file'
  });
});

test('should fail deployment if command execution fails', async () => {
  // Arrange
  const validConfig = JSON.stringify({ deployScript: 'invalidcmd' });
  mockedReadFile.mockResolvedValue(Buffer.from(validConfig));
  mockedExec.mockImplementation((command, callback) => {
    callback(new Error('Command not found'), '', 'Command not found');
  });

  // Act
  const result = await deploy('path/to/valid/config.json');

  // Assert
  assert.deepStrictEqual(result, {
    success: false,
    message: 'Deployment failed: Command failed: Command not found'
  });
});
