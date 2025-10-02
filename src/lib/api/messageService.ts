// lib/api/messagesService.ts
import { authService, getAuthHeader } from '../auth/authservice';
import { BACKEND_BASE_URL } from '../constants/api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Message {
  id: number;
  content: string;
  sender: { id: number; name: string };
  receiver: { id: number; name: string };
  isRead: boolean;
  isReported: boolean;
  createdAt: string;
}
interface ReportMessageResponse {
  success: boolean;
  message?: string;
}

class MessagesService {
  private baseUrl = BACKEND_BASE_URL;
  private conversationsCache: User[] | null = null;
  private unreadCountCache: number | null = null;

 async getConversations(): Promise<User[]> {
   if (this.conversationsCache) {
      return this.conversationsCache;
    }
  try {

    const response = await authService.authenticatedFetch(`${this.baseUrl}/messages`, {
      
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    const data = await response.json();
     this.conversationsCache= data.conversations || []; //  Always return array
     return this.conversationsCache?this.conversationsCache : []
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return []; // Return empty array on error
  }
}
  async getUnreadMessageCount(): Promise<number> {
    
    if (this.unreadCountCache !== null) {
      return this.unreadCountCache;
    }
    
    const response = await authService.authenticatedFetch(`${this.baseUrl}/messages/unread-count`, {

    });
    const data = await response.json();
    this.unreadCountCache = data.count || 0;
    return (this.unreadCountCache?this.unreadCountCache:0);
  }

  async getMessagesWithUser(userId: number){
    const response = await fetch(`${this.baseUrl}/messages/${userId}`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
    console.log("Data : ",data)
    return data.messages;
  }

  async reportMessage(messageId: number): Promise<ReportMessageResponse> {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    if (!response.ok) throw new Error('Failed to report message');
    return response.json();
  }

  async markAsRead(userId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/${userId}/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      if (!response.ok) throw new Error('Failed to mark messages as read');
      
      // Clear the unread count cache since messages are now read
      this.unreadCountCache = null;
      
      return response.json();
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  }
  clearCache() {
    this.conversationsCache = null;
    this.unreadCountCache = null;
  }
}

export const messagesService = new MessagesService();