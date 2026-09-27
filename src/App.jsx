import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAppStore } from './store/useAppStore';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddClient from './pages/AddClient';
import ClientProfile from './pages/ClientProfile';
import LogWorkout from './pages/LogWorkout';
import LogProgress from './pages/LogProgress';
import LogPhoto from './pages/LogPhoto';

import AdminDashboard from './pages/AdminDashboard';
import WorkoutManager from './pages/WorkoutManager';
import Agenda from './pages/Agenda';
import ClientDashboard from './pages/ClientDashboard';
import Profile from './pages/Profile';
import AdminPTView from './pages/AdminPTView';
import AdminClientView from './pages/AdminClientView';
import Terms from './pages/Terms';
import Help from './pages/Help';

export default function App() {
  const { session, userProfile, setSession } = useAppStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  if (session && !userProfile) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-primary bg-surface animate-pulse">A carregar perfil...</div>;
  }

  // Conta suspensa — mostra ecrã de bloqueio e faz logout
  if (session && userProfile?.status === 'suspended') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-container-low px-6 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-error/10 rounded-[2rem] flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-error text-4xl">block</span>
        </div>
        <h2 className="text-2xl font-black text-primary font-headline tracking-tighter mb-3">
          Conta Suspensa
        </h2>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
          A tua conta foi suspensa. Para mais informações contacta o administrador em{' '}
          <a href="mailto:peakon.app@gmail.com" className="text-primary font-bold">peakon.app@gmail.com</a>.
        </p>
        <button
          onClick={() => useAppStore.getState().signOut()}
          className="w-full bg-primary text-on-primary rounded-full font-bold py-4 active:scale-95 transition-transform"
        >
          Sair
        </button>
      </div>
    );
  }

  const role = userProfile?.role || 'client';

  return (
    <BrowserRouter>
      <Routes>
        {session ? (
          <Route element={<Layout />}>
            {role === 'admin' && (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/pt/:ptId" element={<AdminPTView />} />
                <Route path="/admin/pt/:ptId/client/:clientId" element={<AdminClientView />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/help" element={<Help />} />
              </>
            )}
            
            {role === 'pt' && (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/client/add" element={<AddClient />} />
                <Route path="/client/:id" element={<ClientProfile />} />
                <Route path="/client/:id/workout" element={<LogWorkout />} />
                <Route path="/client/:id/progress" element={<LogProgress />} />
                <Route path="/client/:id/photo" element={<LogPhoto />} />
                <Route path="/workouts" element={<WorkoutManager />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/help" element={<Help />} />
              </>
            )}

            {role === 'client' && (
              <>
                <Route path="/" element={<ClientDashboard />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/help" element={<Help />} />
              </>
            )}

            <Route path="*" element={<Navigate to={role === 'admin' ? '/admin' : role === 'pt' ? '/' : '/'} replace />} />
          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
