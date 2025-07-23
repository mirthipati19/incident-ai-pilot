import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X, MessageCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService, ChatNotification } from '@/services/notificationService';

interface NotificationBarProps {
  isVisible: boolean;
  onToggle: () => void;
}

const NotificationBar: React.FC<NotificationBarProps> = ({ isVisible, onToggle }) => {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    const channel = notificationService.subscribeToNotifications((notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Chat Message', {
          body: notification.message_content,
          icon: '/favicon.ico',
          tag: notification.id
        });
      }
    });

    return () => {
      if (channel) {
        channel.then(ch => ch?.unsubscribe());
      }
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const unreadNotifications = await notificationService.getUnreadNotifications();
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.length;

  return (
    <>
      {/* Notification Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="relative bg-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 min-w-5 h-5 rounded-full text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-16 right-4 w-80 max-h-96 z-40"
          >
            <Card className="shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      onClick={handleMarkAllAsRead}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark All Read
                    </Button>
                  )}
                  <Button
                    onClick={onToggle}
                    variant="ghost"
                    size="sm"
                    className="p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-0 max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Bell className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <MessageCircle className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.sender_name || 'Support'}
                              </p>
                              <Button
                                onClick={() => handleMarkAsRead(notification.id)}
                                variant="ghost"
                                size="sm"
                                className="p-1"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message_content}
                            </p>
                            
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationBar;