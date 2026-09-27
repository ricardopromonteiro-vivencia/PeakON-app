import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ─── Definição de todas as medidas ───────────────────────────
const WEIGHT_FIELD = {
  key: 'weight', label: 'Peso', unit: 'kg', icon: 'scale',
  placeholder: '75.5', step: '0.1', table: 'progress_logs',
};

const METRIC_GROUPS = [
  {
    group: 'Geral',
    fields: [
      { key: 'height',   label: 'Altura',         unit: 'cm', icon: 'height',          placeholder: '175',  step: '0.5' },
      { key: 'body_fat', label: 'Gordura Corporal', unit: '%',  icon: 'percent',         placeholder: '18.5', step: '0.1' },
    ],
  },
  {
    group: 'Tronco',
    fields: [
      { key: 'neck',     label: 'Pescoço',  unit: 'cm', icon: 'accessibility_new', placeholder: '38',   step: '0.5' },
      { key: 'shoulder', label: 'Ombros',   unit: 'cm', icon: 'accessibility_new', placeholder: '120',  step: '0.5' },
      { key: 'chest',    label: 'Peito',    unit: 'cm', icon: 'favorite',          placeholder: '100',  step: '0.5' },
      { key: 'waist',    label: 'Cintura',  unit: 'cm', icon: 'straighten',        placeholder: '80',   step: '0.5' },
      { key: 'abdomen',  label: 'Abdómen',  unit: 'cm', icon: 'straighten',        placeholder: '85',   step: '0.5' },
      { key: 'hip',      label: 'Anca',     unit: 'cm', icon: 'accessibility_new', placeholder: '98',   step: '0.5' },
    ],
  },
  {
    group: 'Membros Superiores',
    fields: [
      { key: 'arm',      label: 'Braço (contraído)', unit: 'cm', icon: 'fitness_center', placeholder: '35', step: '0.5' },
      { key: 'forearm',  label: 'Antebraço',          unit: 'cm', icon: 'fitness_center', placeholder: '28', step: '0.5' },
    ],
  },
  {
    group: 'Membros Inferiores',
    fields: [
      { key: 'thigh',    label: 'Coxa',   unit: 'cm', icon: 'fitness_center', placeholder: '58', step: '0.5' },
      { key: 'calf',     label: 'Gémeo',  unit: 'cm', icon: 'fitness_center', placeholder: '38', step: '0.5' },
    ],
  },
];

