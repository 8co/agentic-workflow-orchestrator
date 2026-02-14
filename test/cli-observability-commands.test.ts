import { test } from 'node:test';
import assert from 'node:assert';
import { listRunningJobs, getJobLogs, systemStatus, listJobIds } from '../src/cli-observability-commands.js';
import fs from 'fs';
import os from 'os';

// Mocking console
const originalConsole = console;
let consoleOutput: string[];
const mockedConsole = {
  log: (output: string) => consoleOutput.push(output),
  error: (output: string) => consoleOutput.push(output)
};

// Mocking file system
function mockFileSystem(exists: boolean, fileData: Record<string, string>) {
  jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
    return exists ? fileData.hasOwnProperty(path as string) : false;
  });
  jest.spyOn(fs, 'readFileSync').mockImplementation((path) => {
    if (exists && fileData.hasOwnProperty(path as string)) {
      return fileData[path as string];
    }
    throw new Error('File not found');
  });
}

// Mocking OS
function mockOS(freeMemory: number, totalMemory: number, uptime: number) {
  jest.spyOn(os, 'freemem').mockReturnValue(freeMemory);
  jest.spyOn(os, 'totalmem').mockReturnValue(totalMemory);
  jest.spyOn(os, 'uptime').mockReturnValue(uptime);
}

test('listRunningJobs outputs no jobs message when no jobs running', async () => {
  consoleOutput = [];
  console = mockedConsole;

  mockFileSystem(false, {});
  
  listRunningJobs();

  assert.strictEqual(consoleOutput[0], 'No running jobs found.', 'Expected no running jobs message');

  console = originalConsole;
});

test('listRunningJobs lists running jobs correctly', async () => {
  consoleOutput = [];
  console = mockedConsole;

  const mockData = JSON.stringify([{ id: '1', status: 'running', startTime: '10:00 AM' }]);
  mockFileSystem(true, { [path.resolve('data', 'running_jobs.json')]: mockData });

  listRunningJobs();

  assert.strictEqual(consoleOutput[0], 'Running Jobs:', 'Expected running jobs header');
  assert.strictEqual(consoleOutput[1], '- [1] Status: running, Started: 10:00 AM', 'Expected job details');

  console = originalConsole;
});

test('getJobLogs outputs error message when no logs are found', async () => {
  consoleOutput = [];
  console = mockedConsole;

  mockFileSystem(false, {});

  getJobLogs('123');

  assert.strictEqual(consoleOutput[0], 'No logs found for job ID: 123', 'Expected no logs error message');

  console = originalConsole;
});

test('getJobLogs outputs log content when logs are available', async () => {
  consoleOutput = [];
  console = mockedConsole;

  const mockLogData = "This is a log content";
  mockFileSystem(true, { [path.resolve('logs', '123.log')]: mockLogData });

  getJobLogs('123');

  assert.strictEqual(consoleOutput[0], 'Logs for Job ID: 123\nThis is a log content', 'Expected log content output');

  console = originalConsole;
});

test('systemStatus outputs correct system status', async () => {
  consoleOutput = [];
  console = mockedConsole;

  mockOS(1_073_741_824, 4_294_967_296, 3661); // Mock 1GB free, 4GB total RAM and uptime of 1 hour 1 minute 1 second

  systemStatus();

  assert.strictEqual(consoleOutput[0], 'System Status:', 'Expected system status header');
  assert.strictEqual(consoleOutput[1], '- Free Memory: 1.00 GB', 'Expected free memory output');
  assert.strictEqual(consoleOutput[2], '- Total Memory: 4.00 GB', 'Expected total memory output');
  assert.strictEqual(consoleOutput[3], '- Uptime: 0d 1h 1m 1s', 'Expected uptime output');

  console = originalConsole;
});

test('listJobIds outputs no jobs message when no jobs running', async () => {
  consoleOutput = [];
  console = mockedConsole;

  mockFileSystem(false, {});
  
  listJobIds();

  assert.strictEqual(consoleOutput[0], 'No running jobs found.', 'Expected no running jobs message');

  console = originalConsole;
});

test('listJobIds lists job IDs correctly', async () => {
  consoleOutput = [];
  console = mockedConsole;

  const mockData = JSON.stringify([{ id: '1', status: 'running', startTime: '10:00 AM' }]);
  mockFileSystem(true, { [path.resolve('data', 'running_jobs.json')]: mockData });

  listJobIds();

  assert.strictEqual(consoleOutput[0], 'Running Job IDs:', 'Expected running job IDs header');
  assert.strictEqual(consoleOutput[1], '- 1', 'Expected job ID');

  console = originalConsole;
});
