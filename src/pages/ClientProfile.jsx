import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientById, getClientTimeline } from '../lib/api';
import { supabase } from '../lib/supabase';
import TimelineItem from '../components/TimelineItem';
import PackManager from '../components/packs/PackManager';
import PackTransactions from '../components/packs/PackTransactions';
import ClientPlan from '../components/plan/ClientPlan';
import PlanManager from '../components/plan/PlanManager';

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient]   = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [planEntries, setPlanEntries] = useState([]); // planos atribuídos
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  const [isEditing, setIsEditing]   = useState(false);
  const [editName, setEditName]     = useState('');
  const [editGoal, setEditGoal]     = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const loadPlanEntries = async () => {
    const { data } = await supabase
      .from('client_plans')
      .select('*, workout_plans(id, name, description)')
      .eq('client_id', id)
      .order('sort_order');
    setPlanEntries(data || []);
  };

  const handleDeleteClient = async () => {
    if (!window.confirm(`Tens a certeza que queres eliminar ${client.name}? Esta ação é permanente e apagará todos os treinos e dados associados.`)) return;
    
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      navigate('/', { replace: true });
    } catch (e) {
      alert('Erro ao eliminar aluno: ' + e.message);
      setLoading(false);
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSaveLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.from('clients').update({ name: editName, goal: editGoal }).eq('id', id);
      if (error) throw error;
      setClient({ ...client, name: editName, goal: editGoal });
      setIsEditing(false);
    } catch (e) {
      alert('Erro ao atualizar: ' + e.message);
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const c = await getClientById(id);
        setClient(c);
        setEditName(c.name);
        setEditGoal(c.goal || '');
        const [t] = await Promise.all([
          getClientTimeline(id),
          loadPlanEntries(),
        ]);
        setTimeline(t);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;
  if (!client) return <div className="text-center py-20 text-error font-bold">Erro ao carregar aluno.</div>;

  return (
    <div className="space-y-8 pb-8 relative">
      {/* Edit Modal (Premium Design) */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
           <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsEditing(false)}></div>
           <div className="relative w-full max-w-sm bg-surface rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-primary font-headline tracking-tighter">Editar Aluno</h3>
                <button onClick={() => setIsEditing(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleUpdateClient} className="space-y-5">
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">Nome</label>
                   <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-5 py-4 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">Foco / Objetivo</label>
                   <input 
                    type="text" 
                    value={editGoal}
                    onChange={e => setEditGoal(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-5 py-4 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                   />
                 </div>

                 <div className="pt-4 flex flex-col gap-3">
                   <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                   >
                     {saveLoading ? 'A Guardar...' : 'Guardar Alterações'}
                   </button>
                   <button 
                    type="button"
                    onClick={handleDeleteClient}
                    className="w-full py-4 text-error font-black text-xs uppercase tracking-widest bg-error/5 rounded-2xl hover:bg-error/10 transition-all border border-error/10"
                   >
                     Eliminar Aluno
                   </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Header Profile */}
      <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-6">
        <button onClick={() => navigate('/')} className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform flex-shrink-0">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 overflow-hidden">
          <h2 className="text-3xl font-black text-primary font-headline tracking-tighter truncate">{client.name}</h2>
          {client.goal && <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase mt-1 opacity-80 truncate">{client.goal}</p>}
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="w-12 h-12 bg-surface-container-high rounded-[1.3rem] flex items-center justify-center text-primary active:scale-95 transition-all border border-outline-variant/10 shadow-sm"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      {/* Resumo de planos — clica para ir à tab Plano */}
      <button
        onClick={() => setActiveTab('plano')}
        className="w-full bg-surface rounded-[2rem] p-5 border-2 border-dashed border-outline-variant/30 hover:border-primary/20 transition-colors flex items-center justify-between"
      >
        <div>
          <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-1">Planos Atribuídos</p>
          <p className="font-bold text-primary text-lg leading-none">
            {planEntries.length === 0
              ? 'Nenhum plano atribuído'
              : planEntries.length === 1
                ? planEntries[0].workout_plans?.name
                : `${planEntries.length} planos`}
          </p>
          {planEntries.length > 1 && (
            <p className="text-on-surface-variant text-xs mt-1">
              {planEntries.map(p => p.label || p.workout_plans?.name).join(' · ')}
            </p>
          )}
        </div>
        <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
      </button>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate(`/client/${id}/workout`)} className="flex-1 py-4 bg-primary text-on-primary rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-transform flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl">fitness_center</span>
          Treino
        </button>
        <button onClick={() => navigate(`/client/${id}/progress`)} className="flex-1 py-4 bg-secondary-container text-on-secondary-container rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-secondary-container/20 active:scale-95 transition-transform flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl">straighten</span>
          Evolução
        </button>
        <button onClick={() => navigate(`/client/${id}/photo`)} className="flex-1 py-4 bg-surface-container-high text-primary border border-outline-variant/10 rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-transform flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl">add_a_photo</span>
          Foto
        </button>
      </div>

      {/* Tabs: Timeline / Pack / Histórico / Convite / Plano */}
      <div className="flex gap-2 bg-surface-container rounded-2xl p-1.5 overflow-x-auto">
        {[
          { key: 'timeline', label: 'Timeline',  icon: 'history' },
          { key: 'plano',    label: 'Plano',     icon: 'assignment' },
          { key: 'pack',     label: 'Pack',       icon: 'confirmation_number' },
          { key: 'history',  label: 'Histórico',  icon: 'receipt_long' },
          { key: 'invite',   label: 'Convite',    icon: 'key' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-[4.5rem] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.key
                ? 'bg-surface text-primary shadow-sm'
                : 'text-on-surface-variant opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da tab ativa */}
      {activeTab === 'timeline' && (
        <section className="relative pt-2">
          <div className="timeline-track opacity-20"></div>
          <div className="space-y-6">
            {timeline.length === 0 ? (
              <div className="pl-12">
                <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-center">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">history</span>
                  <p className="text-primary font-bold">Nenhum registo ainda</p>
                  <p className="text-on-surface-variant text-sm mt-1">Adiciona o primeiro treino ou peso para popular a timeline.</p>
                </div>
              </div>
            ) : (
              timeline.map((item) => (
                <TimelineItem key={`${item.type}-${item.id}`} item={item} />
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'plano' && (
        <>
          <PlanManager
            clientId={id}
            onChanged={() => {
              loadPlanEntries();
              getClientTimeline(id).then(setTimeline);
            }}
          />
          {planEntries.length > 0 && (
            <ClientPlan
              clientId={id}
              planEntries={planEntries}
              readOnly={true}
            />
          )}
        </>
      )}

      {activeTab === 'pack' && (
        <PackManager clientId={id} />
      )}

      {activeTab === 'history' && (
        <PackTransactions clientId={id} />
      )}

      {activeTab === 'invite' && (
        <InviteCard client={client} />
      )}
    </div>
  );
}

// ─── Card de convite (recuperar código a qualquer momento) ────
function InviteCard({ client }) {
  const [copied, setCopied] = useState(false);

  const shareUrl  = `${window.location.origin}/login`;
  const shareText = `Olá ${client.name}! 👋\nO teu Personal Trainer criou o teu perfil no PeakON. 🚀\n\nLink da App: ${shareUrl}\nO teu Código de Acesso: *${client.invite_code}*\n\nBora treinar! 🔥`;

  const handleCopy = () => {
    navigator.clipboard.writeText(client.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!client.invite_code) {
    return (
      <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-2 block">key_off</span>
        <p className="text-primary font-bold">Sem código de convite</p>
        <p className="text-on-surface-variant text-sm mt-1">Este aluno não tem código de convite associado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">key</span>
        <h3 className="text-primary font-bold uppercase text-xs tracking-widest">Código de Convite</h3>
      </div>

      {/* Código em destaque */}
      <div className="bg-surface-container-high rounded-[2rem] p-6 border border-primary/10 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 pointer-events-none">
          <span className="material-symbols-outlined text-primary/10 text-6xl -rotate-12">key</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Código de Acesso</p>
        <p className="text-5xl font-black text-primary tracking-[0.2em] font-headline">{client.invite_code}</p>
        <p className="text-on-surface-variant text-xs mt-3">
          O aluno usa este código ao criar a conta na app.
        </p>
        {client.is_registered && (
          <span className="inline-flex items-center gap-1 mt-3 bg-[#1a7f64]/10 text-[#1a7f64] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Aluno já registado
          </span>
        )}
        {!client.is_registered && (
          <span className="inline-flex items-center gap-1 mt-3 bg-[#f5a623]/10 text-[#b87516] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">pending</span>
            Aguarda registo
          </span>
        )}
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all border ${
            copied
              ? 'bg-[#1a7f64]/10 text-[#1a7f64] border-[#1a7f64]/20'
              : 'bg-surface-container text-primary border-outline-variant/20'
          }`}
        >
          <span className="material-symbols-outlined text-xl">
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copiado!' : 'Copiar Código'}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all shadow-lg shadow-[#25d366]/20"
        >
          <span className="material-symbols-outlined text-xl">share</span>
          WhatsApp
        </button>
      </div>

      <button
        onClick={handleCopyLink}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container border border-outline-variant/10 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-lg">link</span>
        Copiar mensagem completa
      </button>
    </div>
  );
}
