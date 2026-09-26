import React, { useState } from 'react';
import { createSlot } from '../../lib/agenda';

/**
 * SlotModal — PT cria um slot de disponibilidade
 * @param {string} ptId
 * @param {string} date - 'YYYY-MM-DD' pré-selecionada
 * @param {function} onClose
 * @param {function} onSlotCreated
 */
export default function SlotModal({ ptId, date, onClose, onSlotCreated }) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (startTime >= endTime) {
      setError('A hora de início deve ser anterior à hora de fim.');
      return;
    }

    setLoading(true);
    try {
      const slot = await createSlot(ptId, date, startTime, endTime);
      onSlotCreated(slot);
      onClose();
    } catch (err) {
      setError('Erro ao criar disponibilidade. Tenta novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (d) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${parseInt(day)} de ${months[parseInt(m) - 1]} de ${y}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-0 sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 animate-slide-up">
        {/* Handle */}
        <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-6 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-on-surface-variant text-xs font-black uppercase tracking-widest opacity-70">
              Nova Disponibilidade
            </p>
            <h2 className="font-headline font-bold text-xl text-primary mt-0.5">
              {formatDateDisplay(date)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-90 transition-all text-outline"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">
                Início
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-[1rem] px-4 py-3 text-on-surface font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">
                Fim
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-[1rem] px-4 py-3 text-on-surface font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Resumo */}
          {startTime && endTime && startTime < endTime && (
            <div className="bg-secondary-fixed/30 rounded-[1.2rem] p-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-xl">schedule</span>
              <span className="text-sm font-bold text-on-surface">
                Bloco de {startTime.slice(0,5)} às {endTime.slice(0,5)}
              </span>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="bg-error-container rounded-[1rem] p-3 flex items-center gap-2 text-on-error-container text-sm font-bold">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-[1.3rem] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">sync</span>
            ) : (
              <>
                <span className="material-symbols-outlined">add_circle</span>
                Criar Disponibilidade
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
