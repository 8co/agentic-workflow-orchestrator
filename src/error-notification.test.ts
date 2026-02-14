import { test } from 'node:test';
import assert from 'node:assert';
import { ErrorNotification, NotificationService } from './error-notification.js';

// Mock EnhancedLogger since it's not provided and focus on the ErrorNotification
class MockLogger {
  messages: string[] = [];
  logError(message: string): void {
    this.messages.push(message);
  }
  static getInstance() {
    return new MockLogger();
  }
}

class MockNotificationService implements NotificationService {
  sendAlertCalled: boolean = false;
  sendAlert(message: string): Promise<void> {
    this.sendAlertCalled = true;
    return Promise.resolve();
  }
}

class FailingNotificationService implements NotificationService {
  sendAlert(message: string): Promise<void> {
    return Promise.reject(new Error('Failed to send'));
  }
}

// Inject mock logger into ErrorNotification
(ErrorNotification as any).logger = MockLogger.getInstance();

test('notifyCriticalError logs and sends alert', async (t) => {
  const logger = (ErrorNotification as any).logger as MockLogger;
  const mockService = new MockNotificationService();
  const errorNotification = new ErrorNotification(mockService);

  await errorNotification.notifyCriticalError('Test error');

  assert.strictEqual(
    logger.messages.includes('Critical Error: Test error'),
    true,
    'Should log critical error'
  );

  assert.strictEqual(
    mockService.sendAlertCalled,
    true,
    'Should call sendAlert on NotificationService'
  );
});

test('notifyCriticalError logs failure to send alert', async (t) => {
  const logger = (ErrorNotification as any).logger as MockLogger;
  const failingService = new FailingNotificationService();
  const errorNotification = new ErrorNotification(failingService);

  await errorNotification.notifyCriticalError('Test error');

  assert.strictEqual(
    logger.messages.includes('Critical Error: Test error'),
    true,
    'Should log critical error'
  );

  const errorLogged = logger.messages.some((message) =>
    message.includes('Failed to send alert: Error: Failed to send')
  );

  assert.strictEqual(
    errorLogged,
    true,
    'Should log error when sendAlert fails'
  );
});
