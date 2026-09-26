import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAppStore = create((set) => ({
  user: null,
  session: null,
  userProfile: null, // Guarda a linha da tabela Users com Role, email, etc.
  setSession: async (session) => {
    if (session?.user) {
      // Vai buscar a metadata e o papel do utilizador (pt, client, admin)
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      set({ session, user: session.user, userProfile: data || null });
    } else {
      set({ session: null, user: null, userProfile: null });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, userProfile: null });
  }
}));
