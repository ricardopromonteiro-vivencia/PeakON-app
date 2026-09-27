import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientById, getClientTimeline } from '../lib/api';
import { getClientPack, getPackTransactions, RENEWAL_LABELS, TRANSACTION_LABELS, TRANSACTION_ICONS, TRANSACTION_COLORS } from '../lib/packs';
import TimelineItem from '../components/TimelineItem';
import PackStatus from '../components/packs/PackStatus';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function TransactionsList({ clientId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPackTransactions(clientId).then(setTransactions).finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div className="flex justify-center py-6"><span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span></div>;

  if (transactions.length === 0) return (
    <div className="text-center py-6 text-on-surface-variant text-sm">Sem movimentos de pack.</div>
  );

  return (
    <div className="space-y-2">
      {transactions.map(tx => (
        <div key={tx.id} className="bg-surface rounded-[1.5rem] p-4 flex items-center gap-4 border border-outline-variant/10">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            tx.type === 'deduct' ? 'bg-error/10' : tx.type === 'add' ? 'bg-[#1a7f64]/10' : 'bg-primary/10'
          }`}>
            <span className={`material-symbols-outlined text-lg ${TRANSACTION_COLORS[tx.type]}`}>{TRANSACTION_ICONS[tx.type]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-primary text-sm">{TRANSACTION_LABELS[tx.type]}</p>
            {tx.notes && <p className="text-on-surface-variant text-xs truncate">{tx.notes}</p>}
            <p className="text-on-surface-variant/50 text-[10px] mt-0.5">{formatDate(tx.created_at)}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`font-black text-lg leading-none ${tx.type === 'deduct' ? 'text-error' : 'text-[#1a7f64]'}`}>
              {tx.type === 'deduct' ? '−' : '+'}{tx.amount}
            </p>
            <p className="text-on-surface-variant/50 text-[10px] mt-0.5">Saldo: {tx.balance_after}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminClientView() {
  const { ptId, clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient]   = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [pack, setPack]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    async function load() {
      try {
        const [c, t, p] = await Promise.all([
          getClientById(clientId),
          getClientTimeline(clientId),
          getClientPack(clientId),
        ]);
        setClient(c);
        setTimeline(t);
        setPack(p);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [clientId]);

  if (loading) return <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;
  if (!client)  return <div className="text-center py-20 text-error font-bold">Erro ao carregar aluno.</div>;

  const shareText = `Olá ${client.name}! O teu código é: ${client.invite_code}`;

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold">
        <button onClick={() => navigate('/admin')} className="hover:text-primary transition-colors">Admin</button>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <button onClick={() => navigate(`/admin/pt/${ptId}`)} className="hover:text-primary transition-colors">PT</button>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary">{client.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-6">
        <button onClick={() => navigate(`/admin/pt/${ptId}`)} className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform flex-shrink-0">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black text-primary font-headline tracking-tighter truncate">{client.name}</h2>
            <span className="inline-block bg-error/10 text-error text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
              Admin View
            </span>
          </div>
          {client.goal && <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase mt-1 truncate">{client.goal}</p>}
        </div>
      </div>

      {/* Plano atual */}
      <div className="bg-surface rounded-[2rem] p-5 border-2 border-dashed border-outline-variant/30 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-1">Plano Atual</p>
          <p className="font-bold text-primary text-lg leading-none">
            {client.workout_plans ? client.workout_plans.name : 'Sem Plano Atribuído'}
          </p>
        </div>
        <span className="material-symbols-outlined text-outline">assignment</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface-container rounded-2xl p-1.5 overflow-x-auto">
        {[
          { key: 'timeline', label: 'Timeline',  icon: 'history' },
          { key: 'pack',     label: 'Pack',       icon: 'confirmation_number' },
          { key: 'history',  label: 'Histórico',  icon: 'receipt_long' },
          { key: 'invite',   label: 'Convite',    icon: 'key' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-[4.5rem] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.key ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {timeline.length === 0 ? (
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2 block">history</span>
              <p className="text-primary font-bold">Sem registos</p>
            </div>
          ) : timeline.map(item => (
            <TimelineItem key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}

      {/* Pack */}
      {activeTab === 'pack' && (
        <PackStatus pack={pack} />
      )}

      {/* Histórico pack */}
      {activeTab === 'history' && (
        <TransactionsList clientId={clientId} />
      )}

      {/* Convite */}
      {activeTab === 'invite' && (
        <div className="space-y-4">
          <div className="bg-surface-container-high rounded-[2rem] p-6 border border-primary/10 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 pointer-events-none">
              <span className="material-symbols-outlined text-primary/10 text-6xl -rotate-12">key</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Código de Acesso</p>
            {client.invite_code ? (
              <p className="text-5xl font-black text-primary tracking-[0.2em] font-headline">{client.invite_code}</p>
            ) : (
              <p className="text-on-surface-variant font-bold">Sem código</p>
            )}
            <span className={`inline-flex items-center gap-1 mt-3 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
              client.is_registered ? 'bg-[#1a7f64]/10 text-[#1a7f64]' : 'bg-[#f5a623]/10 text-[#b87516]'
            }`}>
              <span className="material-symbols-outlined text-sm">{client.is_registered ? 'check_circle' : 'pending'}</span>
              {client.is_registered ? 'Aluno registado' : 'Aguarda registo'}
            </span>
          </div>
          {client.invite_code && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { navigator.clipboard.writeText(client.invite_code); alert('Código copiado!'); }}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm bg-surface-container text-primary border border-outline-variant/20 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xl">content_copy</span>
                Copiar Código
              </button>
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all shadow-lg shadow-[#25d366]/20"
              >
                <span className="material-symbols-outlined text-xl">share</span>
                WhatsApp
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
