import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientById, getClientTimeline } from '../lib/api';
import TimelineItem from '../components/TimelineItem';

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const [assigningPlan, setAssigningPlan] = useState(false);
  const [ptPlans, setPtPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const fetchPlans = async () => {
     const { supabase } = await import('../lib/supabase');
     const { data } = await supabase.from('workout_plans').select('*').order('created_at', { ascending: false });
     setPtPlans(data || []);
  };

  const handleAssignPlan = async () => {
    if (!selectedPlanId) return;
    const planIdToSave = selectedPlanId === 'none' ? null : selectedPlanId;
    const { supabase } = await import('../lib/supabase');
    await supabase.from('clients').update({ active_plan_id: planIdToSave }).eq('id', id);
    
    // Refresh client
    const updatedClient = await getClientById(id);
    setClient(updatedClient);
    setAssigningPlan(false);
    setSelectedPlanId('');
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
        const t = await getClientTimeline(id);
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

      {assigningPlan ? (
        <div className="bg-surface-container rounded-[2rem] p-5 mb-6 border border-primary/20 shadow-sm animate-pulse-slight">
           <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-3">Atribuir Novo Plano</p>
           <div className="flex gap-2">
             <select className="flex-1 bg-surface py-3 px-3 rounded-xl text-xs font-bold border border-outline-variant/30 text-primary uppercase" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
               <option value="" disabled>Selecionar da Biblioteca...</option>
               <option value="none">Nenhum (Remover Atual)</option>
               {ptPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
             <button onClick={handleAssignPlan} disabled={!selectedPlanId} className="bg-primary text-on-primary px-4 py-3 rounded-xl font-bold text-xs uppercase disabled:opacity-50">Gravar</button>
           </div>
        </div>
      ) : (
        <div className="bg-surface rounded-[2rem] p-5 mb-6 border-2 border-dashed border-outline-variant/30 hover:border-primary/20 transition-colors flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-1">Plano Atual</p>
             <p className="font-bold text-primary text-lg leading-none">
               {client.workout_plans ? client.workout_plans.name : 'Sem Plano Atribuído'}
             </p>
           </div>
           <button onClick={() => { setAssigningPlan(true); fetchPlans(); }} className="text-[#00677f] font-bold text-xs bg-[#00677f]/10 px-4 py-2 rounded-xl uppercase hover:bg-[#00677f]/20 transition-colors">
             Alterar
           </button>
        </div>
      )}

      {/* Quick Actions (max 3 taps rules!) */}
      <div className="flex gap-3">
        <button onClick={() => navigate(`/client/${id}/workout`)} className="flex-1 py-4 bg-primary text-on-primary rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-transform flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl">fitness_center</span>
          Treino
        </button>
        <button onClick={() => navigate(`/client/${id}/progress`)} className="flex-1 py-4 bg-secondary-container text-on-secondary-container rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-secondary-container/20 active:scale-95 transition-transform flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl">scale</span>
          Peso
        </button>
        <button onClick={() => navigate(`/client/${id}/photo`)} className="flex-1 py-4 bg-surface-container-high text-primary border border-outline-variant/10 rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-transform flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl">add_a_photo</span>
          Foto
        </button>
      </div>

      {/* Timeline Section */}
      <section className="relative pt-6">
        <div className="flex items-center gap-2 mb-8">
          <span className="inline-block w-3 h-3 bg-secondary-container rounded-full animate-pulse"></span>
          <h3 className="text-primary font-bold uppercase text-xs tracking-widest">Timeline de Evolução</h3>
        </div>
        
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
    </div>
  );
}
