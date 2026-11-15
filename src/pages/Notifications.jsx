import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
} from '../lib/notifications';

export default function Notifications() {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Subscrever a notificações em tempo real
    const unsubscribe = subscribeToNotifications(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setNotifications((prev) => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setNotifications((prev) =>
          prev.map((n) => (n.id === payload.new.id ? payload.new : n))
        );
      } else if (payload.eventType === 'DELETE') {
        setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
      }
    });

    return unsubscribe;
  }, [user]);

  async function loadNotifications() {
    if (!user) return;
    setLoading(true);
    const data = await getNotifications(user.id);
    setNotifications(data);
    setLoading(false);
  }

  async function handleMarkAsRead(notificationId) {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }

  async function handleDelete(notificationId) {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Erro ao apagar notificação:', error);
    }
  }

  function handleNotificationClick(notification) {
    // Marca como lida
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navega para a página apropriada baseado no tipo
    if (notification.type === 'new_plan' && notification.data?.plan_id) {
      navigate('/');
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tighter text-primary font-headline">
            Notificações
          </h2>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tighter text-primary font-headline">
          Notificações
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm font-bold text-primary hover:underline"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-surface-container rounded-[2rem] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-outline">
              notifications_off
            </span>
          </div>
          <p className="text-on-surface-variant text-sm">
            Não tens notificações
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all ${
                notification.read
                  ? 'bg-surface-container hover:bg-surface-container-high'
                  : 'bg-primary-container hover:bg-primary-container/80 ring-2 ring-primary/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                      className={`font-bold text-sm ${
                        notification.read
                          ? 'text-on-surface'
                          : 'text-on-primary-container'
                      }`}
                    >
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                  <p
                    className={`text-xs mb-2 leading-relaxed ${
                      notification.read
                        ? 'text-on-surface-variant'
                        : 'text-on-primary-container/80'
                    }`}
                  >
                    {notification.message}
                  </p>
                  <p
                    className={`text-xs ${
                      notification.read
                        ? 'text-outline'
                        : 'text-on-primary-container/60'
                    }`}
                  >
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                  className={`material-symbols-outlined text-lg flex-shrink-0 hover:scale-110 transition-transform ${
                    notification.read
                      ? 'text-outline hover:text-error'
                      : 'text-on-primary-container/60 hover:text-error'
                  }`}
                >
                  close
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays < 7) return `Há ${diffDays}d`;

  return date.toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
