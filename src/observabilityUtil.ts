import os from 'os';

interface MemoryUsage {
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
}

interface CpuUsage {
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

interface PerformanceMetrics {
  memory: MemoryUsage;
  cpu: CpuUsage[];
}

export function getMemoryUsage(): MemoryUsage {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  return {
    totalMemory,
    freeMemory,
    usedMemory,
  };
}

export function getCpuUsage(): CpuUsage[] {
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
}

export function generatePerformanceMetrics(): PerformanceMetrics {
  return {
    memory: getMemoryUsage(),
    cpu: getCpuUsage(),
  };
}
