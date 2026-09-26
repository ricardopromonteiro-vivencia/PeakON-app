import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getClients } from '../lib/api';

export default function Dashboard() {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await getClients(user.id);
        setClients(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    if (user) loadClients();
  }, [user]);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-on-surface-variant font-label text-sm font-black uppercase tracking-widest mb-1 opacity-70">Visão Geral</p>
        <h2 className="text-primary font-headline font-black text-4xl tracking-tighter">Os Meus Alunos</h2>
      </section>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
        </div>
      ) : clients.length === 0 ? (
        <div onClick={() => navigate('/client/add')} className="p-8 bg-surface-container border border-outline-variant/10 rounded-[2rem] text-center shadow-sm cursor-pointer active:scale-95 transition-transform">
          <div className="w-16 h-16 bg-secondary-container rounded-full mx-auto flex items-center justify-center mb-4 text-on-secondary-container">
             <span className="material-symbols-outlined text-3xl">person_add</span>
          </div>
          <h3 className="text-xl font-bold text-primary">Ainda não há clientes</h3>
          <p className="text-on-surface-variant font-medium mt-2 text-sm">Clica aqui para adicionar o teu primeiro aluno.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {clients.map(client => (
            <div 
              key={client.id}
              onClick={() => navigate(`/client/${client.id}`)}
              className="bg-surface-container-low p-5 rounded-[1.5rem] flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer shadow-[0_2px_12px_rgba(0,19,89,0.03)] border border-outline-variant/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#dde1ff] rounded-full flex items-center justify-center text-[#001359] font-black text-2xl uppercase shadow-inner">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-headline font-bold text-xl text-primary leading-tight">{client.name}</h4>
                  {client.goal && (
                    <span className="inline-block mt-1 bg-[#b7eaff] text-[#005266] text-[10px] font-black px-2 py-[2px] rounded-full uppercase tracking-wider">
                      {client.goal}
                    </span>
                  )}
                </div>
              </div>
              <span className="material-symbols-outlined text-outline">chevron_right</span>
            </div>
          ))}
        </div>
      )}

      {/* Persistent FAB */}
      <button 
        onClick={() => navigate('/client/add')}
        className="fixed bottom-28 right-6 w-16 h-16 bg-primary text-on-primary rounded-[1.3rem] shadow-[0_8px_32px_rgba(0,19,89,0.3)] flex items-center justify-center active:scale-90 transition-transform md:right-[calc(50%-13rem+1.5rem)] z-50">
        <span className="material-symbols-outlined font-black text-3xl">add</span>
      </button>
    </div>
  );
}
