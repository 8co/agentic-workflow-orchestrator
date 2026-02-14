import os from 'os';

export interface MemoryUsage {
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
}

export interface CpuUsage {
  model: string;
  speed: number;
  times: {
    user: number;
    nice: number;
    sys: number;
    idle: number;
    irq: number;
  };
}

export interface PerformanceMetrics {
  memory: MemoryUsage;
  cpu: CpuUsage[];
}

function logError(message: string, error: unknown): void {
  console.error(`${message}:`, error instanceof Error ? error.message : error);
}

export function getMemoryUsage(): MemoryUsage {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return {
      totalMemory,
      freeMemory,
      usedMemory,
    };
  } catch (error: unknown) {
    logError('Failed to retrieve memory usage', error);
    // Provide default values in case of error
    return {
      totalMemory: 0,
      freeMemory: 0,
      usedMemory: 0,
    };
  }
}

export function getCpuUsage(): CpuUsage[] {
  try {
    return os.cpus().map(cpu => ({
      model: cpu.model,
      speed: cpu.speed,
      times: {
        user: cpu.times.user,
        nice: cpu.times.nice,
        sys: cpu.times.sys,
        idle: cpu.times.idle,
        irq: cpu.times.irq,
      },
    }));
  } catch (error: unknown) {
    logError('Failed to retrieve CPU usage', error);
    // Provide default values in case of error
    return [];
  }
}

export function generatePerformanceMetrics(): PerformanceMetrics {
  try {
    return {
      memory: getMemoryUsage(),
      cpu: getCpuUsage(),
    };
  } catch (error: unknown) {
    logError('Failed to generate performance metrics', error);
    // Provide default values in case of error
    return {
      memory: {
        totalMemory: 0,
        freeMemory: 0,
        usedMemory: 0,
      },
      cpu: [],
    };
  }
}
