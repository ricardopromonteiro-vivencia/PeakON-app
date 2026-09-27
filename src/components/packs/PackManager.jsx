import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  getClientPack,
  createClientPack,
  deductSessions,
  addSessions,
  renewPackManually,
  deactivatePack,
  RENEWAL_LABELS,
} from '../../lib/packs';

// ─── Sub-componente: formulário de criação de pack ────────────
function CreatePackForm({ onSave, onCancel, loading }) {
  const [totalSessions, setTotalSessions] = useState(10);
  const [renewalType, setRenewalType] = useState('monthly');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ totalSessions: parseInt(totalSessions, 10), renewalType, startDate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">
          Aulas por ciclo
        </label>
        <input
          type="number"
          min={1}
          value={totalSessions}
          onChange={(e) => setTotalSessions(e.target.value)}
          className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-5 py-4 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          required
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">
          Tipo de Renovação
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['monthly', 'weekly', 'manual'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRenewalType(type)}
              className={`py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
                renewalType === type
                  ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/20'
              }`}
            >
              {RENEWAL_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">
          Data de início
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-5 py-4 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-surface-container text-on-surface-variant border border-outline-variant/20"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-on-primary shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60"
        >
          {loading ? 'A criar...' : 'Criar Pack'}
        </button>
      </div>
    </form>
  );
}

