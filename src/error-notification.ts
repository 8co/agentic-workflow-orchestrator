import { EnhancedLogger } from './enhanced-logger.js';

interface NotificationService {
  sendAlert(message: string): Promise<void>;
}

class ErrorNotification {
  private static logger = EnhancedLogger.getInstance();

  constructor(private notificationService: NotificationService) {}

  async notifyCriticalError(message: string): Promise<void> {
    this.logCriticalError(message);
    try {
      await this.notificationService.sendAlert(message);
    } catch (error: unknown) {
      ErrorNotification.logger.logError(`Failed to send alert: ${error}`);
    }
  }

  private logCriticalError(message: string): void {
    ErrorNotification.logger.logError(`Critical Error: ${message}`);
  }
}

export { ErrorNotification, NotificationService };
