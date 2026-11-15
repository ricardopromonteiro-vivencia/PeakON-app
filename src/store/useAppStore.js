import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getUnreadCount, subscribeToNotifications } from '../lib/notifications';

export const useAppStore = create((set, get) => ({
  user: null,
  session: null,
  userProfile: null,
  unreadNotifications: 0,
  notificationUnsubscribe: null,

  setSession: async (session) => {
    if (session?.user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      set({ session, user: session.user, userProfile: data || null });
      
      // Carregar contagem de notificações não lidas
      get().loadUnreadCount();
      
      // Subscrever a notificações em tempo real
      const unsubscribe = subscribeToNotifications(session.user.id, () => {
        get().loadUnreadCount();
      });
      set({ notificationUnsubscribe: unsubscribe });
    } else {
      // Limpar subscrição ao fazer logout
      const { notificationUnsubscribe } = get();
      if (notificationUnsubscribe) {
        notificationUnsubscribe();
      }
      set({ 
        session: null, 
        user: null, 
        userProfile: null, 
        unreadNotifications: 0,
        notificationUnsubscribe: null 
      });
    }
  },

  loadUnreadCount: async () => {
    const { user } = get();
    if (!user) return;
    const count = await getUnreadCount(user.id);
    set({ unreadNotifications: count });
  },

  updateProfile: (fields) =>
    set((state) => ({
      userProfile: state.userProfile
        ? { ...state.userProfile, ...fields }
        : state.userProfile,
    })),

  signOut: async () => {
    const { notificationUnsubscribe } = get();
    if (notificationUnsubscribe) {
      notificationUnsubscribe();
    }
    await supabase.auth.signOut();
    set({ 
      user: null, 
      session: null, 
      userProfile: null, 
      unreadNotifications: 0,
      notificationUnsubscribe: null 
    });
  },
}));