// ─── Sub-componente: modal de operação (desconto / adicionar) ──
function SessionActionModal({ mode, pack, onConfirm, onClose, loading }) {
  const [amount, setAmount] = useState(1);
  const [notes, setNotes] = useState('');

  const isDeduct = mode === 'deduct';
  const title    = isDeduct ? 'Descontar Aulas' : 'Adicionar Aulas';
  const icon     = isDeduct ? 'remove_circle'   : 'add_circle';
  const color    = isDeduct ? 'text-error'       : 'text-[#1a7f64]';
  const btnClass = isDeduct
    ? 'bg-error text-white shadow-error/20'
    : 'bg-[#1a7f64] text-white shadow-[#1a7f64]/20';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-3xl ${color}`}>{icon}</span>
            <h3 className="text-xl font-black text-primary font-headline tracking-tighter">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="bg-surface-container rounded-2xl p-4 mb-6 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">Saldo atual</span>
          <span className="text-2xl font-black text-primary">{pack.sessions_remaining}</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">
              Número de aulas
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAmount((a) => Math.max(1, a - 1))}
                className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-primary font-black text-xl active:scale-90 transition-transform"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={isDeduct ? pack.sessions_remaining : 999}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-surface-container border border-outline-variant/20 rounded-2xl px-5 py-3 font-black text-primary text-center text-2xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setAmount((a) => a + 1)}
                className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-primary font-black text-xl active:scale-90 transition-transform"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">
              Nota (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: treino de segunda-feira"
              className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-5 py-3 font-medium text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-surface-container text-on-surface-variant border border-outline-variant/20"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(amount, notes)}
            disabled={loading || (isDeduct && amount > pack.sessions_remaining)}
            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 ${btnClass}`}
          >
            {loading ? 'A processar...' : isDeduct ? 'Descontar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function PackManager({ clientId }) {
  const { user } = useAppStore();
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [modal, setModal] = useState(null); // 'deduct' | 'add' | null

  const loadPack = useCallback(async () => {
    try {
      const data = await getClientPack(clientId);
      setPack(data);
    } catch (e) {
      setError('Erro ao carregar pack: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadPack();
  }, [loadPack]);

  const handleCreate = async (opts) => {
    setActionLoading(true);
    setError('');
    try {
      const newPack = await createClientPack(user.id, clientId, opts);
      setPack(newPack);
      setShowCreate(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeduct = async (amount, notes) => {
    setActionLoading(true);
    setError('');
    try {
      const newBalance = await deductSessions(user.id, pack, amount, notes);
      setPack({ ...pack, sessions_remaining: newBalance });
      setModal(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdd = async (amount, notes) => {
    setActionLoading(true);
    setError('');
    try {
      const newBalance = await addSessions(user.id, pack, amount, notes);
      setPack({ ...pack, sessions_remaining: newBalance });
      setModal(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!window.confirm('Renovar o pack manualmente? Serão somadas ' + pack.total_sessions + ' aulas ao saldo atual.')) return;
    setActionLoading(true);
    setError('');
    try {
      const newBalance = await renewPackManually(user.id, pack);
      setPack({ ...pack, sessions_remaining: newBalance });
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Tens a certeza que queres cancelar este pack? O saldo será perdido.')) return;
    setActionLoading(true);
    try {
      await deactivatePack(pack.id);
      setPack(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-container-low rounded-[2rem] p-6 flex items-center justify-center border border-outline-variant/10">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
      </div>
    );
  }

  return (
    <>
      {/* Modais de ação */}
      {modal && (
        <SessionActionModal
          mode={modal}
          pack={pack}
          onConfirm={modal === 'deduct' ? handleDeduct : handleAdd}
          onClose={() => setModal(null)}
          loading={actionLoading}
        />
      )}

      <div className="space-y-4">
        {/* Cabeçalho da secção */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">confirmation_number</span>
            <h3 className="text-primary font-bold uppercase text-xs tracking-widest">Pack de Aulas</h3>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20">
            {error}
          </div>
        )}

        {/* Sem pack ativo */}
        {!pack && !showCreate && (
          <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-3 block">confirmation_number</span>
            <p className="text-primary font-bold mb-1">Sem pack ativo</p>
            <p className="text-on-surface-variant text-sm mb-5">Cria um pack para controlar as aulas deste aluno.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Criar Pack
            </button>
          </div>
        )}

        {/* Formulário de criação */}
        {showCreate && (
          <div className="bg-surface-container-low rounded-[2rem] p-6 border border-primary/20 shadow-sm">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-5">Novo Pack</p>
            <CreatePackForm
              onSave={handleCreate}
              onCancel={() => setShowCreate(false)}
              loading={actionLoading}
            />
          </div>
        )}

        {/* Pack ativo */}
        {pack && (
          <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm space-y-5">
            {/* Saldo em destaque */}
            <div className="bg-primary rounded-[1.5rem] p-6 text-center">
              <p className="text-on-primary/70 text-[10px] font-black uppercase tracking-widest mb-1">Aulas Disponíveis</p>
              <p className="text-on-primary font-black text-7xl leading-none">{pack.sessions_remaining}</p>
              <p className="text-on-primary/70 text-xs font-bold mt-2">
                de {pack.total_sessions} · {RENEWAL_LABELS[pack.renewal_type]}
                {pack.next_renewal_at && (
                  <span> · Renova {new Date(pack.next_renewal_at).toLocaleDateString('pt-PT')}</span>
                )}
              </p>
            </div>

            {/* Ações principais */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModal('deduct')}
                disabled={pack.sessions_remaining === 0}
                className="py-4 bg-error/10 text-error rounded-[1.2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 flex flex-col items-center gap-1 border border-error/10"
              >
                <span className="material-symbols-outlined text-2xl">remove_circle</span>
                Descontar Aula
              </button>
              <button
                onClick={() => setModal('add')}
                className="py-4 bg-[#1a7f64]/10 text-[#1a7f64] rounded-[1.2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex flex-col items-center gap-1 border border-[#1a7f64]/10"
              >
                <span className="material-symbols-outlined text-2xl">add_circle</span>
                Adicionar Aulas
              </button>
            </div>

            {/* Renovação manual (só se pack manual) */}
            {pack.renewal_type === 'manual' && (
              <button
                onClick={handleRenew}
                disabled={actionLoading}
                className="w-full py-4 bg-secondary-container text-on-secondary-container rounded-[1.2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-xl">autorenew</span>
                Renovar Pack (+{pack.total_sessions} aulas)
              </button>
            )}

            {/* Cancelar pack */}
            <button
              onClick={handleDeactivate}
              disabled={actionLoading}
              className="w-full py-3 text-error/70 font-bold text-xs uppercase tracking-widest bg-error/5 rounded-2xl hover:bg-error/10 transition-all border border-error/10 disabled:opacity-50"
            >
              Cancelar Pack
            </button>
          </div>
        )}

        {/* Botão para criar novo pack (quando já existe um) */}
        {pack && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-3 text-primary/70 font-bold text-xs uppercase tracking-widest bg-surface-container rounded-2xl hover:bg-surface-container-high transition-all border border-outline-variant/10"
          >
            Substituir por novo pack
          </button>
        )}
      </div>
    </>
  );
}
