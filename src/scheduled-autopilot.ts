import { getHealthStatus } from './health.js';
import { getRemainingBudget, checkBudgetLimit } from './budget-manager.js';
import { createScheduler, SchedulerConfig } from './scheduler.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

// Define the ScheduledRunResult interface
interface ScheduledRunResult {
  timestamp: string;
  success: boolean;
  healthStatus: ReturnType<typeof getHealthStatus>;
  remainingBudget: number;
  taskResults?: Array<{
    taskId: string;
    success: boolean;
    error?: string;
    durationMs: number;
    branch?: string;
  }>;
}

// Named export for the function
export async function runScheduledCycle(): Promise<void> {
  const healthStatus = getHealthStatus();
  const remainingBudget = getRemainingBudget();

  if (healthStatus.status === 'down') {
    await logScheduledRun({
      timestamp: new Date().toISOString(),
      success: false,
      healthStatus,
      remainingBudget,
    });
    console.error('Health check failed, system status is down.');
    return;
  }

  if (!checkBudgetLimit()) {
    await logScheduledRun({
      timestamp: new Date().toISOString(),
      success: false,
      healthStatus,
      remainingBudget,
    });
    console.error('Exceeded budget limit.');
    return;
  }

  // Assuming no other autopilot is running for the sake of this task.
  const schedulerConfig: SchedulerConfig = {
    basePath: process.cwd(),
    adapters: {},
    defaultAgent: 'default-agent' as any, // Replace 'default-agent' with an available AgentType
  };

  const scheduler = createScheduler(schedulerConfig);

  try {
    const taskResults = await scheduler.loop();
    await logScheduledRun({
      timestamp: new Date().toISOString(),
      success: true,
      healthStatus,
      remainingBudget,
      taskResults,
    });
  } catch (err) {
    await logScheduledRun({
      timestamp: new Date().toISOString(),
      success: false,
      healthStatus,
      remainingBudget,
    });
    console.error('Error during autopilot cycle:', err);
  }
}

// Helper function to log the scheduled run
async function logScheduledRun(result: ScheduledRunResult): Promise<void> {
  const logFilePath = join(process.cwd(), 'scheduled-runs.json');
  let logs: ScheduledRunResult[] = [];
  try {
    const data = await fs.readFile(logFilePath, 'utf-8');
    logs = JSON.parse(data);
  } catch {
    logs = [];
  }
  logs.push(result);
  await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), 'utf-8');
}
