import React from 'react';
import { RENEWAL_LABELS } from '../../lib/packs';

/**
 * Card de saldo para o aluno ver no seu dashboard.
 * Recebe o objeto `pack` (pode ser null se não houver pack ativo).
 */
export default function PackStatus({ pack, onViewHistory }) {
  if (!pack) {
    return (
      <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-2 block">confirmation_number</span>
        <p className="text-primary font-bold">Sem pack ativo</p>
        <p className="text-on-surface-variant text-sm mt-1">O teu PT ainda não criou um pack para ti.</p>
      </div>
    );
  }

  const pct = pack.total_sessions > 0
    ? Math.round((pack.sessions_remaining / pack.total_sessions) * 100)
    : 0;

  const barColor =
    pct > 50 ? 'bg-primary' :
    pct > 20 ? 'bg-[#f5a623]' :
    'bg-error';

  return (
    <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm space-y-5">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">confirmation_number</span>
          <h3 className="text-primary font-bold uppercase text-xs tracking-widest">Pack de Aulas</h3>
        </div>
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">history</span>
            Histórico
          </button>
        )}
      </div>

      {/* Saldo principal */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
            Aulas disponíveis
          </p>
          <p className="text-primary font-black text-6xl leading-none">
            {pack.sessions_remaining}
          </p>
        </div>
        <div className="text-right">
          <p className="text-on-surface-variant text-xs font-bold opacity-70">
            de {pack.total_sessions}
          </p>
          <span className="inline-block mt-1 bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            {RENEWAL_LABELS[pack.renewal_type]}
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div>
        <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="text-on-surface-variant/60 text-[10px] mt-1.5 text-right font-bold uppercase tracking-wide">
          {pct}% restante
        </p>
      </div>

      {/* Próxima renovação */}
      {pack.next_renewal_at && (
        <div className="bg-surface-container rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary/60 text-xl">event</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
              Próxima renovação
            </p>
            <p className="font-bold text-primary text-sm">
              {new Date(pack.next_renewal_at).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Aviso de saldo baixo */}
      {pack.sessions_remaining === 0 && (
        <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">warning</span>
          Sem aulas disponíveis. Fala com o teu PT para renovar.
        </div>
      )}
      {pack.sessions_remaining > 0 && pack.sessions_remaining <= 2 && (
        <div className="bg-[#f5a623]/10 text-[#b87516] text-sm font-bold px-4 py-3 rounded-2xl border border-[#f5a623]/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">warning</span>
          Tens apenas {pack.sessions_remaining} aula{pack.sessions_remaining > 1 ? 's' : ''} restante{pack.sessions_remaining > 1 ? 's' : ''}.
        </div>
      )}
    </div>
  );
}
