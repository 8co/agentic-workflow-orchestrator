import { strict as assert } from 'assert';
import { describe, it, beforeEach } from 'node:test';
import fs from 'fs';
import path from 'path';
import { listRunningJobs, getJobLogs } from '../src/cli-observability-commands';

// Mocking fs functions
let mockFiles: { [key: string]: string } = {};

const mockExistsSync = (filePath: string): boolean => {
  return mockFiles.hasOwnProperty(filePath);
};

const mockReadFileSync = (filePath: string, encoding: string): string => {
  assert.strictEqual(encoding, 'utf8', 'File encoding must be utf8');
  return mockFiles[filePath];
};

// Mocking the console
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
let consoleOutput: string[] = [];
let consoleErrors: string[] = [];

const mockConsoleLog = (message: string) => {
  consoleOutput.push(message);
};

const mockConsoleError = (message: string) => {
  consoleErrors.push(message);
};

describe('cli-observability-commands', () => {

  beforeEach(() => {
    mockFiles = {};
    consoleOutput = [];
    consoleErrors = [];
    
    console.log = mockConsoleLog;    
    console.error = mockConsoleError;
    fs.existsSync = mockExistsSync;
    fs.readFileSync = mockReadFileSync;
  });

  after(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('listRunningJobs', () => {

    it('should notify no running jobs found when none exist', () => {
      listRunningJobs();
      assert.deepEqual(consoleOutput, ['No running jobs found.']);
    });

    it('should list running jobs when they exist', () => {
      mockFiles[path.resolve('data', 'running_jobs.json')] = JSON.stringify([
        { id: "job1", status: "running", startTime: "2023-10-10T10:00Z" },
        { id: "job2", status: "running", startTime: "2023-10-11T11:00Z" }
      ]);

      listRunningJobs();
      assert.deepEqual(consoleOutput, [
        'Running Jobs:',
        '- [job1] Status: running, Started: 2023-10-10T10:00Z',
        '- [job2] Status: running, Started: 2023-10-11T11:00Z'
      ]);
    });

  });

  describe('getJobLogs', () => {

    it('should notify when no logs found for the job ID', () => {
      getJobLogs('non-existent-job');
      assert.deepEqual(consoleErrors, ['No logs found for job ID: non-existent-job']);
    });

    it('should display logs for an existing job ID', () => {
      mockFiles[path.resolve('logs', 'job1.log')] = 'Log entry 1\nLog entry 2';

      getJobLogs('job1');
      assert.deepEqual(consoleOutput, [
        'Logs for Job ID: job1\nLog entry 1\nLog entry 2'
      ]);
    });

  });

});
