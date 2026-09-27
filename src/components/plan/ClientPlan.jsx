import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * ClientPlan — mostra os planos de treino do aluno.
 *
 * Props:
 *   clientId    — UUID do registo em clients
 *   planEntries — array de { id, plan_id, label, sort_order, workout_plans:{name,description} }
 *                 vem de client_plans com join a workout_plans
 *   readOnly    — true quando é o PT ou admin a ver
 */

// ─── Plano individual ─────────────────────────────────────────
function PlanView({ clientId, planEntry, readOnly }) {
  const planId  = planEntry.plan_id;
  const [exercises, setExercises] = useState([]);
  const [weights, setWeights]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [editing, setEditing]     = useState(null);
  const [editVal, setEditVal]     = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ data: exData }, { data: weightData }] = await Promise.all([
        supabase
          .from('workout_plan_exercises')
          .select('*, exercises(name, category)')
          .eq('plan_id', planId)
          .order('sort_order'),
        supabase
          .from('client_exercise_weights')
          .select('*')
          .eq('client_id', clientId),
      ]);
      setExercises(exData || []);
      const wMap = {};
      (weightData || []).forEach(w => { wMap[w.plan_exercise_id] = w; });
      setWeights(wMap);
    } catch (e) {
      setError('Erro ao carregar exercícios: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [planId, clientId]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (pex) => {
    const existing = weights[pex.id];
    setEditing(pex.id);
    setEditVal(existing ? String(existing.achieved_weight) : '');
    setEditNotes(existing?.notes || '');
  };

  const cancelEdit = () => { setEditing(null); setEditVal(''); setEditNotes(''); };

  const handleSave = async (pexId) => {
    if (editVal === '' || isNaN(parseFloat(editVal))) {
      setError('Insere um valor de peso válido.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('client_exercise_weights')
        .upsert({
          plan_exercise_id: pexId,
          client_id: clientId,
          achieved_weight: parseFloat(editVal),
          notes: editNotes.trim() || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'plan_exercise_id,client_id' })
        .select()
        .single();
      if (err) throw err;
      setWeights(prev => ({ ...prev, [pexId]: data }));
      setEditing(null);
    } catch (e) {
      setError('Erro ao guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-8">
      <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
    </div>
  );

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20">{error}</div>
      )}

      {!readOnly && (
        <div className="bg-[#1a7f64]/10 border border-[#1a7f64]/20 rounded-2xl px-4 py-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-[#1a7f64] text-lg flex-shrink-0 mt-0.5">info</span>
          <p className="text-[#1a7f64] text-xs font-bold">
            Toca no ✏️ de cada exercício para registar a tua carga atingida.
          </p>
        </div>
      )}

      {exercises.length === 0 && (
        <div className="bg-surface-container-low p-6 rounded-[2rem] text-center border border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block">fitness_center</span>
          <p className="text-primary font-bold">Sem exercícios neste plano</p>
        </div>
      )}

      {exercises.map((pex, index) => {
        const achieved  = weights[pex.id];
        const isEditing = editing === pex.id;

        return (
          <div key={pex.id} className="bg-surface-container-low rounded-[1.5rem] border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-[#00677f] uppercase tracking-widest">
                  {index + 1} · {pex.exercises?.category}
                </span>
                <p className="font-bold text-primary text-base leading-tight mt-0.5">{pex.exercises?.name}</p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-1 rounded-xl">{pex.sets} séries</span>
                  <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-1 rounded-xl">{pex.reps} reps</span>
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {pex.reference_weight != null && (
                    <div className="flex items-center gap-1 bg-surface-container rounded-xl px-2.5 py-1">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">flag</span>
                      <span className="text-on-surface-variant text-xs font-bold">Ref: {pex.reference_weight} kg</span>
                    </div>
                  )}
                  {achieved ? (
                    <div className="flex items-center gap-1 bg-[#1a7f64]/10 rounded-xl px-2.5 py-1">
                      <span className="material-symbols-outlined text-sm text-[#1a7f64]">fitness_center</span>
                      <span className="text-[#1a7f64] text-xs font-black">Atingido: {achieved.achieved_weight} kg</span>
                    </div>
                  ) : !readOnly ? (
                    <span className="text-on-surface-variant/50 text-xs italic">Sem carga registada</span>
                  ) : null}
                </div>
                {achieved?.notes && (
                  <p className="text-on-surface-variant/70 text-xs mt-1 italic">"{achieved.notes}"</p>
                )}
              </div>

              {!readOnly && !isEditing && (
                <button onClick={() => startEdit(pex)}
                  className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-primary hover:bg-primary/10 transition-colors flex-shrink-0 active:scale-90">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
              )}
            </div>

            {isEditing && (
              <div className="border-t border-outline-variant/10 px-4 pb-4 pt-3 space-y-3 bg-surface-container/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Registar carga atingida</p>
                <div className="flex items-center gap-2 bg-surface border border-outline-variant/20 rounded-2xl px-4 py-3">
                  <span className="material-symbols-outlined text-primary/60 text-lg">fitness_center</span>
                  <input type="number" min="0" step="0.5" value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    placeholder="Ex: 45" autoFocus
                    className="flex-1 bg-transparent font-black text-primary text-xl focus:outline-none" />
                  <span className="text-on-surface-variant font-bold">kg</span>
                </div>
                <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  placeholder="Nota opcional"
                  className="w-full bg-surface border border-outline-variant/20 rounded-2xl px-4 py-2.5 text-sm font-medium text-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <div className="flex gap-2">
                  <button onClick={cancelEdit}
                    className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-surface-container text-on-surface-variant border border-outline-variant/20">
                    Cancelar
                  </button>
                  <button onClick={() => handleSave(pex.id)} disabled={saving || editVal === ''}
                    className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-on-primary shadow-md shadow-primary/20 active:scale-95 transition-all disabled:opacity-50">
                    {saving ? 'A guardar...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal: lista de planos com tabs ───────────
export default function ClientPlan({ clientId, planEntries = [], readOnly = false }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!planEntries || planEntries.length === 0) {
    return (
      <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-2 block">assignment_late</span>
        <p className="text-primary font-bold">Sem planos atribuídos</p>
        <p className="text-on-surface-variant text-sm mt-1">
          {readOnly ? 'Este aluno não tem planos atribuídos.' : 'O teu PT ainda não atribuiu nenhum plano de treino.'}
        </p>
      </div>
    );
  }

  const current = planEntries[activeIdx] || planEntries[0];

  return (
    <div className="space-y-4">
      {/* Cabeçalho do plano activo */}
      <div className="bg-primary rounded-[2rem] p-5">
        <p className="text-on-primary/70 text-[10px] font-black uppercase tracking-widest mb-1">Plano de Treino</p>
        <h3 className="text-on-primary font-black text-2xl font-headline tracking-tighter">
          {current.workout_plans?.name}
        </h3>
        {current.label && (
          <span className="inline-block mt-2 bg-on-primary/20 text-on-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            {current.label}
          </span>
        )}
        {current.workout_plans?.description && (
          <p className="text-on-primary/70 text-sm mt-2">{current.workout_plans.description}</p>
        )}
      </div>

      {/* Tabs — só aparece se houver mais de 1 plano */}
      {planEntries.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {planEntries.map((entry, idx) => (
            <button
              key={entry.id}
              onClick={() => setActiveIdx(idx)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                activeIdx === idx
                  ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {entry.label || entry.workout_plans?.name}
            </button>
          ))}
        </div>
      )}

      {/* Exercícios do plano activo */}
      <PlanView
        key={current.id}
        clientId={clientId}
        planEntry={current}
        readOnly={readOnly}
      />
    </div>
  );
}
