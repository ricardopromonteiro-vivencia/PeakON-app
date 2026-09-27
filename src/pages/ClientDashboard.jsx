import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getClientPack } from '../lib/packs';
import { supabase } from '../lib/supabase';
import PackStatus from '../components/packs/PackStatus';
import PackTransactions from '../components/packs/PackTransactions';
import ClientPlan from '../components/plan/ClientPlan';

export default function ClientDashboard() {
  const { user, userProfile } = useAppStore();
  const [clientId, setClientId]       = useState(null);
  const [planEntries, setPlanEntries] = useState([]);
  const [pack, setPack]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('pack');
  const [error, setError]             = useState('');

  useEffect(() => {
    async function loadClientData() {
      try {
        const { data: userRow, error: userErr } = await supabase
          .from('users')
          .select('linked_client_id')
          .eq('id', user.id)
          .maybeSingle();

        if (userErr) throw userErr;
        if (!userRow?.linked_client_id) {
          setError('A tua conta de aluno ainda não foi associada. Fala com o teu PT.');
          setLoading(false);
          return;
        }

        const cId = userRow.linked_client_id;
        setClientId(cId);

        const [packData, { data: plansData }] = await Promise.all([
          getClientPack(cId),
          supabase
            .from('client_plans')
            .select('*, workout_plans(id, name, description)')
            .eq('client_id', cId)
            .order('sort_order'),
        ]);

        setPack(packData);
        setPlanEntries(plansData || []);
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
              { key: 'plano',   label: 'Plano',     icon: 'assignment' },
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
            <PackStatus pack={pack} onViewHistory={() => setActiveTab('history')} />
          )}

          {activeTab === 'plano' && clientId && (
            <ClientPlan
              clientId={clientId}
              planEntries={planEntries}
              readOnly={false}
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
