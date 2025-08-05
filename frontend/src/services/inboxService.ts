// Inbox Service using IndexedDB
// Replaces Firebase Inbox operations

import { dbService, Inbox } from './indexedDB';

class InboxService {
  // Create a new inbox message
  async createMessage(messageData: {
    userId: string;
    subject: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'transfer' | 'system';
  }): Promise<Inbox> {
    try {
      const inboxMessage = await dbService.createInboxMessage({
        ...messageData,
        isRead: false,
      });
      
      console.log(`✅ Inbox message created for user ${messageData.userId}`);
      return inboxMessage;
    } catch (error) {
      console.error('Failed to create inbox message:', error);
      throw new Error('Failed to create inbox message');
    }
  }

  // Get all messages for a user
  async getUserMessages(userId: string): Promise<Inbox[]> {
    try {
      const messages = await dbService.getInboxByUserId(userId);
      return messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get user messages:', error);
      throw new Error('Failed to load messages');
    }
  }

  // Get unread messages count for a user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const messages = await dbService.getInboxByUserId(userId);
      return messages.filter(message => !message.isRead).length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Mark message as read
  async markAsRead(messageId: string): Promise<Inbox> {
    try {
      const updatedMessage = await dbService.updateInboxMessage(messageId, {
        isRead: true,
      });
      
      console.log(`✅ Message ${messageId} marked as read`);
      return updatedMessage;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }

  // Mark all messages as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const messages = await dbService.getInboxByUserId(userId);
      const unreadMessages = messages.filter(message => !message.isRead);
      
      for (const message of unreadMessages) {
        await dbService.updateInboxMessage(message.id, { isRead: true });
      }
      
      console.log(`✅ All messages marked as read for user ${userId}`);
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
      throw new Error('Failed to mark all messages as read');
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await dbService.deleteInboxMessage(messageId);
      console.log(`✅ Message ${messageId} deleted`);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw new Error('Failed to delete message');
    }
  }

  // Delete all messages for a user
  async deleteAllMessages(userId: string): Promise<void> {
    try {
      const messages = await dbService.getInboxByUserId(userId);
      
      for (const message of messages) {
        await dbService.deleteInboxMessage(message.id);
      }
      
      console.log(`✅ All messages deleted for user ${userId}`);
    } catch (error) {
      console.error('Failed to delete all messages:', error);
      throw new Error('Failed to delete all messages');
    }
  }

  // Send system message to all users
  async sendSystemMessage(subject: string, message: string, type: 'info' | 'warning' | 'success' | 'system' = 'system'): Promise<void> {
    try {
      const users = await dbService.getAllUsers();
      
      for (const user of users) {
        await this.createMessage({
          userId: user.id,
          subject,
          message,
          type,
        });
      }
      
      console.log(`✅ System message sent to ${users.length} users`);
    } catch (error) {
      console.error('Failed to send system message:', error);
      throw new Error('Failed to send system message');
    }
  }

  // Send welcome message to new user
  async sendWelcomeMessage(userId: string, username: string): Promise<void> {
    try {
      await this.createMessage({
        userId,
        subject: '🎉 Welcome to TSW Fantasy League!',
        message: `Hello ${username}! Welcome to TSW Fantasy League. You've been given £300M to create your dream team. Good luck and have fun!`,
        type: 'success',
      });
      
      console.log(`✅ Welcome message sent to user ${username}`);
    } catch (error) {
      console.error('Failed to send welcome message:', error);
      // Don't throw error for welcome message failure
    }
  }

  // Send team creation confirmation
  async sendTeamCreationMessage(userId: string, teamName: string): Promise<void> {
    try {
      await this.createMessage({
        userId,
        subject: '⚽ Team Created Successfully!',
        message: `Congratulations! Your team "${teamName}" has been created successfully. You can now participate in gameweeks and compete with other managers.`,
        type: 'success',
      });
      
      console.log(`✅ Team creation message sent to user ${userId}`);
    } catch (error) {
      console.error('Failed to send team creation message:', error);
      // Don't throw error for notification failure
    }
  }

  // Send transfer confirmation
  async sendTransferMessage(userId: string, playersOut: string[], playersIn: string[]): Promise<void> {
    try {
      const message = `Transfer completed! Players out: ${playersOut.join(', ')}. Players in: ${playersIn.join(', ')}.`;
      
      await this.createMessage({
        userId,
        subject: '🔄 Transfer Completed',
        message,
        type: 'transfer',
      });
      
      console.log(`✅ Transfer message sent to user ${userId}`);
    } catch (error) {
      console.error('Failed to send transfer message:', error);
      // Don't throw error for notification failure
    }
  }

  // Send gameweek results
  async sendGameweekResults(userId: string, gameweek: number, points: number, rank: number): Promise<void> {
    try {
      await this.createMessage({
        userId,
        subject: `📊 Gameweek ${gameweek} Results`,
        message: `Your team scored ${points} points in Gameweek ${gameweek}. Your current rank is ${rank}. Keep up the good work!`,
        type: 'info',
      });
      
      console.log(`✅ Gameweek results sent to user ${userId}`);
    } catch (error) {
      console.error('Failed to send gameweek results:', error);
      // Don't throw error for notification failure
    }
  }

  // Get messages by type
  async getMessagesByType(userId: string, type: 'info' | 'warning' | 'success' | 'transfer' | 'system'): Promise<Inbox[]> {
    try {
      const allMessages = await dbService.getInboxByUserId(userId);
      return allMessages.filter(message => message.type === type);
    } catch (error) {
      console.error('Failed to get messages by type:', error);
      throw new Error('Failed to load messages');
    }
  }

  // Search messages
  async searchMessages(userId: string, query: string): Promise<Inbox[]> {
    try {
      const allMessages = await dbService.getInboxByUserId(userId);
      const searchQuery = query.toLowerCase();
      
      return allMessages.filter(message => 
        message.subject.toLowerCase().includes(searchQuery) ||
        message.message.toLowerCase().includes(searchQuery)
      );
    } catch (error) {
      console.error('Failed to search messages:', error);
      throw new Error('Failed to search messages');
    }
  }
}

// Export singleton instance
export const inboxService = new InboxService();
export default inboxService;
