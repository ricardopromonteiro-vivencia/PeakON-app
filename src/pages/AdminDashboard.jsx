import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

// ─── Gerar código PT aleatório ────────────────────────────────
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'PT-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Modal: gerar código de acesso para PT ────────────────────
function GenerateCodeModal({ adminId, onClose, onCreated }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError]     = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    const code = genCode();
    try {
      const { error: err } = await supabase.from('pt_access_codes').insert([{
        code,
        email: email.trim().toLowerCase() || null,
        created_by: adminId,
      }]);
      if (err) throw err;
      setCreated({ code, email: email.trim() });
      onCreated?.();
    } catch (e) {
      setError('Erro ao gerar código: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(created.code);
    alert(`Código ${created.code} copiado!`);
  };

  const handleWhatsApp = () => {
    const msg = `Olá! O teu código de acesso para o PeakON é: *${created.code}*\n\nRegista-te em: ${window.location.origin}/login`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-primary font-headline tracking-tighter">
            {created ? 'Código Gerado!' : 'Novo Código PT'}
          </h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {!created ? (
          <div className="space-y-4">
            <p className="text-on-surface-variant text-sm">Gera um código de acesso para um novo Personal Trainer se registar na app.</p>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">
                Email do PT (opcional)
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="pt@email.com (opcional)"
                className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-5 py-4 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
              <p className="text-[10px] text-on-surface-variant/50 ml-2 mt-1">Serve apenas como referência. Não restringe o uso do código.</p>
            </div>
            {error && <p className="text-error text-sm font-bold">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-surface-container text-on-surface-variant border border-outline-variant/20">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={loading}
                className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-on-primary shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60">
                {loading ? 'A gerar...' : 'Gerar Código'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-surface-container-high rounded-[1.5rem] p-5 text-center border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 pointer-events-none">
                <span className="material-symbols-outlined text-primary/10 text-5xl -rotate-12">key</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Código de Acesso PT</p>
              <p className="text-4xl font-black text-primary tracking-[0.15em] font-headline">{created.code}</p>
              {created.email && <p className="text-on-surface-variant text-xs mt-2">Para: {created.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCopy}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm bg-surface-container text-primary border border-outline-variant/20 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-lg">content_copy</span> Copiar
              </button>
              <button onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all shadow-lg shadow-[#25d366]/20">
                <span className="material-symbols-outlined text-lg">share</span> WhatsApp
              </button>
            </div>
            <button onClick={onClose}
              className="w-full py-3 bg-primary text-on-primary rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card de PT com suspensão ─────────────────────────────────
function PTCard({ pt: ptInit, onRefresh }) {
  const navigate = useNavigate();
  const [pt, setPT]               = useState(ptInit);
  const [expanded, setExpanded]   = useState(false);
  const [clients, setClients]     = useState([]);
  const [loadingC, setLoadingC]   = useState(false);
  const [suspending, setSuspending] = useState(false);

  const loadClients = async () => {
    if (clients.length > 0) { setExpanded(true); return; }
    setLoadingC(true);
    const { data } = await supabase
      .from('clients')
      .select('id, name, goal, status, invite_code, is_registered, created_at')
      .eq('user_id', pt.id)
      .order('created_at', { ascending: false });
    setClients(data || []);
    setLoadingC(false);
    setExpanded(true);
  };

  const toggle = () => { if (expanded) { setExpanded(false); return; } loadClients(); };

  const isSuspended = pt.status === 'suspended';

  const handleToggleSuspend = async (e) => {
    e.stopPropagation();
    const newStatus = isSuspended ? 'active' : 'suspended';
    const action = isSuspended ? 'reativar' : 'suspender';
    const msg = isSuspended
      ? `Tens a certeza que queres reativar a conta de ${pt.name || pt.email}?`
      : `Tens a certeza que queres suspender ${pt.name || pt.email}?\n\nIsso também suspenderá todos os alunos associados.`;

    if (!window.confirm(msg)) return;
    setSuspending(true);

    try {
      // 1. Atualiza status do PT
      await supabase.from('users').update({ status: newStatus }).eq('id', pt.id);

      // 2. Atualiza status de todos os alunos (tabela clients — usa 'paused'/'active')
      const clientStatus = newStatus === 'suspended' ? 'paused' : 'active';
      await supabase.from('clients').update({ status: clientStatus }).eq('user_id', pt.id);

      // 3. Atualiza também os users dos alunos (via linked_client_id)
      const clientIds = (clients.length > 0 ? clients : (await supabase.from('clients').select('id').eq('user_id', pt.id)).data || []).map(c => c.id);
      if (clientIds.length > 0) {
        // Busca os users que têm linked_client_id nessa lista
        const { data: clientUsers } = await supabase
          .from('users')
          .select('id')
          .in('linked_client_id', clientIds);
        if (clientUsers?.length > 0) {
          await supabase.from('users').update({ status: newStatus }).in('id', clientUsers.map(u => u.id));
        }
      }

      setPT(prev => ({ ...prev, status: newStatus }));
      onRefresh?.();
    } catch (e) {
      alert('Erro: ' + e.message);
    } finally {
      setSuspending(false);
    }
  };

  return (
    <div className={`bg-surface-container-low rounded-[2rem] border shadow-sm overflow-hidden ${isSuspended ? 'border-error/30 opacity-70' : 'border-outline-variant/10'}`}>
      {/* Cabeçalho do PT */}
      <div className="p-4 flex items-center gap-3">
        {/* Avatar clicável → ver dashboard PT */}
        <button onClick={() => navigate(`/admin/pt/${pt.id}`)}
          className="w-12 h-12 rounded-full overflow-hidden bg-primary flex-shrink-0 flex items-center justify-center shadow active:scale-90 transition-transform">
          {pt.avatar_url
            ? <img src={pt.avatar_url} alt={pt.name} className="w-full h-full object-cover" />
            : <span className="text-on-primary font-black text-xl">{(pt.name || pt.email).charAt(0).toUpperCase()}</span>
          }
        </button>

        {/* Info — clicável */}
        <button onClick={() => navigate(`/admin/pt/${pt.id}`)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <p className="font-black text-primary text-base leading-tight truncate">{pt.name || '—'}</p>
            {isSuspended && (
              <span className="inline-block bg-error/10 text-error text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                Suspenso
              </span>
            )}
          </div>
          <p className="text-on-surface-variant text-xs mt-0.5 truncate">{pt.email}</p>
          <p className="text-on-surface-variant/50 text-[10px] mt-0.5 uppercase tracking-wide">
            Desde {new Date(pt.created_at).toLocaleDateString('pt-PT')}
          </p>
        </button>

        {/* Ações: badge alunos + suspender + expand */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <span className="inline-block bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full">
            {pt.client_count} aluno{pt.client_count !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1">
            {/* Botão suspender / reativar */}
            <button
              onClick={handleToggleSuspend}
              disabled={suspending}
              title={isSuspended ? 'Reativar conta' : 'Suspender conta'}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 ${
                isSuspended
                  ? 'bg-[#1a7f64]/10 text-[#1a7f64] hover:bg-[#1a7f64]/20'
                  : 'bg-error/10 text-error hover:bg-error/20'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {suspending ? 'sync' : isSuspended ? 'play_circle' : 'block'}
              </span>
            </button>
            {/* Expand alunos */}
            <button onClick={e => { e.stopPropagation(); toggle(); }}
              className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors">
              <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de alunos expandida */}
      {expanded && (
        <div className="border-t border-outline-variant/10 px-4 pb-4 pt-3 space-y-2">
          {loadingC ? (
            <div className="flex justify-center py-4">
              <span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span>
            </div>
          ) : clients.length === 0 ? (
            <p className="text-center text-on-surface-variant text-sm py-4">Sem alunos ainda.</p>
          ) : (
            clients.map(client => (
              <div key={client.id}
                onClick={() => navigate(`/admin/pt/${pt.id}/client/${client.id}`)}
                className="bg-surface rounded-2xl px-4 py-3 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.98] transition-all hover:bg-surface-container">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="text-on-secondary-container font-black text-sm">{client.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-primary text-sm truncate">{client.name}</p>
                    {client.goal && <p className="text-on-surface-variant text-[10px] truncate">{client.goal}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                    client.status === 'paused' ? 'bg-error/10 text-error' :
                    client.is_registered ? 'bg-[#1a7f64]/10 text-[#1a7f64]' : 'bg-[#f5a623]/10 text-[#b87516]'
                  }`}>
                    {client.status === 'paused' ? 'Suspenso' : client.is_registered ? 'Ativo' : 'Pendente'}
                  </span>
                  {client.invite_code && (
                    <button title={`Código: ${client.invite_code}`}
                      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(client.invite_code); alert(`Código ${client.invite_code} copiado!`); }}
                      className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-sm">key</span>
                    </button>
                  )}
                  <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Painel de códigos de acesso PT ──────────────────────────
function AccessCodesPanel({ adminId }) {
  const [codes, setCodes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadCodes = useCallback(async () => {
    const { data } = await supabase
      .from('pt_access_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setCodes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadCodes(); }, [loadCodes]);

  return (
    <>
      {showModal && (
        <GenerateCodeModal
          adminId={adminId}
          onClose={() => setShowModal(false)}
          onCreated={loadCodes}
        />
      )}

      <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-outline-variant/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">vpn_key</span>
            <h3 className="font-black text-primary text-sm uppercase tracking-widest">Códigos de Acesso PT</h3>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-sm">add</span>
            Gerar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span>
          </div>
        ) : codes.length === 0 ? (
          <p className="text-center text-on-surface-variant text-sm py-6">Nenhum código gerado ainda.</p>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {codes.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className={`font-black text-sm tracking-widest font-headline ${c.used_at ? 'text-on-surface-variant line-through' : 'text-primary'}`}>
                    {c.code}
                  </p>
                  {c.email && <p className="text-on-surface-variant/60 text-xs truncate">{c.email}</p>}
                  <p className="text-on-surface-variant/40 text-[10px]">
                    {new Date(c.created_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {c.used_at ? (
                    <span className="text-[10px] font-black px-2 py-1 rounded-full uppercase bg-outline-variant/20 text-on-surface-variant">
                      Usado
                    </span>
                  ) : (
                    <button onClick={() => { navigator.clipboard.writeText(c.code); alert(`Código ${c.code} copiado!`); }}
                      className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Dashboard do Admin ───────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAppStore();
  const [pts, setPts]         = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  const loadPTs = useCallback(async () => {
    const { data: ptList } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, created_at, role, status')
      .eq('role', 'pt')
      .order('created_at', { ascending: false });

    if (!ptList) { setLoading(false); return; }

    const ptsWithCount = await Promise.all(
      ptList.map(async (pt) => {
        const { count } = await supabase
          .from('clients').select('*', { count: 'exact', head: true }).eq('user_id', pt.id);
        return { ...pt, client_count: count || 0 };
      })
    );

    const [{ count: totalClients }, { count: totalWorkouts }, { count: registeredClients }] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('workouts').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_registered', true),
    ]);

    setPts(ptsWithCount);
    setStats({
      totalPTs:          ptsWithCount.length,
      totalClients:      totalClients      || 0,
      registeredClients: registeredClients || 0,
      totalWorkouts:     totalWorkouts     || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadPTs(); }, [loadPTs]);

  const filteredPts = pts.filter(pt =>
    (pt.name || pt.email).toLowerCase().includes(search.toLowerCase()) ||
    pt.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      <section>
        <p className="text-on-surface-variant font-label text-sm font-black uppercase tracking-widest mb-1 opacity-70">Administração</p>
        <h2 className="text-primary font-headline font-black text-4xl tracking-tighter">Portal Admin</h2>
      </section>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
        </div>
      ) : (
        <>
          {/* Stats globais */}
          {stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary rounded-[1.5rem] p-4 text-center">
                <p className="text-on-primary font-black text-4xl">{stats.totalPTs}</p>
                <p className="text-on-primary/70 text-[10px] font-black uppercase tracking-widest mt-1">Personal Trainers</p>
              </div>
              <div className="bg-secondary-container rounded-[1.5rem] p-4 text-center">
                <p className="text-on-secondary-container font-black text-4xl">{stats.totalClients}</p>
                <p className="text-on-secondary-container/70 text-[10px] font-black uppercase tracking-widest mt-1">Total Alunos</p>
              </div>
              <div className="bg-[#1a7f64]/10 rounded-[1.5rem] p-4 text-center">
                <p className="text-[#1a7f64] font-black text-4xl">{stats.registeredClients}</p>
                <p className="text-[#1a7f64]/70 text-[10px] font-black uppercase tracking-widest mt-1">Alunos Registados</p>
              </div>
              <div className="bg-surface-container rounded-[1.5rem] p-4 text-center">
                <p className="text-primary font-black text-4xl">{stats.totalWorkouts}</p>
                <p className="text-primary/70 text-[10px] font-black uppercase tracking-widest mt-1">Treinos Registados</p>
              </div>
            </div>
          )}

          {/* Painel de códigos de acesso PT */}
          <AccessCodesPanel adminId={user?.id} />

          {/* Pesquisa */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar PT por nome ou email..."
              className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl pl-12 pr-5 py-4 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {/* Lista de PTs */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-3">
              Personal Trainers ({filteredPts.length})
            </p>
            <div className="space-y-3">
              {filteredPts.length === 0 ? (
                <div className="bg-surface-container-low p-6 rounded-[2rem] text-center border border-dashed border-outline-variant/30">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2 block">person_search</span>
                  <p className="text-primary font-bold">Nenhum PT encontrado</p>
                </div>
              ) : filteredPts.map(pt => (
                <PTCard key={pt.id} pt={pt} onRefresh={loadPTs} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
