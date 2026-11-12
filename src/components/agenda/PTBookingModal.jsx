import React, { useState, useEffect } from 'react';
import {
  getSlotBookings,
  createBookingByPT,
  removeBooking,
  updateBookingStatus,
  updateSlotMaxClients,
  formatTime,
  addMinutesToTime,
  timeToMinutes,
} from '../../lib/agenda';

const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
function formatDateShort(d) {
  if (!d) return '';
  const parts = d.split('-');
  return `${parseInt(parts[2])} de ${MONTHS_SHORT[parseInt(parts[1]) - 1]}`;
}

const STATUS_CONFIG = {
  pending:  { label: 'Pedido',    bg: 'bg-[#fff8e1]',         text: 'text-[#795548]', dot: 'bg-[#ff9800]' },
  approved: { label: 'Marcado',   bg: 'bg-[#1a7f64]/10',      text: 'text-[#1a7f64]', dot: 'bg-[#1a7f64]' },
};

/**
 * PTBookingModal — PT gere as marcações de um slot diretamente.
 *
 * Props:
 *   slot          — objeto pt_availability
 *   clients       — lista de clientes do PT
 *   sessionConfigs— configs de duração por cliente
 *   ptId
 *   onClose
 *   onChanged     — callback para refrescar o pai
 */
