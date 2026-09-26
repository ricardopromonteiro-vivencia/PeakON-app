import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { logProgress } from '../lib/api';

export default function LogProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight) return;
    setLoading(true);
    try {
      await logProgress(id, { weight: parseFloat(weight) });
      navigate(`/client/${id}`, { replace: true });
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-3xl font-black text-primary font-headline tracking-tighter">Registar Peso</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-8 pb-32">
        <div>
          <label className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest pl-2 mb-2 block text-center">Peso Atual</label>
          <div className="relative mb-8">
            <input 
              type="number" 
              step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              autoFocus
              placeholder="75.5"
              className="w-full bg-surface-container border border-outline-variant/10 rounded-[2rem] px-5 py-10 text-6xl font-black text-center text-[#00677f] placeholder:text-outline/30 focus:outline-none focus:border-secondary-container focus:ring-4 focus:ring-secondary-container/20 shadow-inner transition-all"
            />
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-outline uppercase">KG</span>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !weight}
          className="w-full py-5 bg-secondary-container text-on-secondary-container rounded-full font-black text-xl uppercase tracking-wider shadow-[0_8px_32px_rgba(0,204,249,0.3)] active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'A Guardar...' : <><span className="material-symbols-outlined">save</span>Guardar Peso</>}
        </button>
      </form>
    </div>
  );
}
