import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { listRunningJobs, getJobLogs } from '../src/cli-observability-commands';

describe('CLI Observability Commands', () => {
  const mockJobsPath = path.resolve('data', 'running_jobs.json');
  const mockLogsDir = path.resolve('logs');

  beforeEach(() => {
    if (!fs.existsSync(path.resolve('data'))) {
      fs.mkdirSync(path.resolve('data'));
    }
    if (!fs.existsSync(mockLogsDir)) {
      fs.mkdirSync(mockLogsDir);
    }
  });

  describe('listRunningJobs', () => {
    it('should display no running jobs when the jobs file is empty', () => {
      fs.writeFileSync(mockJobsPath, JSON.stringify([]), 'utf8');

      let output = '';
      const storeLog = (logs: string) => { output += logs; };
      const originalConsoleLog = console.log;
      console.log = storeLog;

      listRunningJobs();

      console.log = originalConsoleLog;
      assert.strictEqual(output.trim(), 'No running jobs found.');
    });

    it('should display running jobs when jobs are available', () => {
      const mockJobs = [
        { id: '1', status: 'running', startTime: '2023-10-01T10:00:00Z' },
      ];
      fs.writeFileSync(mockJobsPath, JSON.stringify(mockJobs), 'utf8');

      let output = '';
      const storeLog = (logs: string) => { output += logs; };
      const originalConsoleLog = console.log;
      console.log = storeLog;

      listRunningJobs();

      console.log = originalConsoleLog;
      assert(output.includes('[1] Status: running, Started: 2023-10-01T10:00:00Z'), 'Output should include job details');
    });
  });

  describe('getJobLogs', () => {
    it('should display no logs found when log file does not exist', () => {
      const jobId = 'non-existent-job';
      let output = '';
      const storeError = (logs: string) => { output += logs; };
      const originalConsoleError = console.error;
      console.error = storeError;

      getJobLogs(jobId);

      console.error = originalConsoleError;
      assert.strictEqual(output.trim(), `No logs found for job ID: ${jobId}`);
    });

    it('should display logs when log file exists', () => {
      const jobId = 'existing-job';
      const logContent = 'Job executed successfully';

      const logFilePath = path.join(mockLogsDir, `${jobId}.log`);
      fs.writeFileSync(logFilePath, logContent, 'utf8');

      let output = '';
      const storeLog = (logs: string) => { output += logs; };
      const originalConsoleLog = console.log;
      console.log = storeLog;

      getJobLogs(jobId);

      console.log = originalConsoleLog;
      assert(output.includes(logContent), 'Output should include log content');
    });
  });
});
