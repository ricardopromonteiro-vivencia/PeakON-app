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

  const role = userProfile?.role || 'client';

  return (
    <BrowserRouter>
      <Routes>
        {session ? (
          <Route element={<Layout />}>
            {role === 'admin' && (
              <Route path="/admin" element={<AdminDashboard />} />
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
              </>
            )}

            {role === 'client' && (
              <>
                <Route path="/" element={<ClientDashboard />} />
                <Route path="/agenda" element={<Agenda />} />
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
