import { generatePerformanceMetrics, PerformanceMetrics } from './observabilityUtil.js';

function logToCentralizedSystem(metrics: PerformanceMetrics): void {
  try {
    console.log('Sending metrics to centralized system:', metrics);
    // Here, you would typically send the metrics to a remote logging system
  } catch (error: unknown) {
    console.error('Failed to send metrics to centralized system:', error instanceof Error ? error.message : error);
  }
}

export function collectAndSendMetrics(): void {
  try {
    const metrics = generatePerformanceMetrics();
    logToCentralizedSystem(metrics);
  } catch (error: unknown) {
    console.error('Failed to collect and send metrics:', error instanceof Error ? error.message : error);
  }
}
