import React, { useState } from 'react';
import { updateBookingStatus, formatTime } from '../../lib/agenda';

const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    bg: 'bg-[#fff8e1]',
    text: 'text-[#795548]',
    icon: 'hourglass_empty',
    dot: 'bg-[#ff9800]',
  },
  approved: {
    label: 'Aprovado',
    bg: 'bg-secondary-fixed/30',
    text: 'text-secondary',
    icon: 'check_circle',
    dot: 'bg-secondary',
  },
  rejected: {
    label: 'Rejeitado',
    bg: 'bg-error-container/50',
    text: 'text-error',
    icon: 'cancel',
    dot: 'bg-error',
  },
};

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parseInt(parts[2])} ${MONTHS_SHORT[parseInt(parts[1]) - 1]}`;
}

/**
 * BookingCard — usado na vista do PT para aprovar/rejeitar reservas
 * @param {object} booking - dados da reserva (com clients embedded)
 * @param {function} onStatusChange - callback após mudança de estado
 */
export default function BookingCard({ booking, onStatusChange }) {
  const [loading, setLoading] = useState(null); // 'approved' | 'rejected' | null

  const clientName = booking.clients?.name || 'Cliente';
  const status = booking.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const handleAction = async (newStatus) => {
    setLoading(newStatus);
    try {
      await updateBookingStatus(booking.id, newStatus);
      onStatusChange?.(booking.id, newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-surface-container-low rounded-[1.5rem] p-4 border border-outline-variant/10 shadow-sm space-y-3">
      {/* Linha superior: avatar + nome + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-fixed rounded-full flex items-center justify-center text-primary font-black text-base uppercase shadow-inner flex-shrink-0">
            {clientName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-on-surface leading-tight">{clientName}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {formatDateShort(booking.booking_date)}
            </p>
          </div>
        </div>

        {/* Badge de estado */}
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${cfg.bg} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Horário */}
      <div className="flex items-center gap-2 bg-surface-container rounded-[1rem] px-3 py-2">
        <span className="material-symbols-outlined text-outline text-base">schedule</span>
        <span className="text-sm font-bold text-on-surface">
          {formatTime(booking.start_time)} — {formatTime(booking.end_time)}
        </span>
        <span className="ml-auto text-xs text-on-surface-variant">
          {(() => {
            const [sh, sm] = booking.start_time.split(':').map(Number);
            const [eh, em] = booking.end_time.split(':').map(Number);
            const diff = (eh * 60 + em) - (sh * 60 + sm);
            return `${diff} min`;
          })()}
        </span>
      </div>

      {/* Notas */}
      {booking.notes && (
        <p className="text-sm text-on-surface-variant italic px-1">
          "{booking.notes}"
        </p>
      )}

      {/* Botões de ação (só quando pendente) */}
      {status === 'pending' && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleAction('rejected')}
            disabled={!!loading}
            className="flex items-center justify-center gap-1.5 bg-error-container text-on-error-container font-bold py-3 rounded-[1rem] active:scale-95 transition-all disabled:opacity-50 text-sm"
          >
            {loading === 'rejected' ? (
              <span className="material-symbols-outlined animate-spin text-base">sync</span>
            ) : (
              <span className="material-symbols-outlined text-base">close</span>
            )}
            Rejeitar
          </button>
          <button
            onClick={() => handleAction('approved')}
            disabled={!!loading}
            className="flex items-center justify-center gap-1.5 bg-primary text-on-primary font-bold py-3 rounded-[1rem] active:scale-95 transition-all disabled:opacity-50 text-sm shadow-md"
          >
            {loading === 'approved' ? (
              <span className="material-symbols-outlined animate-spin text-base">sync</span>
            ) : (
              <span className="material-symbols-outlined text-base">check</span>
            )}
            Aprovar
          </button>
        </div>
      )}
    </div>
  );
}
