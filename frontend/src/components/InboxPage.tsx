import React, { useState, useEffect, useCallback } from 'react';
import { inboxService } from '../services/inboxService';
import { useAuth } from '../contexts/AuthContextLocal';
import { Inbox } from '../services/indexedDB';

const InboxPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Inbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Inbox | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const loadMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userMessages = await inboxService.getUserMessages(user.id);
      setMessages(userMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user, loadMessages]);

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await inboxService.markAsRead(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await inboxService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await inboxService.markAllAsRead(user.id);
      setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  };

  const filteredMessages = messages.filter(message => {
    if (filterType === 'ALL') return true;
    if (filterType === 'UNREAD') return !message.isRead;
    return message.type === filterType.toLowerCase();
  });

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'transfer': return '🔄';
      case 'system': return '⚙️';
      default: return 'ℹ️';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'transfer': return 'text-blue-600';
      case 'system': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inbox</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All messages read'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md">
            {/* Filter Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex flex-wrap">
                {['ALL', 'UNREAD', 'success', 'info', 'warning', 'transfer', 'system'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      filterType === type
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {type === 'ALL' ? 'All' : type === 'UNREAD' ? 'Unread' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Items */}
            <div className="max-h-96 overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No messages found
                </div>
              ) : (
                filteredMessages.map(message => (
                  <div
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.isRead) {
                        handleMarkAsRead(message.id);
                      }
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      !message.isRead ? 'bg-blue-50' : ''
                    } ${selectedMessage?.id === message.id ? 'bg-blue-100' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className={`text-lg ${getMessageTypeColor(message.type)}`}>
                        {getMessageTypeIcon(message.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium truncate ${
                            !message.isRead ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {message.subject}
                          </h4>
                          {!message.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`text-2xl ${getMessageTypeColor(selectedMessage.type)}`}>
                    {getMessageTypeIcon(selectedMessage.type)}
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                  title="Delete message"
                >
                  🗑️
                </button>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  selectedMessage.type === 'success' ? 'bg-green-100 text-green-800' :
                  selectedMessage.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  selectedMessage.type === 'transfer' ? 'bg-blue-100 text-blue-800' :
                  selectedMessage.type === 'system' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedMessage.type.charAt(0).toUpperCase() + selectedMessage.type.slice(1)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a message</h3>
              <p className="text-gray-500">Choose a message from the list to read its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
