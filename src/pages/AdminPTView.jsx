import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminPTView() {
  const { ptId } = useParams();
  const navigate  = useNavigate();
  const [pt, setPT]           = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    async function load() {
      const [{ data: ptData }, { data: clientData }] = await Promise.all([
        supabase.from('users').select('*').eq('id', ptId).single(),
        supabase.from('clients').select('*, workout_plans(name)').eq('user_id', ptId).order('created_at', { ascending: false }),
      ]);
      setPT(ptData);
      setClients(clientData || []);
      setLoading(false);
    }
    load();
  }, [ptId]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = clients.filter(c => c.status === 'active').length;

  if (loading) return <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold">
        <button onClick={() => navigate('/admin')} className="hover:text-primary transition-colors">Admin</button>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary">{pt?.name || pt?.email}</span>
      </div>

      {/* Header PT */}
      <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-6">
        <button onClick={() => navigate('/admin')} className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform flex-shrink-0">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="w-14 h-14 rounded-full overflow-hidden bg-primary flex-shrink-0 flex items-center justify-center shadow">
          {pt?.avatar_url ? (
            <img src={pt.avatar_url} alt={pt.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-on-primary font-black text-2xl">
              {(pt?.name || pt?.email || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-primary font-headline tracking-tighter truncate">
              {pt?.name || '—'}
            </h2>
            <span className="inline-block bg-error/10 text-error text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
              Admin View
            </span>
          </div>
          <p className="text-on-surface-variant text-xs mt-0.5 truncate">{pt?.email}</p>
          <p className="text-on-surface-variant/50 text-[10px] mt-0.5 uppercase tracking-wide">
            Desde {pt && new Date(pt.created_at).toLocaleDateString('pt-PT')}
          </p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/10 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-primary">{clients.length}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mt-1">Total Alunos</p>
        </div>
        <div className="bg-secondary-container rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-on-secondary-container">{activeCount}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-on-secondary-container/70 mt-1">Alunos Ativos</p>
        </div>
      </div>

      {/* Pesquisa */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar aluno..."
          className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl pl-12 pr-5 py-4 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Lista de alunos */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-3">
          Alunos ({filtered.length})
        </p>
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-surface-container-low p-6 rounded-[2rem] text-center border border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl text-outline mb-2 block">person_search</span>
              <p className="text-primary font-bold">Nenhum aluno encontrado</p>
            </div>
          ) : filtered.map(client => (
            <button
              key={client.id}
              onClick={() => navigate(`/admin/pt/${ptId}/client/${client.id}`)}
              className="w-full bg-surface-container-low p-5 rounded-[1.5rem] flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer shadow-sm border border-outline-variant/10 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#dde1ff] rounded-full flex items-center justify-center text-[#001359] font-black text-xl uppercase shadow-inner flex-shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-headline font-bold text-lg text-primary leading-tight">{client.name}</h4>
                  {client.goal && (
                    <span className="inline-block mt-1 bg-[#b7eaff] text-[#005266] text-[10px] font-black px-2 py-[2px] rounded-full uppercase tracking-wider">
                      {client.goal}
                    </span>
                  )}
                  {client.workout_plans && (
                    <p className="text-on-surface-variant text-xs mt-1">
                      Plano: {client.workout_plans.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                  client.is_registered ? 'bg-[#1a7f64]/10 text-[#1a7f64]' : 'bg-[#f5a623]/10 text-[#b87516]'
                }`}>
                  {client.is_registered ? 'Ativo' : 'Pendente'}
                </span>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
