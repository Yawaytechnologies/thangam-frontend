import api from '../lib/axios';
import type {
  Notification,
  NotificationRecipient,
  NotificationType,
  NotificationStatus,
  MessageType,
  PaginatedResponse,
} from '../types';

export interface NotificationParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  status?: NotificationStatus;
}

export interface UnreadCountResponse {
  count: number;
}

export interface SendMessageData {
  notificationId: string;
  recipientName: string;
  recipientRole: string;
  messageType: MessageType;
  subject: string;
  body: string;
  branchId?: string;
  relatedModule?: string;
  relatedEntityId?: string;
}

export const notificationsApi = {
  getAll: (params?: NotificationParams): Promise<PaginatedResponse<NotificationRecipient>> =>
    api.get('/notifications', { params }).then((r) => r.data.data),

  getLatest: (): Promise<NotificationRecipient[]> =>
    api.get('/notifications/latest').then((r) => r.data.data),

  getUnreadCount: (): Promise<UnreadCountResponse> =>
    api.get('/notifications/unread-count').then((r) => r.data.data),

  getOne: (id: string): Promise<Notification> =>
    api.get(`/notifications/${id}`).then((r) => r.data.data),

  markRead: (id: string): Promise<NotificationRecipient> =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data.data),

  markAllRead: (): Promise<{ updated: number }> =>
    api.patch('/notifications/mark-all-read').then((r) => r.data.data),

  sendMessage: (data: SendMessageData): Promise<void> =>
    api.post('/notifications/send-message', data).then(() => undefined),
};
