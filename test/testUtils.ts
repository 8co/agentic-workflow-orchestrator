let originalConsoleLog: typeof console.log;
const capturedLogs: string[] = [];

export function captureConsoleLogs(fn: () => void): string[] {
  originalConsoleLog = console.log;
  capturedLogs.length = 0;

  console.log = (...args: unknown[]) => {
    capturedLogs.push(args.join(' '));
  };

  try {
    fn();
  } finally {
    console.log = originalConsoleLog;
  }

  return capturedLogs;
}
