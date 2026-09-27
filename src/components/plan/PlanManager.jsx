import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';

/**
 * PlanManager — PT gere os planos atribuídos a um aluno.
 * Permite adicionar múltiplos planos com etiqueta e remover.
 */
export default function PlanManager({ clientId, onChanged }) {
  const { user } = useAppStore();
  const [clientPlans, setClientPlans] = useState([]); // planos já atribuídos
  const [allPlans, setAllPlans]       = useState([]); // biblioteca do PT
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [selectedId, setSelectedId]   = useState('');
  const [label, setLabel]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const load = useCallback(async () => {
    const [{ data: cp }, { data: ap }] = await Promise.all([
      supabase
        .from('client_plans')
        .select('*, workout_plans(id, name, description)')
        .eq('client_id', clientId)
        .order('sort_order'),
      supabase
        .from('workout_plans')
        .select('id, name, description')
        .order('name'),
    ]);
    setClientPlans(cp || []);
    setAllPlans(ap || []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  // Planos da biblioteca ainda não atribuídos
  const available = allPlans.filter(
    p => !clientPlans.some(cp => cp.plan_id === p.id)
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError('');
    const plan = allPlans.find(p => p.id === selectedId);
    try {
      // 1. Inserir na tabela de ligação
      const { error: err } = await supabase.from('client_plans').insert([{
        client_id:   clientId,
        plan_id:     selectedId,
        label:       label.trim() || null,
        assigned_by: user.id,
        sort_order:  clientPlans.length,
      }]);
      if (err) throw err;

      // 2. Registar evento na timeline
      await supabase.from('plan_assignments').insert([{
        client_id:   clientId,
        plan_id:     selectedId,
        plan_name:   plan.name,
        label:       label.trim() || null,
        action:      'assigned',
        assigned_by: user.id,
      }]);

      await load();
      setShowAdd(false);
      setSelectedId('');
      setLabel('');
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (cp) => {
    if (!window.confirm(`Remover o plano "${cp.workout_plans?.name}" deste aluno?`)) return;
    try {
      await supabase.from('client_plans').delete().eq('id', cp.id);

      // Regista remoção na timeline
      await supabase.from('plan_assignments').insert([{
        client_id:   clientId,
        plan_id:     cp.plan_id,
        plan_name:   cp.workout_plans?.name || 'Plano',
        label:       cp.label || null,
        action:      'removed',
        assigned_by: user.id,
      }]);

      setClientPlans(prev => prev.filter(p => p.id !== cp.id));
      onChanged?.();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-6">
      <span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">assignment</span>
          <h3 className="text-primary font-bold uppercase text-xs tracking-widest">Planos Atribuídos</h3>
        </div>
        <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full">
          {clientPlans.length} plano{clientPlans.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20">
          {error}
        </div>
      )}

      {/* Lista de planos atribuídos */}
      {clientPlans.length === 0 ? (
        <div className="bg-surface-container-low rounded-[2rem] p-6 text-center border border-dashed border-outline-variant/30">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block">assignment_late</span>
          <p className="text-primary font-bold">Sem planos atribuídos</p>
          <p className="text-on-surface-variant text-sm mt-1">Atribui um ou mais planos a este aluno.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientPlans.map((cp, idx) => (
            <div key={cp.id}
              className="bg-surface-container-low rounded-2xl px-4 py-3 flex items-center justify-between gap-3 border border-outline-variant/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-black text-xs">{idx + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-primary text-sm truncate">{cp.workout_plans?.name}</p>
                  {cp.label && (
                    <span className="inline-block bg-secondary-container text-on-secondary-container text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide mt-0.5">
                      {cp.label}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemove(cp)}
                className="w-8 h-8 rounded-xl bg-error/10 text-error hover:bg-error/20 flex items-center justify-center transition-colors flex-shrink-0 active:scale-90"
                title="Remover plano"
              >
                <span className="material-symbols-outlined text-sm">remove_circle</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de adicionar plano */}
      {showAdd ? (
        <form onSubmit={handleAdd}
          className="bg-primary/5 rounded-[2rem] p-5 border border-primary/20 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Adicionar Plano</p>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1 mb-1.5 block">
              Plano
            </label>
            {available.length === 0 ? (
              <p className="text-on-surface-variant text-sm font-bold text-center py-3">
                Todos os planos já estão atribuídos.
              </p>
            ) : (
              <select
                required
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full bg-surface border border-outline-variant/30 rounded-2xl px-4 py-3 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="" disabled>Escolher plano da biblioteca...</option>
                {available.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1 mb-1.5 block">
              Etiqueta (opcional)
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ex: Manhã · Seg/Qua/Sex · Força A"
              className="w-full bg-surface border border-outline-variant/30 rounded-2xl px-4 py-3 font-medium text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[10px] text-on-surface-variant/50 ml-1 mt-1">
              Ajuda o aluno a identificar quando usar este plano.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowAdd(false); setSelectedId(''); setLabel(''); }}
              className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-surface-container text-on-surface-variant border border-outline-variant/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !selectedId || available.length === 0}
              className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-on-primary shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? 'A adicionar...' : 'Adicionar'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-4 border-dashed border-2 border-primary/30 text-primary rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Adicionar Plano
        </button>
      )}
    </div>
  );
}
