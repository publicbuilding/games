/**
 * Enhanced Notification System
 * Displays persistent notifications with history
 */

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'important';
  duration: number; // milliseconds, 0 = permanent
  createdAt: number;
  dismissedAt?: number;
  requiresClick?: boolean; // Must be clicked to dismiss
}

let notificationIdCounter = 0;

export class NotificationSystem {
  private activeNotifications: Notification[] = [];
  private history: Notification[] = [];
  private maxHistory: number = 10;
  private currentNotificationId: string | null = null;

  /**
   * Show a notification
   */
  show(
    message: string,
    type: 'info' | 'success' | 'warning' | 'important' = 'info',
    duration: number = 5000,
    requiresClick: boolean = false
  ): string {
    const id = `notif_${notificationIdCounter++}`;
    
    const notification: Notification = {
      id,
      message,
      type,
      duration,
      createdAt: Date.now(),
      requiresClick: requiresClick || type === 'important',
    };

    this.activeNotifications.push(notification);
    this.currentNotificationId = id;

    // Add to history
    this.history.unshift({ ...notification });
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    console.log(`[Notification] ${type.toUpperCase()}: ${message}`);

    return id;
  }

  /**
   * Show success notification
   */
  success(message: string, duration: number = 5000): string {
    return this.show(message, 'success', duration, false);
  }

  /**
   * Show error/warning notification
   */
  warning(message: string, duration: number = 5000): string {
    return this.show(message, 'warning', duration, false);
  }

  /**
   * Show important notification (requires click)
   */
  important(message: string): string {
    return this.show(message, 'important', 0, true);
  }

  /**
   * Dismiss a notification
   */
  dismiss(id: string): void {
    const index = this.activeNotifications.findIndex(n => n.id === id);
    if (index >= 0) {
      const notif = this.activeNotifications[index];
      notif.dismissedAt = Date.now();
      this.activeNotifications.splice(index, 1);
      console.log(`[Notification] Dismissed: ${notif.message}`);
    }
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    for (const notif of this.activeNotifications) {
      notif.dismissedAt = Date.now();
    }
    this.activeNotifications = [];
  }

  /**
   * Get current primary notification
   */
  getCurrent(): Notification | null {
    return this.activeNotifications.length > 0 ? this.activeNotifications[0] : null;
  }

  /**
   * Get all active notifications
   */
  getActive(): Notification[] {
    return this.activeNotifications;
  }

  /**
   * Get notification history (last N notifications)
   */
  getHistory(limit: number = this.maxHistory): Notification[] {
    return this.history.slice(0, limit);
  }

  /**
   * Update notifications (remove expired ones)
   */
  update(deltaTime: number): void {
    const now = Date.now();
    this.activeNotifications = this.activeNotifications.filter(notif => {
      // Keep if requires click and not dismissed
      if (notif.requiresClick && !notif.dismissedAt) {
        return true;
      }
      // Keep if duration is 0 (permanent) and not dismissed
      if (notif.duration === 0 && !notif.dismissedAt) {
        return true;
      }
      // Keep if still within duration
      if (now - notif.createdAt < notif.duration && !notif.dismissedAt) {
        return true;
      }
      return false;
    });
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get total count
   */
  getCount(): number {
    return this.activeNotifications.length;
  }
}

export const notificationSystem = new NotificationSystem();
