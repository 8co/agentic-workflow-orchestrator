import { spawn } from 'node:child_process';
import { promises as fsPromises } from 'node:fs';

let spawnMockOutput = {
  stdout: '',
  stderr: '',
  code: 0,
  error: null,
};

let readFileMockOutput = {
  data: '',
  error: null,
};

export function mockSpawn(options) {
  spawnMockOutput = { ...spawnMockOutput, ...options };
  
  jest.mock('node:child_process', () => ({
    spawn: jest.fn(() => ({
      stdout: {
        on: jest.fn((event, callback) => {
          if (event === 'data' && spawnMockOutput.stdout) {
            callback(Buffer.from(spawnMockOutput.stdout));
          }
        }),
      },
      stderr: {
        on: jest.fn((event, callback) => {
          if (event === 'data' && spawnMockOutput.stderr) {
            callback(Buffer.from(spawnMockOutput.stderr));
          }
        }),
      },
      on: jest.fn((event, callback) => {
        if (event === 'close' && spawnMockOutput.code !== undefined) {
          callback(spawnMockOutput.code);
        }
        if (event === 'error' && spawnMockOutput.error) {
          callback(spawnMockOutput.error);
        }
      }),
    })),
  }));
}

export function mockReadFile(options) {
  readFileMockOutput = { ...readFileMockOutput, ...options };

  jest.mock('node:fs/promises', () => ({
    readFile: jest.fn(async () => {
      if (readFileMockOutput.error) {
        throw readFileMockOutput.error;
      }
      return readFileMockOutput.data;
    }),
  }));
}

export function resetMocks() {
  jest.dontMock('node:child_process');
  jest.dontMock('node:fs/promises');
  spawnMockOutput = {
    stdout: '',
    stderr: '',
    code: 0,
    error: null,
  };
  readFileMockOutput = {
    data: '',
    error: null,
  };
}
