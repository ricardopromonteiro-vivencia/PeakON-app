import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useAppStore } from '../store/useAppStore';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const signOut = useAppStore(state => state.signOut);

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen pb-32 relative max-w-md mx-auto shadow-2xl overflow-hidden sm:border-x border-outline-variant/20">
      <header className="bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 py-4 w-full top-0 sticky z-40 border-b border-outline-variant/10">
        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="material-symbols-outlined text-primary cursor-pointer border border-outline-variant/30 rounded-full p-2 active:scale-95 transition-transform"
          >
            menu
          </button>
          
          {menuOpen && (
            <div className="absolute top-12 left-0 bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl w-56 overflow-hidden z-50">
              <button onClick={() => { setMenuOpen(false); alert('Em Construção 🚀'); }} className="flex items-center gap-3 w-full p-4 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-lg">settings</span> Configurações
              </button>
              <div className="h-[1px] w-full bg-outline-variant/20"></div>
              <button onClick={() => { setMenuOpen(false); signOut(); }} className="flex items-center gap-3 w-full p-4 text-sm font-bold text-error hover:bg-error-container hover:text-on-error-container transition-colors">
                <span className="material-symbols-outlined text-lg">logout</span> Sair da Conta
              </button>
            </div>
          )}
          
          <h1 className="font-headline font-bold text-2xl tracking-tight text-primary">PeakON</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-black shadow-sm ring-1 ring-outline-variant/10">
          PT
        </div>
      </header>

      <main className="px-6 pt-8 space-y-10">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
