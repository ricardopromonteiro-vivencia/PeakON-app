import React, { useState, useEffect } from 'react';
import {
  getBookingsBySlot,
  createBooking,
  formatTime,
  addMinutesToTime,
  timeToMinutes,
} from '../../lib/agenda';

/**
 * BookingRequestModal — Cliente faz pedido de reserva num slot do PT
 * @param {object} slot - slot de disponibilidade selecionado
 * @param {string} clientId - id do registo client
 * @param {string} ptId - id do user do PT
 * @param {number} sessionDuration - duração da sessão em minutos
 * @param {function} onClose
 * @param {function} onBooked
 */
export default function BookingRequestModal({
  slot,
  clientId,
  ptId,
  sessionDuration = 60,
  onClose,
  onBooked,
}) {
  const [startTime, setStartTime] = useState(slot?.start_time?.slice(0, 5) || '09:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingBookings, setExistingBookings] = useState([]);

  const endTime = addMinutesToTime(startTime, sessionDuration);

  // Carregar reservas existentes neste slot para verificar sobreposições
  useEffect(() => {
    if (!slot?.id) return;
    getBookingsBySlot(slot.id)
      .then(setExistingBookings)
      .catch(console.error);
  }, [slot?.id]);

  const slotStart = timeToMinutes(slot?.start_time || '00:00');
  const slotEnd = timeToMinutes(slot?.end_time || '23:59');
  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  // Validações em tempo real
  const isOutOfSlot = reqEnd > slotEnd || reqStart < slotStart;

  const hasOverlap = existingBookings.some((b) => {
    const bStart = timeToMinutes(b.start_time);
    const bEnd = timeToMinutes(b.end_time);
    return reqStart < bEnd && reqEnd > bStart;
  });

  const isValid = !isOutOfSlot && !hasOverlap;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setLoading(true);

    try {
      const payload = {
        availability_id: slot.id,
        pt_id: ptId,
        client_id: clientId,
        booking_date: slot.date,
        start_time: startTime,
        end_time: endTime,
        notes: notes.trim() || null,
        status: 'pending',
      };
      const booking = await createBooking(payload);
      onBooked?.(booking);
      onClose();
    } catch (err) {
      setError('Erro ao enviar pedido. Tenta novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const formatDateShort = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    return `${parseInt(parts[2])} de ${MONTHS_SHORT[parseInt(parts[1]) - 1]}`;
  };

  // Gerar opções de horário (de 15 em 15 min dentro do slot)
  const timeOptions = [];
  let cursor = slotStart;
  while (cursor + sessionDuration <= slotEnd) {
    const h = Math.floor(cursor / 60);
    const m = cursor % 60;
    timeOptions.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    cursor += 15;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface rounded-[2rem] shadow-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Handle mobile */}
        <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-6 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-on-surface-variant text-xs font-black uppercase tracking-widest opacity-70">
              Pedir Reserva
            </p>
            <h2 className="font-headline font-bold text-xl text-primary mt-0.5">
              {formatDateShort(slot?.date)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-90 transition-all text-outline"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Info do slot */}
        <div className="bg-secondary-fixed/30 rounded-[1.2rem] p-3 flex items-center gap-3 mb-5">
          <span className="material-symbols-outlined text-secondary text-xl">event_available</span>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">
              Disponibilidade do PT
            </p>
            <p className="text-sm font-bold text-on-surface">
              {formatTime(slot?.start_time)} — {formatTime(slot?.end_time)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-on-surface-variant">Sessão</p>
            <p className="text-sm font-bold text-primary">{sessionDuration} min</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de hora de início */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">
              Início da Sessão
            </label>
            {timeOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {timeOptions.map((t) => {
                  const tStart = timeToMinutes(t);
                  const tEnd = tStart + sessionDuration;
                  const occupied = existingBookings.some((b) => {
                    const bStart = timeToMinutes(b.start_time);
                    const bEnd = timeToMinutes(b.end_time);
                    return tStart < bEnd && tEnd > bStart;
                  });

                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={occupied}
                      onClick={() => setStartTime(t)}
                      className={`
                        px-4 py-2 rounded-[1rem] text-sm font-bold transition-all active:scale-95
                        ${startTime === t
                          ? 'bg-primary text-on-primary shadow-md'
                          : occupied
                          ? 'bg-error-container/40 text-error/50 cursor-not-allowed line-through'
                          : 'bg-surface-container-low border border-outline-variant/20 text-on-surface hover:border-primary/40'
                        }
                      `}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant italic">
                Nenhum horário disponível para a duração configurada.
              </p>
            )}
          </div>

          {/* Preview do horário */}
          {startTime && isValid && (
            <div className="bg-surface-container rounded-[1rem] p-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">schedule</span>
              <span className="text-sm font-bold text-on-surface">
                {startTime} — {endTime}
              </span>
              <span className="ml-auto text-xs text-on-surface-variant">{sessionDuration} min</span>
            </div>
          )}

          {/* Aviso de sobreposição */}
          {hasOverlap && (
            <div className="bg-error-container rounded-[1rem] p-3 flex items-center gap-2 text-on-error-container text-sm font-bold">
              <span className="material-symbols-outlined text-base">block</span>
              Horário ocupado. Escolhe outro.
            </div>
          )}

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">
              Nota (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguma informação para o PT..."
              rows={2}
              maxLength={200}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-[1rem] px-4 py-3 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-error-container rounded-[1rem] p-3 flex items-center gap-2 text-on-error-container text-sm font-bold">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || !isValid || timeOptions.length === 0}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-[1.3rem] shadow-lg active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading
              ? <span className="material-symbols-outlined animate-spin">sync</span>
              : <><span className="material-symbols-outlined">send</span> Enviar Pedido</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
