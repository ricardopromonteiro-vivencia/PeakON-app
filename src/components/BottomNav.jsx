import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export default function BottomNav() {
  const { userProfile } = useAppStore();
  const role = userProfile?.role || 'client';

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-around items-center px-4 pb-6 pt-3 bg-surface z-50 rounded-t-[2rem] border-t border-outline-variant/15 shadow-[0_-4px_24px_rgba(0,19,89,0.04)]">
      {role === 'admin' && (
        <NavItem to="/admin" icon="admin_panel_settings" label="Global" />
      )}
      {role === 'pt' && (
        <>
          <NavItem to="/" icon="dashboard" label="Dashboard" />
          <NavItem to="/agenda" icon="calendar_month" label="Agenda" />
          <NavItem to="/workouts" icon="fitness_center" label="Treinos" />
        </>
      )}
      {role === 'client' && (
        <>
          <NavItem to="/my-timeline" icon="timeline" label="Evolução" />
          <NavItem to="/agenda" icon="calendar_month" label="Agenda" />
        </>
      )}
      <NavItem to="/profile" icon="person" label="Perfil" />
    </nav>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex flex-col items-center justify-center px-5 py-2 transition-transform duration-150 rounded-[1.2rem] active:scale-95 ${
          isActive 
            ? 'bg-secondary-container text-on-secondary-container' 
            : 'text-outline hover:text-primary hover:bg-surface-container-low'
        }`
      }
    >
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <span className="font-medium text-[10px] uppercase tracking-widest mt-1">{label}</span>
    </NavLink>
  );
}
