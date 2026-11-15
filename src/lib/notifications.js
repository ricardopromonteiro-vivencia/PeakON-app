import { supabase } from './supabase';

/**
 * Obter todas as notificações do utilizador
 */
export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao obter notificações:', error);
    return [];
  }

  return data || [];
}

/**
 * Contar notificações não lidas
 */
export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Marcar notificação como lida
 */
export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    throw error;
  }
}

/**
 * Subscrever a mudanças em tempo real nas notificações
 */
export function subscribeToNotifications(userId, callback) {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Apagar uma notificação
 */
export async function deleteNotification(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Erro ao apagar notificação:', error);
    throw error;
  }
}

/**
 * Criar uma notificação manualmente (para testes ou uso específico)
 */
export async function createNotification({ userId, type, title, message, data = {} }) {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        type,
        title,
        message,
        data,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }

  return notification;
}