export default function PTBookingModal({ slot, clients, sessionConfigs, ptId, onClose, onChanged }) {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState(false);
  const [removing, setRemoving]       = useState(null);
  const [approving, setApproving]     = useState(null);
  const [error, setError]             = useState('');

  // Form de adicionar
  const [selectedClientId, setSelectedClientId] = useState('');
  const [startTime, setStartTime]               = useState(slot?.start_time?.slice(0, 5) || '09:00');
  const [showAddForm, setShowAddForm]           = useState(false);
  const [maxClients, setMaxClients]             = useState(slot?.max_clients || 1);
  const [savingMax, setSavingMax]               = useState(false);

  const slotStart = timeToMinutes(slot?.start_time || '00:00');
  const slotEnd   = timeToMinutes(slot?.end_time   || '23:59');

  const getDuration = (clientId) => {
    const cfg = sessionConfigs?.find(c => c.client_id === clientId);
    return cfg?.session_duration_minutes || 60;
  };

  const endTime = addMinutesToTime(startTime, getDuration(selectedClientId));

  const load = async () => {
    try {
      const data = await getSlotBookings(slot.id);
      setBookings(data);
    } catch (e) {
      setError('Erro ao carregar marcações: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [slot.id]);

  // Clientes ainda não marcados neste slot
  const bookedClientIds = bookings.map(b => b.client_id);
  const availableClients = clients.filter(c => !bookedClientIds.includes(c.id));

  // Validar sobreposição no slot
  const duration = getDuration(selectedClientId);
  const reqStart = timeToMinutes(startTime);
  const reqEnd   = reqStart + duration;
  const isOutOfSlot = reqEnd > slotEnd || reqStart < slotStart;
  const hasOverlap  = bookings.some(b => {
    const bStart = timeToMinutes(b.start_time);
    const bEnd   = timeToMinutes(b.end_time);
    return reqStart < bEnd && reqEnd > bStart;
  });
  const canAdd = selectedClientId && !isOutOfSlot && !hasOverlap && reqEnd <= slotEnd;

  // Gerar opções de horário (de 15 em 15 min)
  const timeOptions = [];
  let cursor = slotStart;
  while (cursor + duration <= slotEnd) {
    const h = Math.floor(cursor / 60);
    const m = cursor % 60;
    timeOptions.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    cursor += 15;
  }

  const handleAdd = async () => {
    if (!canAdd) return;
    setAdding(true);
    setError('');
    try {
      const booking = await createBookingByPT(ptId, {
        availabilityId: slot.id,
        clientId:       selectedClientId,
        bookingDate:    slot.date,
        startTime,
        endTime,
      });
      setBookings(prev => [...prev, booking]);
      setShowAddForm(false);
      setSelectedClientId('');
      setStartTime(slot.start_time.slice(0, 5));
      onChanged?.();
    } catch (e) {
      setError('Erro ao marcar: ' + e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (booking) => {
    if (!window.confirm(`Remover a marcação de ${booking.clients?.name}?`)) return;
    setRemoving(booking.id);
    try {
      await removeBooking(booking.id);
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      onChanged?.();
    } catch (e) {
      setError('Erro ao remover: ' + e.message);
    } finally {
      setRemoving(null);
    }
  };

  const handleApprove = async (booking) => {
    setApproving(booking.id);
    try {
      await updateBookingStatus(booking.id, 'approved');
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'approved' } : b));
      onChanged?.();
    } catch (e) {
      setError('Erro ao aprovar: ' + e.message);
    } finally {
      setApproving(null);
    }
  };

  const handleSaveMaxClients = async () => {
    setSavingMax(true);
    try {
      await updateSlotMaxClients(slot.id, maxClients);
    } catch (e) {
      setError('Erro ao guardar: ' + e.message);
    } finally {
      setSavingMax(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-surface rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-on-surface-variant text-xs font-black uppercase tracking-widest opacity-70">
              Gestão do Slot
            </p>
            <h2 className="font-headline font-bold text-xl text-primary mt-0.5">
              {formatDateShort(slot?.date)} · {formatTime(slot?.start_time)} — {formatTime(slot?.end_time)}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-90 transition-all text-outline">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Config: máximo de alunos */}
        <div className="bg-surface-container-low rounded-[1.5rem] p-4 mb-4 border border-outline-variant/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-2">
            Capacidade do Slot
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <button onClick={() => setMaxClients(m => Math.max(1, m - 1))}
                className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary font-black text-lg active:scale-90 transition-transform">
                −
              </button>
              <div className="flex-1 text-center">
                <p className="text-3xl font-black text-primary leading-none">{maxClients}</p>
                <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-wide mt-0.5">
                  aluno{maxClients !== 1 ? 's' : ''} em simultâneo
                </p>
              </div>
              <button onClick={() => setMaxClients(m => m + 1)}
                className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary font-black text-lg active:scale-90 transition-transform">
                +
              </button>
            </div>
            <button onClick={handleSaveMaxClients} disabled={savingMax}
              className="bg-primary text-on-primary px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50">
              {savingMax ? '...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Lista de alunos marcados */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
              Alunos Marcados ({bookings.length}/{maxClients})
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: maxClients }).map((_, i) => (
                <span key={i}
                  className={`w-2.5 h-2.5 rounded-full ${i < bookings.length ? 'bg-[#1a7f64]' : 'bg-outline-variant/30'}`}
                />
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-surface-container-low rounded-[1.5rem] p-5 text-center border border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-3xl text-outline mb-1 block">person_add</span>
              <p className="text-on-surface-variant text-sm font-bold">Nenhum aluno marcado</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Adiciona alunos com o botão abaixo.</p>
            </div>
          ) : (
            bookings.map(booking => {
              const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.approved;
              return (
                <div key={booking.id}
                  className="bg-surface-container-low rounded-[1.3rem] p-3 border border-outline-variant/10 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-base uppercase flex-shrink-0">
                    {booking.clients?.name?.charAt(0) || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-primary text-sm truncate">{booking.clients?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-on-surface-variant text-xs">
                        {formatTime(booking.start_time)} — {formatTime(booking.end_time)}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Aprovar pedido pendente */}
                    {booking.status === 'pending' && (
                      <button onClick={() => handleApprove(booking)}
                        disabled={approving === booking.id}
                        title="Aprovar pedido"
                        className="w-8 h-8 rounded-xl bg-[#1a7f64]/10 text-[#1a7f64] hover:bg-[#1a7f64]/20 flex items-center justify-center transition-colors active:scale-90">
                        <span className="material-symbols-outlined text-sm">
                          {approving === booking.id ? 'sync' : 'check'}
                        </span>
                      </button>
                    )}
                    {/* Remover */}
                    <button onClick={() => handleRemove(booking)}
                      disabled={removing === booking.id}
                      title="Remover marcação"
                      className="w-8 h-8 rounded-xl bg-error/10 text-error hover:bg-error/20 flex items-center justify-center transition-colors active:scale-90">
                      <span className={`material-symbols-outlined text-sm ${removing === booking.id ? 'animate-spin' : ''}`}>
                        {removing === booking.id ? 'sync' : 'person_remove'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Formulário de adicionar aluno */}
        {showAddForm ? (
          <div className="bg-primary/5 rounded-[1.5rem] p-4 border border-primary/20 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Adicionar Aluno</p>

            {/* Selecionar aluno */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1 mb-1.5 block">
                Aluno
              </label>
              {availableClients.length === 0 ? (
                <p className="text-on-surface-variant text-sm text-center py-2 font-bold">
                  Todos os alunos já estão marcados neste slot.
                </p>
              ) : (
                <select value={selectedClientId} onChange={e => { setSelectedClientId(e.target.value); setStartTime(slot.start_time.slice(0,5)); }}
                  className="w-full bg-surface border border-outline-variant/30 rounded-2xl px-4 py-3 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="" disabled>Escolher aluno...</option>
                  {availableClients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Seletor de hora */}
            {selectedClientId && timeOptions.length > 0 && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1 mb-2 block">
                  Horário ({getDuration(selectedClientId)} min)
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeOptions.map(t => {
                    const tStart = timeToMinutes(t);
                    const tEnd   = tStart + getDuration(selectedClientId);
                    const occupied = bookings.some(b => {
                      const bStart = timeToMinutes(b.start_time);
                      const bEnd   = timeToMinutes(b.end_time);
                      return tStart < bEnd && tEnd > bStart;
                    });
                    return (
                      <button key={t} type="button" disabled={occupied}
                        onClick={() => setStartTime(t)}
                        className={`px-4 py-2 rounded-[1rem] text-sm font-bold transition-all active:scale-95
                          ${startTime === t
                            ? 'bg-primary text-on-primary shadow-md'
                            : occupied
                              ? 'bg-error-container/40 text-error/50 cursor-not-allowed line-through'
                              : 'bg-surface-container-low border border-outline-variant/20 text-on-surface hover:border-primary/40'
                          }`}>
                        {t}
                      </button>
                    );
                  })}
                </div>

                {/* Preview */}
                {canAdd && (
                  <div className="bg-surface-container rounded-[1rem] p-2.5 flex items-center gap-2 mt-3">
                    <span className="material-symbols-outlined text-primary text-base">schedule</span>
                    <span className="text-sm font-bold text-on-surface">{startTime} — {endTime}</span>
                    <span className="ml-auto text-xs text-on-surface-variant">{getDuration(selectedClientId)} min</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowAddForm(false); setSelectedClientId(''); }}
                className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-surface-container text-on-surface-variant border border-outline-variant/20">
                Cancelar
              </button>
              <button onClick={handleAdd} disabled={adding || !canAdd || availableClients.length === 0}
                className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-on-primary shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                {adding
                  ? <><span className="material-symbols-outlined animate-spin text-sm">sync</span>A marcar...</>
                  : <><span className="material-symbols-outlined text-sm">person_add</span>Marcar</>
                }
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddForm(true)}
            disabled={bookings.length >= maxClients}
            className="w-full py-4 border-dashed border-2 border-primary/30 text-primary rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined">person_add</span>
            {bookings.length >= maxClients ? 'Slot cheio' : 'Adicionar Aluno'}
          </button>
        )}
      </div>
    </div>
  );
}
