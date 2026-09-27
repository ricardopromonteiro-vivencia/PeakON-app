import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getClientPack, getPackTransactions } from '../lib/packs';
import { supabase } from '../lib/supabase';
import PackStatus from '../components/packs/PackStatus';
import PackTransactions from '../components/packs/PackTransactions';

export default function ClientDashboard() {
  const { user, userProfile } = useAppStore();
  const [clientId, setClientId] = useState(null);
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pack'); // 'pack' | 'history'
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadClientData() {
      try {
        // Encontra o registo do aluno pelo supabase_uid
        const { data: clientRow, error: clientErr } = await supabase
          .from('clients')
          .select('id')
          .eq('supabase_uid', user.id)
          .maybeSingle();

        if (clientErr) throw clientErr;
        if (!clientRow) {
          setError('A tua conta de aluno ainda não foi associada. Fala com o teu PT.');
          setLoading(false);
          return;
        }

        setClientId(clientRow.id);
        const packData = await getClientPack(clientRow.id);
        setPack(packData);
      } catch (e) {
        setError('Erro ao carregar dados: ' + e.message);
      } finally {
        setLoading(false);
      }
    }

    if (user) loadClientData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <section>
        <p className="text-on-surface-variant font-label text-sm font-black uppercase tracking-widest mb-1 opacity-70">
          Bem-vindo
        </p>
        <h2 className="text-primary font-headline font-black text-4xl tracking-tighter">
          {userProfile?.name || user?.email?.split('@')[0] || 'Atleta'}
        </h2>
      </section>

      {error && (
        <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20">
          {error}
        </div>
      )}

      {!error && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 bg-surface-container rounded-2xl p-1.5">
            {[
              { key: 'pack',    label: 'Pack',      icon: 'confirmation_number' },
              { key: 'history', label: 'Histórico', icon: 'receipt_long' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-1 transition-all ${
                  activeTab === tab.key
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-on-surface-variant opacity-60'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'pack' && (
            <PackStatus
              pack={pack}
              onViewHistory={() => setActiveTab('history')}
            />
          )}

          {activeTab === 'history' && clientId && (
            <PackTransactions clientId={clientId} />
          )}
        </>
      )}
    </div>
  );
}
