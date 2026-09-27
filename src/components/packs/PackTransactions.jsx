import React, { useState, useEffect } from 'react';
import {
  getPackTransactions,
  TRANSACTION_LABELS,
  TRANSACTION_ICONS,
  TRANSACTION_COLORS,
} from '../../lib/packs';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PackTransactions({ clientId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getPackTransactions(clientId);
        setTransactions(data);
      } catch (e) {
        setError('Erro ao carregar histórico: ' + e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">history</span>
        <h3 className="text-primary font-bold uppercase text-xs tracking-widest">Histórico do Pack</h3>
      </div>

      {error && (
        <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20">
          {error}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="bg-surface-container-low rounded-[2rem] p-6 text-center border border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block">receipt_long</span>
          <p className="text-primary font-bold">Sem movimentos ainda</p>
          <p className="text-on-surface-variant text-sm mt-1">O histórico aparecerá aqui após a criação do pack.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-surface-container-low rounded-[1.5rem] p-4 flex items-center gap-4 border border-outline-variant/10 shadow-sm"
            >
              {/* Ícone */}
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                tx.type === 'deduct'  ? 'bg-error/10' :
                tx.type === 'add'    ? 'bg-[#1a7f64]/10' :
                'bg-primary/10'
              }`}>
                <span className={`material-symbols-outlined text-xl ${TRANSACTION_COLORS[tx.type]}`}>
                  {TRANSACTION_ICONS[tx.type]}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-primary text-sm leading-tight">
                  {TRANSACTION_LABELS[tx.type]}
                </p>
                {tx.notes && (
                  <p className="text-on-surface-variant text-xs mt-0.5 truncate">{tx.notes}</p>
                )}
                <p className="text-on-surface-variant/60 text-[10px] mt-1 uppercase tracking-wide">
                  {formatDate(tx.created_at)}
                </p>
              </div>

              {/* Variação de saldo */}
              <div className="text-right flex-shrink-0">
                <p className={`font-black text-lg leading-none ${
                  tx.type === 'deduct' ? 'text-error' : 'text-[#1a7f64]'
                }`}>
                  {tx.type === 'deduct' ? '−' : '+'}{tx.amount}
                </p>
                <p className="text-on-surface-variant/60 text-[10px] mt-1">
                  Saldo: {tx.balance_after}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
