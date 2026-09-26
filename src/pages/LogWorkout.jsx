import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { logWorkout } from '../lib/api';

export default function LogWorkout() {
  const { id } = useParams();
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState('Novo Treino');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await logWorkout(user.id, id, { title, notes, date: new Date().toISOString() });
      navigate(`/client/${id}`, { replace: true });
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform shadow-sm">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-3xl font-black text-primary font-headline tracking-tighter">Registar Treino</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-8 pb-32">
        <div className="bg-surface p-1 rounded-2xl">
          <label className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest pl-2 mb-2 block">Título da Sessão</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-5 text-xl font-bold text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
          />
        </div>
        
        <div>
          <label className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest pl-2 mb-2 block">Notas / Evolução</label>
          <textarea 
            rows="5"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Aumentou carga no agachamento (+5kg). Boa ativação de glúteo."
            className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-5 text-lg font-medium text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
          />
        </div>

        {/* Floating Save Button */}
        <button 
          type="submit" 
          disabled={loading || !title}
          className="w-full py-5 bg-primary text-on-primary rounded-full font-black text-xl uppercase tracking-wider shadow-[0_8px_32px_rgba(0,19,89,0.3)] active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'A Guardar...' : <><span className="material-symbols-outlined">task_alt</span>Concluir Treino</>}
        </button>
      </form>
    </div>
  );
}
