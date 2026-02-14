import fs from 'fs';
import path from 'path';

interface JobStatus {
  id: string;
  status: string;
  startTime: string;
  endTime?: string;
}

export function listRunningJobs(): void {
  const jobs = loadRunningJobs();
  if (jobs.length === 0) {
    console.log('No running jobs found.');
  } else {
    console.log('Running Jobs:');
    jobs.forEach(job => {
      console.log(`- [${job.id}] Status: ${job.status}, Started: ${job.startTime}`);
    });
  }
}

export function getJobLogs(jobId: string): void {
  const logsPath = path.resolve('logs', `${jobId}.log`);
  if (!fs.existsSync(logsPath)) {
    console.error(`No logs found for job ID: ${jobId}`);
    return;
  }

  const logs = fs.readFileSync(logsPath, 'utf8');
  console.log(`Logs for Job ID: ${jobId}\n${logs}`);
}

function loadRunningJobs(): JobStatus[] {
  // Hypothetical implementation to load jobs
  const jobsDataPath = path.resolve('data', 'running_jobs.json');
  if (!fs.existsSync(jobsDataPath)) return [];

  const jobsData = fs.readFileSync(jobsDataPath, 'utf8');
  return JSON.parse(jobsData) as JobStatus[];
}
