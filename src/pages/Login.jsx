import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [tab, setTab] = useState('pt'); // 'pt', 'aluno'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e, type) => {
    e.preventDefault();
    setLoading(true);
    let error;
    
    if (type === 'login') {
      const resp = await supabase.auth.signInWithPassword({ email, password });
      error = resp.error;
    } else {
      const options = { data: {} };
      if (tab === 'aluno') {
        if (!inviteCode.trim()) {
          alert('Por favor insere o código dado pelo teu PT.');
          setLoading(false);
          return;
        }
        options.data.role = 'client';
        options.data.invite_code = inviteCode.trim();
      }
      
      const resp = await supabase.auth.signUp({ email, password, options });
      error = resp.error;
    }

    if (error) {
      alert(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-surface-container-low px-6 max-w-md mx-auto">
      <div className="w-24 h-24 bg-primary text-on-primary rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/20">
        <span className="material-symbols-outlined text-5xl">barbell</span>
      </div>
      <h1 className="text-4xl font-black text-primary mb-2 font-headline tracking-tighter">PeakON</h1>
      <p className="text-on-surface-variant font-medium text-center mb-10">A gestão profissional do teu negócio de Personal Training.</p>

      <div className="flex bg-surface-container rounded-full p-1 mb-8 w-full">
        <button 
          onClick={() => setTab('pt')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-full transition-colors ${tab === 'pt' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          Sou Profissional
        </button>
        <button 
          onClick={() => setTab('aluno')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-full transition-colors ${tab === 'aluno' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          Sou Aluno
        </button>
      </div>

      <div className="w-full space-y-4 bg-surface p-6 rounded-[2rem] shadow-sm">
        {tab === 'aluno' && (
          <div className="mb-2">
            <label className="text-xs font-bold text-primary uppercase ml-4 mb-1 block">Código de Convite (Novo Aluno)</label>
            <input 
              type="text" 
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="Ex: PEAK-99X"
              className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium uppercase"
            />
          </div>
        )}
        <input 
          type="email" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email de acesso"
          className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
        />
        <input 
          type="password" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Palavra-passe"
          className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
        />
        
        <div className="pt-4 space-y-3">
          <button 
            onClick={(e) => handleAuth(e, 'login')}
            disabled={loading}
            className="w-full bg-primary text-on-primary rounded-full font-bold text-lg py-4 shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : 'Entrar'}
          </button>
          
          <button 
            onClick={(e) => handleAuth(e, 'signup')}
            disabled={loading}
            className="w-full bg-surface-container-high text-primary rounded-full font-bold text-lg py-4 active:scale-95 transition-transform disabled:opacity-50"
          >
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}