// ─── Campo de medida individual ──────────────────────────────
function MetricField({ field, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary/60 text-lg">{field.icon}</span>
        <span className="font-bold text-primary text-sm">{field.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step={field.step}
          value={value}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-24 bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2 font-black text-primary text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <span className="text-on-surface-variant font-bold text-xs w-6">{field.unit}</span>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function LogProgress() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [weight, setWeight]   = useState('');
  const [metrics, setMetrics] = useState({});
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [activeTab, setActiveTab] = useState('weight'); // 'weight' | 'measures'

  const setMetric = (key, val) => setMetrics(prev => ({ ...prev, [key]: val }));

  // Conta quantas medidas foram preenchidas
  const filledMetrics = Object.values(metrics).filter(v => v !== '' && v != null).length;
  const hasWeight     = weight !== '';
  const canSave       = hasWeight || filledMetrics > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setLoading(true);
    setError('');

    try {
      // 1. Guardar peso (se preenchido)
      if (hasWeight) {
        const { error: wErr } = await supabase
          .from('progress_logs')
          .insert([{ client_id: id, weight: parseFloat(weight), notes: notes || null }]);
        if (wErr) throw wErr;
      }

      // 2. Guardar medidas corporais (se alguma preenchida)
      const metricsToSave = {};
      Object.entries(metrics).forEach(([k, v]) => {
        if (v !== '' && v != null) metricsToSave[k] = parseFloat(v);
      });

      if (Object.keys(metricsToSave).length > 0) {
        const { error: mErr } = await supabase
          .from('body_metrics')
          .insert([{ client_id: id, ...metricsToSave, notes: notes || null }]);
        if (mErr) throw mErr;
      }

      navigate(`/client/${id}`, { replace: true });
    } catch (e) {
      setError('Erro ao guardar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)}
          className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform">
          <span className="material-symbols-outlined">close</span>
        </button>
        <div>
          <h2 className="text-3xl font-black text-primary font-headline tracking-tighter">Registar Evolução</h2>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mt-0.5">Peso e medidas corporais</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-container rounded-full p-1">
        <button onClick={() => setActiveTab('weight')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-full transition-colors ${activeTab === 'weight' ? 'bg-[#00677f] text-white shadow-md' : 'text-on-surface-variant'}`}>
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">scale</span> Peso
          </span>
        </button>
        <button onClick={() => setActiveTab('measures')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-full transition-colors flex items-center justify-center gap-2 ${activeTab === 'measures' ? 'bg-[#00677f] text-white shadow-md' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-lg">straighten</span>
          Medidas
          {filledMetrics > 0 && (
            <span className="bg-white text-[#00677f] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
              {filledMetrics}
            </span>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tab: Peso */}
        {activeTab === 'weight' && (
          <div className="space-y-4">
            <div>
              <label className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest pl-2 mb-2 block text-center">
                Peso Atual
              </label>
              <div className="relative">
                <input
                  type="number" step="0.1" value={weight}
                  onChange={e => setWeight(e.target.value)}
                  autoFocus placeholder="75.5"
                  className="w-full bg-surface-container border border-outline-variant/10 rounded-[2rem] px-5 py-10 text-6xl font-black text-center text-[#00677f] placeholder:text-outline/30 focus:outline-none focus:border-secondary-container focus:ring-4 focus:ring-secondary-container/20 shadow-inner transition-all"
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-outline uppercase">KG</span>
              </div>
            </div>

            <div>
              <label className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest pl-2 mb-2 block">
                Notas (opcional)
              </label>
              <textarea
                rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Acordei em jejum, após WC..."
                className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-4 font-medium text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button type="button" onClick={() => setActiveTab('measures')}
              className="w-full py-3 border border-dashed border-[#00677f]/40 rounded-2xl text-[#00677f] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#00677f]/5 transition-colors">
              <span className="material-symbols-outlined">straighten</span>
              Adicionar medidas corporais
            </button>
          </div>
        )}

        {/* Tab: Medidas */}
        {activeTab === 'measures' && (
          <div className="space-y-4">
            <div className="bg-[#1a7f64]/10 border border-[#1a7f64]/20 rounded-2xl px-4 py-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-[#1a7f64] text-lg flex-shrink-0 mt-0.5">info</span>
              <p className="text-[#1a7f64] text-xs font-bold">Todos os campos são opcionais. Preenche apenas o que mediste.</p>
            </div>

            {METRIC_GROUPS.map(group => (
              <div key={group.group} className="bg-surface-container-low rounded-[2rem] p-5 border border-outline-variant/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-3">
                  {group.group}
                </p>
                {group.fields.map(field => (
                  <MetricField
                    key={field.key}
                    field={field}
                    value={metrics[field.key] ?? ''}
                    onChange={setMetric}
                  />
                ))}
              </div>
            ))}

            <div>
              <label className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest pl-2 mb-2 block">
                Notas (opcional)
              </label>
              <textarea
                rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Medido em jejum, manhã..."
                className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-3 font-medium text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20">
            {error}
          </div>
        )}

        {/* Resumo do que vai guardar */}
        {canSave && (
          <div className="bg-surface-container rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">save</span>
            <p className="text-primary text-xs font-bold">
              A guardar:{' '}
              {hasWeight && <span>peso ({weight} kg){filledMetrics > 0 ? ' + ' : ''}</span>}
              {filledMetrics > 0 && <span>{filledMetrics} medida{filledMetrics !== 1 ? 's' : ''}</span>}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !canSave}
          className="w-full py-5 bg-secondary-container text-on-secondary-container rounded-full font-black text-xl uppercase tracking-wider shadow-[0_8px_32px_rgba(0,204,249,0.3)] active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading
            ? 'A Guardar...'
            : <><span className="material-symbols-outlined">save</span>Guardar Evolução</>
          }
        </button>
      </form>
    </div>
  );
}
