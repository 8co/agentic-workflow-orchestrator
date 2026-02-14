export type EventNotification = {
    event: string;
    message: string;
    timestamp: Date;
};

export function logEventNotification(notification: EventNotification): void {
    console.log(`[EVENT] ${notification.event} - Message: ${notification.message}, Timestamp: ${notification.timestamp.toISOString()}`);
}

export function notifyEvent(event: string, message: string): void {
    const notification: EventNotification = {
        event,
        message,
        timestamp: new Date()
    };
    logEventNotification(notification);
}
