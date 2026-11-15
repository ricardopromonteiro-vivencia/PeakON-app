import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useAppStore } from '../store/useAppStore';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut, userProfile, user, unreadNotifications } = useAppStore();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const initial = userProfile?.name
    ? userProfile.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen pb-32 relative max-w-md mx-auto shadow-2xl overflow-hidden sm:border-x border-outline-variant/20">
      <header className="bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 py-4 w-full top-0 sticky z-40 border-b border-outline-variant/10">
        <div className="flex items-center gap-4 relative">
          <button
            ref={buttonRef}
            onClick={() => setMenuOpen(!menuOpen)} 
            className="material-symbols-outlined text-primary cursor-pointer border border-outline-variant/30 rounded-full p-2 active:scale-95 transition-transform relative"
          >
            menu
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full ring-2 ring-surface"></span>
            )}
          </button>
          
          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute top-12 left-0 bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl w-56 overflow-hidden z-50"
            >
              <button onClick={() => { setMenuOpen(false); navigate('/notifications'); }} className="flex items-center gap-3 w-full p-4 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-lg">notifications</span> 
                <span className="flex-1 text-left">Notificações</span>
                {unreadNotifications > 0 && (
                  <span className="bg-error text-on-error text-xs font-black rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>
              <div className="h-[1px] w-full bg-outline-variant/20"></div>
              <button onClick={() => { setMenuOpen(false); navigate('/profile'); }} className="flex items-center gap-3 w-full p-4 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-lg">settings</span> Configurações
              </button>
              <div className="h-[1px] w-full bg-outline-variant/20"></div>
              <button onClick={() => { setMenuOpen(false); navigate('/terms'); }} className="flex items-center gap-3 w-full p-4 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-lg">gavel</span> Termos &amp; Privacidade
              </button>
              <div className="h-[1px] w-full bg-outline-variant/20"></div>
              <button onClick={() => { setMenuOpen(false); navigate('/help'); }} className="flex items-center gap-3 w-full p-4 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-lg">help</span> Ajuda &amp; Suporte
              </button>
              <div className="h-[1px] w-full bg-outline-variant/20"></div>
              <button onClick={() => { setMenuOpen(false); signOut(); }} className="flex items-center gap-3 w-full p-4 text-sm font-bold text-error hover:bg-error-container hover:text-on-error-container transition-colors">
                <span className="material-symbols-outlined text-lg">logout</span> Sair da Conta
              </button>
            </div>
          )}
          
          <h1 className="font-headline font-bold text-2xl tracking-tight text-primary">PeakON</h1>
        </div>
        <div 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container font-black shadow-sm ring-1 ring-outline-variant/10 cursor-pointer active:scale-95 transition-transform flex-shrink-0"
        >
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
      </header>

      <main className="px-6 pt-8 space-y-10">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
