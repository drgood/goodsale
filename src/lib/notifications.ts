
'use client';

export type Notification = {
  id: string;
  type: 'sale' | 'stock' | 'user' | 'system';
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  data?: Record<string, any>;
  tenantId?: string;
  userId?: string;
};

/**
 * Fetch notifications from the API
 */
export async function fetchNotifications(limit: number = 10, isRead?: boolean): Promise<Notification[]> {
  try {
    const url = new URL('/api/notifications', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    url.searchParams.append('limit', limit.toString());
    if (isRead !== undefined) {
      url.searchParams.append('isRead', isRead.toString());
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('Failed to fetch notifications:', response.statusText);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(notificationIds: string[]): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mark-as-read',
        notificationIds,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mark-all-as-read',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Delete notifications
 */
export async function deleteNotifications(notificationIds: string[]): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        notificationIds,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return false;
  }
}

// Keep empty export for backward compatibility
export const notifications: Notification[] = [];
