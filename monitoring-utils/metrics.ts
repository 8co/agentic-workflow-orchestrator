export type Metric = {
    name: string;
    value: number;
    timestamp: Date;
};

export function logMetric(metric: Metric): void {
    console.log(`[METRIC] ${metric.name} - Value: ${metric.value}, Timestamp: ${metric.timestamp.toISOString()}`);
}

export function captureRuntimeMetric(name: string, value: number): void {
    const metric: Metric = {
        name,
        value,
        timestamp: new Date()
    };
    logMetric(metric);
}
