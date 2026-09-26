import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { addClient } from '../lib/api';

export default function AddClient() {
  const { userProfile } = useAppStore(); // Para user id correto
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      // Gera um codigo no formato PK-XXXX
      const genCode = 'PK-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const newClient = await addClient(userProfile.id, { name, goal, birth_date: birthDate || null, invite_code: genCode });
      setSuccessData({ id: newClient.id, code: genCode });
    } catch (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  if (successData) {
    const shareUrl = `${window.location.origin}/login`;
    const shareText = `Olá! 👋 O teu Personal Trainer criou o teu perfil no PeakON. 🚀\n\nLink da App: ${shareUrl}\nO teu Código de Acesso: *${successData.code}*\n\nBora treinar! 🔥`;
    
    const handleCopy = () => {
      navigator.clipboard.writeText(successData.code);
      alert('Código copiado para a área de transferência! ✅');
    };

    const handleWhatsApp = () => {
      const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank');
    };

    return (
      <div className="space-y-6 flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-primary text-on-primary rounded-[2.5rem] flex items-center justify-center mb-6 shadow-[0_20px_50px_rgba(0,19,89,0.3)] rotate-12">
          <span className="material-symbols-outlined text-4xl">celebration</span>
        </div>
        <h2 className="text-4xl font-black text-primary font-headline tracking-tighter leading-tight">Aluno Criado<br/>com Sucesso!</h2>
        <p className="text-on-surface-variant font-medium mt-2 max-w-xs text-sm">Envia o código e link da app ao teu aluno para ele começar hoje mesmo.</p>
        
        <div className="w-full bg-surface-container-high p-6 rounded-[2rem] my-4 border border-primary/10 shadow-inner relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3">
             <span className="material-symbols-outlined text-primary/10 text-6xl -rotate-12 group-hover:rotate-0 transition-transform duration-500">key</span>
          </div>
          <span className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Código de Acesso</span>
          <span className="text-5xl font-black text-primary tracking-[0.2em] font-headline">{successData.code}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button 
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 bg-surface-container border border-outline-variant/30 py-4 rounded-2xl font-bold text-primary active:scale-95 transition-all hover:bg-primary-fixed"
          >
            <span className="material-symbols-outlined text-xl">content_copy</span>
            Copiar
          </button>
          <button 
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-[#25d366]/20"
          >
            <span className="material-symbols-outlined text-xl">share</span>
            WhatsApp
          </button>
        </div>

        <button 
          onClick={() => navigate(`/client/${successData.id}`, { replace: true })}
          className="w-full bg-primary text-on-primary py-5 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-2"
        >
          Ir para o Perfil
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform border border-outline-variant/20 shadow-sm">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-3xl font-black text-primary font-headline tracking-tighter">Novo Aluno</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-8">
        <div>
          <label className="text-on-surface-variant text-xs font-black uppercase tracking-widest pl-2 mb-2 block">Nome (Obrigatório)</label>
          <input 
            type="text" 
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Lucas Andrade"
            className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-5 text-xl font-bold text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
          />
        </div>

        <div>
          <label className="text-on-surface-variant text-xs font-black uppercase tracking-widest pl-2 mb-2 block">Data de Nascimento (Opcional)</label>
          <input 
            type="date" 
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-5 text-xl font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all uppercase"
          />
        </div>

        <div>
          <label className="text-on-surface-variant text-xs font-black uppercase tracking-widest pl-2 mb-2 block">Foco Principal (Opcional)</label>
          <input 
            type="text" 
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="Ex: Hipertrofia MMII"
            className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-5 text-xl font-bold text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !name}
          className="fixed bottom-28 left-6 right-6 md:left-[calc(50%-12rem+1.5rem)] md:right-[calc(50%-12rem+1.5rem)] py-4 bg-primary text-on-primary rounded-full font-black text-lg uppercase tracking-wider shadow-[0_8px_32px_rgba(0,19,89,0.3)] active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 z-50 flex items-center justify-center gap-2"
        >
          {loading ? 'A Guardar...' : <><span className="material-symbols-outlined font-black">person_add</span>Adicionar</>}
        </button>
      </form>
    </div>
  );
}
