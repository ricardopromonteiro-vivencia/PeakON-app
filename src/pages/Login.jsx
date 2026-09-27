import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// ─── Logo PeakON (substitui BARBELL) ─────────────────────────
function PeakONLogo({ size = 'lg' }) {
  const dim = size === 'sm' ? 'w-16 h-16' : 'w-24 h-24';
  const txt = size === 'sm' ? 'text-2xl' : 'text-4xl';
  return (
    <div className={`${dim} bg-primary text-on-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 flex-shrink-0`}>
      <span className={`font-headline font-black ${txt} tracking-tighter leading-none`}>P</span>
    </div>
  );
}

// ─── Tradução de erros do Supabase ───────────────────────────
function traduzir(msg = '') {
  if (msg.includes('Invalid login credentials'))    return 'Email ou palavra-passe incorretos.';
  if (msg.includes('User already registered'))      return 'Este email já está registado. Usa a opção "Entrar".';
  if (msg.includes('Password should be at least'))  return 'A palavra-passe deve ter pelo menos 6 caracteres.';
  if (msg.includes('Anonymous sign-ins are disabled')) return 'Preenche o email e a palavra-passe para continuar.';
  if (msg.includes('Email not confirmed'))          return 'Email ainda não confirmado. Verifica a tua caixa de entrada.';
  if (msg.includes('código de acesso'))             return msg; // já em PT (vem do trigger)
  if (msg.includes('inválido ou já utilizado'))     return 'Código de acesso inválido ou já utilizado.';
  if (msg.includes('obrigatório'))                  return msg;
  if (msg.includes('Network') || msg.includes('fetch')) return 'Sem ligação à internet.';
  return msg;
}

// ─── Ecrã: email de confirmação enviado ──────────────────────
function EmailConfirmationSent({ email, onBack }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-surface-container-low px-6 max-w-md mx-auto text-center">
      <div className="w-20 h-20 bg-[#1a7f64]/10 rounded-[2rem] flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[#1a7f64] text-4xl">mark_email_read</span>
      </div>
      <h2 className="text-3xl font-black text-primary font-headline tracking-tighter mb-3">
        Confirma o teu Email
      </h2>
      <p className="text-on-surface-variant text-sm leading-relaxed mb-2">
        Enviámos um email de confirmação para:
      </p>
      <p className="text-primary font-black text-sm mb-5 bg-primary/10 px-4 py-2 rounded-full">
        {email}
      </p>
      <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
        Clica no link que recebeste para ativar a tua conta. Só depois conseguirás entrar na app.
      </p>
      <div className="bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-2xl px-4 py-3 mb-8 text-left w-full">
        <p className="text-[#b87516] text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">info</span>
          Não recebeste o email? Verifica a pasta de spam ou tenta novamente.
        </p>
      </div>
      <button
        onClick={onBack}
        className="w-full bg-primary text-on-primary rounded-full font-bold text-lg py-4 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
      >
        Voltar ao Login
      </button>
    </div>
  );
}

