import test from 'node:test';
import assert from 'node:assert/strict';
import { ErrorNotification, NotificationService } from './error-notification.js';

class MockNotificationService implements NotificationService {
  public shouldFail = false;
  public messages: string[] = [];

  async sendAlert(message: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error('Service unavailable');
    }
    this.messages.push(message);
  }
}

class MockLogger {
  public static errors: string[] = [];

  static getInstance() {
    return this;
  }

  static logError(message: string): void {
    this.errors.push(message);
  }
}

test('notifyCriticalError sends alert and logs error when alert succeeds', async () => {
  const mockService = new MockNotificationService();
  const errorNotification = new ErrorNotification(mockService);

  // Replace the logger with the mock logger
  (ErrorNotification as any).logger = MockLogger;

  const errorMessage = "Critical system failure";

  await errorNotification.notifyCriticalError(errorMessage);

  assert.deepEqual(mockService.messages, [errorMessage]);
  assert.ok(MockLogger.errors.includes(`Critical Error: ${errorMessage}`));
});

test('notifyCriticalError handles failure in sending alert and logs error', async () => {
  const mockService = new MockNotificationService();
  mockService.shouldFail = true;
  const errorNotification = new ErrorNotification(mockService);

  // Replace the logger with the mock logger
  (ErrorNotification as any).logger = MockLogger;
  
  const errorMessage = "Critical system failure";

  await errorNotification.notifyCriticalError(errorMessage);

  assert.ok(MockLogger.errors.includes(`Critical Error: ${errorMessage}`));
  assert.ok(MockLogger.errors.some(error => error.startsWith('Failed to send alert: Service unavailable')));
});
