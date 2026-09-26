import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [pts, setPts] = useState([]);
  
  useEffect(() => {
    supabase.from('users').select('*').eq('role', 'pt').then(({ data }) => setPts(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-primary font-headline tracking-tighter">Portal Admin</h2>
        <p className="text-on-surface-variant font-medium mt-1">Gestão global de Profissionais.</p>
      </div>

      <div className="space-y-4 pt-4 pb-32">
        <h3 className="font-bold text-sm uppercase tracking-widest text-[#00677f]">Personal Trainers Registados</h3>
        {pts.map(pt => (
          <div key={pt.id} className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-primary">{pt.email}</p>
              <p className="text-xs text-on-surface-variant mt-1">Registado em {new Date(pt.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {pts.length === 0 && (
          <div className="bg-surface-container-low p-6 rounded-[2rem] text-center border-dashed border-2 border-outline-variant/30">
            Ainda não há PTs no sistema.
          </div>
        )}
      </div>
    </div>
  );
}
