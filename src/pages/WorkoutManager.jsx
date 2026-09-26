import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export default function WorkoutManager() {
  const { session } = useAppStore();
  const [activeTab, setActiveTab] = useState('plans');
  const [exercises, setExercises] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // States Novo Exercicio
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState('Perna');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [addingEx, setAddingEx] = useState(false);

  // States Builder de Planos
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [newPlanData, setNewPlanData] = useState({ name: '', description: '' });
  const [planExercises, setPlanExercises] = useState([]);

  // States para aditar Exercicio a um plano
  const [showAddExToPlan, setShowAddExToPlan] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedExId, setSelectedExId] = useState('');
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState('10 to 12');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const resEx = await supabase.from('exercises').select('*').order('name');
      const resPlans = await supabase.from('workout_plans').select('*').eq('pt_id', session.user.id).order('created_at', { ascending: false });
      
      setExercises(resEx.data || []);
      setPlans(resPlans.data || []);
      setLoading(false);
    };
    if (session) fetchData();
  }, [session]);

  useEffect(() => {
    if (editingPlan) {
      supabase.from('workout_plan_exercises')
        .select(`*, exercises(name, category)`)
        .eq('plan_id', editingPlan.id)
        .order('sort_order')
        .then(({data}) => setPlanExercises(data || []));
    }
  }, [editingPlan]);

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    if (!newExName) return;
    setAddingEx(true);
    const { data, error } = await supabase.from('exercises').insert([
      { name: newExName, category: newExCategory, equipment: 'Máquina', created_by: session.user.id }
    ]).select().single();
    
    if (data && !error) {
      setExercises(prev => [...prev, data]);
      setNewExName('');
      setIsCustomCategory(false);
    }
    setAddingEx(false);
  };

  const handleCategoryChange = (e) => {
    if (e.target.value === 'NOVA') {
      setIsCustomCategory(true);
      setNewExCategory('');
    } else {
      setNewExCategory(e.target.value);
    }
  };

  const handleCreatePlanForm = async (e) => {
    e.preventDefault();
    if (!newPlanData.name) return;
    const { data } = await supabase.from('workout_plans').insert([{
      name: newPlanData.name, description: newPlanData.description, pt_id: session.user.id
    }]).select().single();
    if (data) {
      setPlans(prev => [data, ...prev]);
      setShowPlanForm(false);
      setNewPlanData({name: '', description: ''});
      setEditingPlan(data); // Entra diretamente no modo de edição
    }
  };

  const handleAddExToPlan = async (e) => {
    e.preventDefault();
    if (!selectedExId) return;
    const { data } = await supabase.from('workout_plan_exercises').insert([{
      plan_id: editingPlan.id, exercise_id: selectedExId, sets: exSets, reps: exReps, sort_order: planExercises.length
    }]).select('*, exercises(name, category)').single();
    
    if (data) {
      setPlanExercises(prev => [...prev, data]);
      setShowAddExToPlan(false);
      setSelectedExId('');
      setExSets(3);
      setExReps('10 to 12');
    }
  };

  // VISTA SECUNDARIA: EXPLORADOR DE PLANO
  if (editingPlan) {
    return (
      <div className="space-y-6 pb-32">
        <div className="flex items-center gap-4">
          <button onClick={() => { setEditingPlan(null); setShowAddExToPlan(false); }} className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform shadow-sm">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-black text-primary font-headline tracking-tighter truncate max-w-[200px]">{editingPlan.name}</h2>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mt-1">Construtor de Plano</p>
          </div>
        </div>

        <div className="space-y-3">
          {planExercises.length === 0 ? (
            <div className="bg-surface-container p-6 rounded-[2rem] text-center border-dashed border-2 border-outline-variant/30 text-on-surface-variant">
              Ainda não tens blocos de treino neste plano. Adiciona o teu primeiro exercício!
            </div>
          ) : (
            planExercises.map((pex, index) => (
              <div key={pex.id} className="bg-surface p-4 rounded-[1.2rem] shadow-sm border border-outline-variant/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[#00677f] uppercase block mb-1">Passo {index + 1} - {pex.exercises?.category}</span>
                  <p className="font-bold text-on-surface text-lg leading-tight">{pex.exercises?.name}</p>
                </div>
                <div className="text-right ml-4 min-w-[70px]">
                  <p className="font-black text-primary text-xl bg-surface-container px-3 auto py-1 rounded-lg inline-block">{pex.sets}x</p>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant mt-1 tracking-widest">{pex.reps} reps</p>
                </div>
              </div>
            ))
          )}
        </div>

        {showAddExToPlan ? (
          <form onSubmit={handleAddExToPlan} className="bg-primary/5 p-5 rounded-3xl border border-primary/20 space-y-4">
            <h4 className="font-black text-primary uppercase tracking-widest text-xs">Novo Bloco de Treino</h4>
            
            <div className="flex gap-2 items-center">
              <span className="material-symbols-outlined text-primary/70">filter_alt</span>
              <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setSelectedExId(''); }} className="bg-surface py-3 px-3 rounded-xl text-xs font-bold text-primary focus:outline-none border border-primary/30 w-full uppercase tracking-wider">
                <option value="">Todos os Grupos</option>
                {Array.from(new Set(exercises.map(ex => ex.category))).sort().map(cat => (
                   <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <select required value={selectedExId} onChange={e => setSelectedExId(e.target.value)} className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 font-medium text-on-surface">
              <option value="" disabled>Escolher Exercício do Catálogo</option>
              {exercises.filter(ex => filterCategory === '' || ex.category === filterCategory).map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            
            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="text-[10px] font-bold text-primary uppercase block pl-2 mb-1">Séries</label>
                <input type="number" value={exSets} onChange={e => setExSets(parseInt(e.target.value))} className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 font-bold text-center text-on-surface" />
              </div>
              <div className="w-2/3">
                <label className="text-[10px] font-bold text-primary uppercase block pl-2 mb-1">Repetições Alvo</label>
                <input type="text" value={exReps} onChange={e => setExReps(e.target.value)} placeholder="Ex: Até Falha" className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 font-bold text-on-surface" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAddExToPlan(false)} className="w-1/3 text-on-surface-variant font-bold text-sm">Cancelar</button>
              <button type="submit" disabled={!selectedExId} className="w-2/3 bg-primary text-on-primary rounded-xl uppercase font-bold text-sm py-3 hover:opacity-90 disabled:opacity-50 shadow-md">Adicionar Bloco</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAddExToPlan(true)} className="w-full py-5 border-dashed border-2 bg-surface-container border-primary/40 text-primary rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors shadow-sm">
            <span className="material-symbols-outlined">add_circle</span> Adicionar Exercício
          </button>
        )}
      </div>
    );
  }

  // VISTA PRINCIPAL
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-primary font-headline tracking-tighter">Biblioteca PeakON</h2>
        <p className="text-on-surface-variant font-medium mt-1">Central de Planos & Exercícios.</p>
      </div>

      <div className="flex bg-surface-container rounded-full p-1 w-full relative z-10 shadow-sm">
        <button onClick={() => setActiveTab('plans')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-full transition-colors ${activeTab === 'plans' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}>
          Os Meus Planos
        </button>
        <button onClick={() => setActiveTab('exercises')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-full transition-colors ${activeTab === 'exercises' ? 'bg-[#00677f] text-on-secondary shadow-md' : 'text-on-surface-variant'}`}>
          Catálogo
        </button>
      </div>

      <div className="pb-32">
        {loading ? (
          <p className="text-center mt-10 font-bold text-outline">A carregar...</p>
        ) : activeTab === 'plans' ? (
          <div className="space-y-4">
            
            {showPlanForm ? (
              <form onSubmit={handleCreatePlanForm} className="bg-primary/5 p-5 rounded-[1.5rem] border border-primary/20 space-y-4 shadow-inner">
                <h4 className="font-black text-primary uppercase tracking-widest text-xs mb-2">Novo Esqueleto de Plano</h4>
                <input required type="text" value={newPlanData.name} onChange={e => setNewPlanData({...newPlanData, name: e.target.value})} placeholder="Nome (Ex: Força A)" className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 font-medium text-on-surface" />
                <input type="text" value={newPlanData.description} onChange={e => setNewPlanData({...newPlanData, description: e.target.value})} placeholder="Descrição / Notas (Opcional)" className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 font-medium text-on-surface" />
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowPlanForm(false)} className="w-1/3 text-on-surface-variant font-bold text-sm">Cancelar</button>
                  <button type="submit" className="w-2/3 bg-primary text-on-primary rounded-xl uppercase font-bold text-sm py-3 shadow-md">Criar</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowPlanForm(true)} className="w-full py-5 border-dashed border-2 bg-surface border-[#00677f]/30 text-[#00677f] rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-[#00677f]/5 transition-colors">
                <span className="material-symbols-outlined">add</span> Novo Plano (Draft)
              </button>
            )}

            {plans.map(plan => (
              <div key={plan.id} onClick={() => setEditingPlan(plan)} className="bg-surface border border-outline-variant/20 p-5 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex justify-between items-center group">
                <div>
                  <h4 className="font-headline font-bold text-lg text-primary">{plan.name}</h4>
                  <p className="text-sm font-medium text-on-surface-variant">{plan.description || "Sem descrição."}</p>
                </div>
                <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
              </div>
            ))}
            {plans.length === 0 && !showPlanForm && (
              <p className="text-center text-sm font-bold text-outline-variant mt-10">Ainda não tens Templates criados.</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleCreateExercise} className="bg-secondary-container/20 p-5 rounded-2xl border border-[#00677f]/20">
              <h4 className="font-bold text-[#00677f] uppercase tracking-widest text-xs mb-3">Adicionar Novo Exercício</h4>
              <div className="space-y-3">
                <input type="text" value={newExName} onChange={e => setNewExName(e.target.value)} placeholder="Nome do Exercício" className="w-full bg-surface border border-[#00677f]/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-[#00677f]/20 font-medium" />
                <div className="flex gap-2">
                  {isCustomCategory ? (
                    <div className="w-1/2 relative flex items-center">
                      <input 
                        type="text"
                        autoFocus
                        value={newExCategory} 
                        onChange={e => setNewExCategory(e.target.value)} 
                        placeholder="Nova Categ..."
                        className="w-full bg-surface border border-[#00677f]/30 rounded-xl pl-3 pr-8 py-3 font-bold text-[#00677f] focus:outline-none focus:ring-2 focus:ring-[#00677f]/20 uppercase tracking-widest text-[10px]"
                      />
                      <button type="button" onClick={() => { setIsCustomCategory(false); setNewExCategory('Peito'); }} className="absolute right-2 text-outline hover:text-error transition-colors flex items-center">
                        <span className="material-symbols-outlined text-[16px] font-black">close</span>
                      </button>
                    </div>
                  ) : (
                    <select value={newExCategory} onChange={handleCategoryChange} className="w-1/2 bg-surface border border-[#00677f]/30 rounded-xl px-2 py-3 font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-[#00677f]/20 uppercase tracking-widest text-[10px]">
                      {Array.from(new Set(exercises.map(ex => ex.category))).sort().map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="NOVA" className="font-black text-secondary">+ NOVA</option>
                    </select>
                  )}
                  <button type="submit" disabled={addingEx || !newExName || !newExCategory} className="w-1/2 bg-[#00677f] text-on-secondary rounded-xl uppercase font-bold text-sm hover:opacity-90 disabled:opacity-50">Adicionar</button>
                </div>
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-widest text-primary ml-2 mb-2">Exercícios Disponíveis</h3>
              {exercises.map(ex => (
                <div key={ex.id} className="bg-surface p-4 rounded-[1.2rem] flex justify-between items-center shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-bold text-on-surface">{ex.name}</p>
                    <p className="text-xs uppercase font-black text-[#00677f] tracking-wider mt-1">{ex.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