// ─── Ecrã: recuperação de password ───────────────────────────
function ForgotPassword({ onBack }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Por favor insere o teu email.'); return; }
    setLoading(true);
    setError('');
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (!userRow) {
        setError('Este email não está registado. Verifica o endereço e tenta novamente.');
        setLoading(false);
        return;
      }

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/profile` }
      );
      if (resetErr) throw resetErr;
      setSent(true);
    } catch {
      setError('Ocorreu um erro. Tenta novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-surface-container-low px-6 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-[#1a7f64]/10 rounded-[2rem] flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[#1a7f64] text-4xl">mark_email_read</span>
        </div>
        <h2 className="text-3xl font-black text-primary font-headline tracking-tighter mb-3">Email Enviado!</h2>
        <p className="text-on-surface-variant text-sm mb-2">Enviámos um link de recuperação para:</p>
        <p className="text-primary font-black text-sm mb-6 bg-primary/10 px-4 py-2 rounded-full">{email}</p>
        <p className="text-on-surface-variant/70 text-xs mb-8">Verifica a tua caixa de entrada e a pasta de spam. O link expira em 1 hora.</p>
        <button onClick={onBack} className="w-full bg-primary text-on-primary rounded-full font-bold text-lg py-4 shadow-lg shadow-primary/20 active:scale-95 transition-transform">
          Voltar ao Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-surface-container-low px-6 max-w-md mx-auto">
      <div className="w-full mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-primary font-bold text-sm active:scale-95 transition-transform">
          <span className="material-symbols-outlined">arrow_back</span> Voltar ao Login
        </button>
      </div>
      <div className="w-20 h-20 bg-primary text-on-primary rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-primary/20">
        <span className="material-symbols-outlined text-4xl">lock_reset</span>
      </div>
      <h2 className="text-3xl font-black text-primary font-headline tracking-tighter mb-2 text-center">Recuperar Password</h2>
      <p className="text-on-surface-variant text-sm text-center mb-8">Insere o email da tua conta e enviamos um link para criares uma nova palavra-passe.</p>
      <form onSubmit={handleReset} className="w-full space-y-4 bg-surface p-6 rounded-[2rem] shadow-sm">
        <input
          type="email" value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          placeholder="o-teu@email.com" autoFocus
          className={`w-full bg-surface-container border rounded-2xl px-5 py-4 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 transition-all font-medium ${error ? 'border-error focus:ring-error/20' : 'border-outline-variant/30 focus:border-primary focus:ring-primary/20'}`}
        />
        {error && (
          <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20 flex items-start gap-2">
            <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}
        <button type="submit" disabled={loading || !email.trim()}
          className="w-full bg-primary text-on-primary rounded-full font-bold text-lg py-4 shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><span className="material-symbols-outlined animate-spin text-xl">sync</span>A verificar...</> : <><span className="material-symbols-outlined text-xl">send</span>Enviar Link</>}
        </button>
      </form>
    </div>
  );
}

// ─── Ecrã de login principal ──────────────────────────────────
export default function Login() {
  const [tab, setTab]               = useState('pt');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [ptAccessCode, setPtAccessCode] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const navigate = useNavigate();

  if (showForgot) return <ForgotPassword onBack={() => setShowForgot(false)} />;
  if (signupDone) return <EmailConfirmationSent email={email} onBack={() => { setSignupDone(false); setEmail(''); setPassword(''); setPtAccessCode(''); setInviteCode(''); }} />;

  const handleAuth = async (e, type) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Preenche o email e a palavra-passe para continuar.');
      return;
    }
    setLoading(true);
    setError('');

    if (type === 'login') {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authErr) { setError(traduzir(authErr.message)); }
      else { navigate('/'); }
    } else {
      // Signup
      const options = { data: {} };

      if (tab === 'pt') {
        if (!ptAccessCode.trim()) {
          setError('Insere o código de acesso fornecido pelo administrador.');
          setLoading(false);
          return;
        }
        options.data.role = 'pt';
        options.data.pt_access_code = ptAccessCode.trim().toUpperCase();
      }

      if (tab === 'aluno') {
        if (!inviteCode.trim()) {
          setError('Insere o código de convite fornecido pelo teu PT.');
          setLoading(false);
          return;
        }
        options.data.role = 'client';
        options.data.invite_code = inviteCode.trim();
      }

      const { error: authErr } = await supabase.auth.signUp({ email: email.trim(), password, options });
      if (authErr) {
        setError(traduzir(authErr.message));
      } else {
        // Registo bem-sucedido — mostra ecrã de confirmação de email
        setSignupDone(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-surface-container-low px-6 max-w-md mx-auto">
      {/* Logo PeakON */}
      <PeakONLogo />
      <h1 className="text-4xl font-black text-primary mt-6 mb-2 font-headline tracking-tighter">PeakON</h1>
      <p className="text-on-surface-variant font-medium text-center mb-10">A gestão profissional do teu negócio de Personal Training.</p>

      {/* Tabs */}
      <div className="flex bg-surface-container rounded-full p-1 mb-8 w-full">
        <button onClick={() => { setTab('pt'); setError(''); }}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-full transition-colors ${tab === 'pt' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
          Sou Profissional
        </button>
        <button onClick={() => { setTab('aluno'); setError(''); }}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-full transition-colors ${tab === 'aluno' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
          Sou Aluno
        </button>
      </div>

      <div className="w-full space-y-4 bg-surface p-6 rounded-[2rem] shadow-sm">
        {/* Código de convite — aluno */}
        {tab === 'aluno' && (
          <div>
            <label className="text-xs font-bold text-primary uppercase ml-4 mb-1 block">Código de Convite</label>
            <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)}
              placeholder="Ex: PK-XXXX"
              className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium uppercase" />
            <p className="text-[10px] text-on-surface-variant/60 ml-2 mt-1">Pedido pelo teu PT. Necessário apenas no registo.</p>
          </div>
        )}

        {/* Email */}
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
          placeholder="Email de acesso"
          className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />

        {/* Password */}
        <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
          placeholder="Palavra-passe"
          className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />

        {/* Código de acesso PT — só aparece ao criar conta como PT */}
        {tab === 'pt' && (
          <div>
            <label className="text-xs font-bold text-primary uppercase ml-4 mb-1 block">Código de Acesso (novo registo)</label>
            <input type="text" value={ptAccessCode} onChange={e => setPtAccessCode(e.target.value.toUpperCase())}
              placeholder="Fornecido pelo administrador"
              className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium uppercase tracking-widest" />
            <p className="text-[10px] text-on-surface-variant/60 ml-2 mt-1">Necessário apenas para criar conta. Não precisas deste campo para entrar.</p>
          </div>
        )}

        {/* Esqueceste a password */}
        <div className="flex justify-end -mt-1">
          <button type="button" onClick={() => setShowForgot(true)}
            className="text-xs font-bold text-primary/70 hover:text-primary transition-colors underline underline-offset-2">
            Esqueceste a palavra-passe?
          </button>
        </div>

        {/* Erros */}
        {error && (
          <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20 flex items-start gap-2">
            <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 space-y-3">
          <button onClick={(e) => handleAuth(e, 'login')} disabled={loading}
            className="w-full bg-primary text-on-primary rounded-full font-bold text-lg py-4 shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50">
            {loading ? 'Aguarde...' : 'Entrar'}
          </button>
          <button onClick={(e) => handleAuth(e, 'signup')} disabled={loading}
            className="w-full bg-surface-container-high text-primary rounded-full font-bold text-lg py-4 active:scale-95 transition-transform disabled:opacity-50">
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}
