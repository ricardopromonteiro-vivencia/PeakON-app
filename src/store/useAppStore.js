import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAppStore = create((set) => ({
  user: null,
  session: null,
  userProfile: null,

  setSession: async (session) => {
    if (session?.user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      set({ session, user: session.user, userProfile: data || null });
    } else {
      set({ session: null, user: null, userProfile: null });
    }
  },

  updateProfile: (fields) =>
    set((state) => ({
      userProfile: state.userProfile
        ? { ...state.userProfile, ...fields }
        : state.userProfile,
    })),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, userProfile: null });
  },
}));
