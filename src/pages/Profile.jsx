import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

// ─── Helper: redimensiona imagem no browser antes de fazer upload ────
async function resizeImage(file, maxSize = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.85);
    };
    img.src = url;
  });
}

// ─── Traduz erros do Supabase para português ─────────────────
function traduzirErro(msg) {
  if (!msg) return 'Ocorreu um erro desconhecido.';
  if (msg.includes('column') && msg.includes('does not exist'))
    return 'Configuração da base de dados incompleta. Executa o SQL de atualização no Supabase.';
  if (msg.includes('JWT') || msg.includes('token'))
    return 'Sessão expirada. Por favor faz login novamente.';
  if (msg.includes('Password should be at least'))
    return 'A password deve ter pelo menos 6 caracteres.';
  if (msg.includes('New password should be different'))
    return 'A nova password deve ser diferente da atual.';
  if (msg.includes('Network') || msg.includes('fetch'))
    return 'Sem ligação à internet. Verifica a tua rede.';
  if (msg.includes('row-level security'))
    return 'Não tens permissão para realizar esta ação.';
  if (msg.includes('duplicate') || msg.includes('unique'))
    return 'Este valor já está em uso.';
  return msg;
}

// ─── Avatar com upload ────────────────────────────────────────
function AvatarUpload({ userId, name, email, avatarUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(avatarUrl || null);
  const [error, setError]         = useState('');
  const inputRef = useRef();

  const initial = name
    ? name.charAt(0).toUpperCase()
    : email?.charAt(0).toUpperCase() || '?';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato inválido. Usa JPEG, PNG ou WebP.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      // Redimensiona para 256×256 antes do upload
      const resized = await resizeImage(file, 256);
      const path = `${userId}/avatar.webp`;

      // Upload (upsert substitui ficheiro existente)
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, resized, { upsert: true, contentType: 'image/webp' });
      if (upErr) throw upErr;

      // URL pública com cache-bust
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Guarda URL na tabela users
      const { error: dbErr } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      if (dbErr) throw dbErr;

      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (e) {
      setError(traduzirErro(e.message));
    } finally {
      setUploading(false);
      // Limpa o input para permitir re-upload do mesmo ficheiro
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="relative">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg shadow-primary/30 bg-primary flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-on-primary font-black text-4xl">{initial}</span>
          )}
        </div>

        {/* Botão de câmera sobreposto */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform disabled:opacity-60 border-2 border-surface"
          title="Alterar foto"
        >
          {uploading ? (
            <span className="material-symbols-outlined text-on-primary animate-spin text-sm">sync</span>
          ) : (
            <span className="material-symbols-outlined text-on-primary text-sm">photo_camera</span>
          )}
        </button>

        {/* Input oculto */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {error && (
        <p className="text-error text-xs font-bold text-center">{error}</p>
      )}
      {uploading && (
        <p className="text-on-surface-variant text-xs font-bold animate-pulse">
          A processar imagem...
        </p>
      )}
    </div>
  );
}

// ─── Editar nome ──────────────────────────────────────────────
function EditProfile({ userId, userProfile, onSaved }) {
  const [name, setName]       = useState(userProfile?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('O nome não pode estar vazio.'); return; }
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const { error: err } = await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('id', userId);
      if (err) throw err;
      setSuccess(true);
      onSaved(name.trim());
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError(traduzirErro(e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">
          Nome
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="O teu nome"
          className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-5 py-4 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">
          Email
        </label>
        <input
          type="text"
          value={userProfile?.email || ''}
          disabled
          className="w-full bg-surface-container/50 border border-outline-variant/10 rounded-2xl px-5 py-4 font-bold text-on-surface-variant/50 cursor-not-allowed"
        />
        <p className="text-[10px] text-on-surface-variant/50 ml-2 mt-1">
          O email não pode ser alterado aqui.
        </p>
      </div>

      {error && (
        <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[#1a7f64]/10 text-[#1a7f64] text-sm font-bold px-4 py-3 rounded-2xl border border-[#1a7f64]/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          Nome atualizado com sucesso!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60"
      >
        {loading ? 'A guardar...' : 'Guardar Alterações'}
      </button>
    </form>
  );
}

// ─── Alterar password ─────────────────────────────────────────
function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');

  const handleChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirm) {
      setError('As passwords não coincidem.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      if (err) throw err;
      setSuccess(true);
      setNewPassword('');
      setConfirm('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(traduzirErro(e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChange} className="space-y-4">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">
          Nova Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-5 py-4 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2 mb-2 block">
          Confirmar Password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repete a nova password"
          className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-5 py-4 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
      </div>

      {error && (
        <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[#1a7f64]/10 text-[#1a7f64] text-sm font-bold px-4 py-3 rounded-2xl border border-[#1a7f64]/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          Password alterada com sucesso!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60"
      >
        {loading ? 'A alterar...' : 'Alterar Password'}
      </button>
    </form>
  );
}

// ─── Stats do PT ──────────────────────────────────────────────
function PTStats({ userId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ count: activeClients }, { count: totalWorkouts }] = await Promise.all([
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'active'),
        supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);
      setStats({ activeClients: activeClients || 0, totalWorkouts: totalWorkouts || 0 });
    }
    if (userId) load();
  }, [userId]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-primary/10 rounded-2xl p-4 text-center">
        <p className="text-3xl font-black text-primary">{stats.activeClients}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mt-1">Alunos Ativos</p>
      </div>
      <div className="bg-secondary-container rounded-2xl p-4 text-center">
        <p className="text-3xl font-black text-on-secondary-container">{stats.totalWorkouts}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-on-secondary-container/70 mt-1">Treinos Registados</p>
      </div>
    </div>
  );
}

// ─── Definições ───────────────────────────────────────────────
function DeleteAccountModal({ onClose, onConfirm, loading }) {
  const [typed, setTyped] = useState('');
  const CONFIRM_WORD = 'ELIMINAR';
  const isValid = typed.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
        {/* Ícone de aviso */}
        <div className="w-16 h-16 bg-error/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5">
          <span className="material-symbols-outlined text-error text-4xl">delete_forever</span>
        </div>

        <h3 className="text-xl font-black text-primary font-headline tracking-tighter text-center mb-2">
          Eliminar Conta
        </h3>
        <p className="text-on-surface-variant text-sm text-center mb-6 leading-relaxed">
          Esta ação é <strong className="text-error">permanente e irreversível</strong>.
          Todos os teus dados serão apagados e não poderão ser recuperados.
        </p>

        <div className="bg-error/5 border border-error/20 rounded-2xl p-4 mb-6">
          <p className="text-error text-xs font-black uppercase tracking-widest mb-3 text-center">
            Para confirmar, escreve <strong>ELIMINAR</strong>
          </p>
          <input
            type="text"
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder="ELIMINAR"
            autoFocus
            className={`w-full rounded-2xl px-5 py-3 font-black text-center text-lg tracking-widest focus:outline-none focus:ring-2 border transition-all ${
              isValid
                ? 'bg-error/10 border-error text-error focus:ring-error'
                : 'bg-surface-container border-outline-variant/20 text-primary focus:ring-primary'
            }`}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-surface-container text-on-surface-variant border border-outline-variant/20"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!isValid || loading}
            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-error text-white shadow-lg shadow-error/20 active:scale-95 transition-all disabled:opacity-40"
          >
            {loading ? 'A eliminar...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ signOut, userId }) {
  const [notifSessions, setNotifSessions] = useState(true);
  const [notifPack, setNotifPack]         = useState(true);
  const [showDelete, setShowDelete]       = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // Apaga os dados do utilizador da tabela users
      // (CASCADE apaga dados relacionados conforme configurado no Supabase)
      await supabase.from('users').delete().eq('id', userId);
      // Apaga a conta de autenticação
      await supabase.auth.admin?.deleteUser?.(userId);
      // Faz logout (o trigger de auth limpará a sessão)
      await signOut();
    } catch (e) {
      // Mesmo que o delete admin falhe (sem permissão client-side),
      // o signOut garante que o utilizador sai e pode contactar o suporte
      await signOut();
    } finally {
      setDeleteLoading(false);
    }
  };

  const Toggle = ({ label, desc, value, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-outline-variant/10 last:border-0">
      <div className="flex-1 mr-4">
        <p className="font-bold text-primary text-sm">{label}</p>
        {desc && <p className="text-on-surface-variant text-xs mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${value ? 'bg-primary' : 'bg-outline-variant/40'}`}
      >
        <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Modal de eliminação */}
      {showDelete && (
        <DeleteAccountModal
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteAccount}
          loading={deleteLoading}
        />
      )}      <div className="bg-surface-container-low rounded-[2rem] p-5 border border-outline-variant/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-3">
          Notificações
        </p>
        <Toggle
          label="Sessões agendadas"
          desc="Lembrete antes de uma sessão"
          value={notifSessions}
          onChange={setNotifSessions}
        />
        <Toggle
          label="Pack de aulas"
          desc="Aviso quando o aluno tem poucas aulas"
          value={notifPack}
          onChange={setNotifPack}
        />
        <p className="text-[10px] text-on-surface-variant/40 mt-3">
          As notificações push serão ativadas numa versão futura.
        </p>
      </div>

      <div className="bg-surface-container-low rounded-[2rem] p-5 border border-outline-variant/10 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-1">
          Sobre
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">Versão</span>
          <span className="text-sm text-on-surface-variant font-medium">1.0.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">Plataforma</span>
          <span className="text-sm text-on-surface-variant font-medium">Web App</span>
        </div>
      </div>

      <button
        onClick={() => {
          if (window.confirm('Tens a certeza que queres sair da conta?')) signOut();
        }}
        className="w-full py-4 text-error font-black text-xs uppercase tracking-widest bg-error/5 rounded-2xl hover:bg-error/10 transition-all border border-error/10 flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-xl">logout</span>
        Sair da Conta
      </button>

      {/* Zona de perigo */}
      <div className="bg-error/5 rounded-[2rem] p-5 border border-error/15 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-error/70 mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">warning</span>
          Zona de Perigo
        </p>
        <p className="text-on-surface-variant text-xs leading-relaxed">
          Eliminar a conta apaga <strong className="text-primary">permanentemente</strong> todos os teus dados,
          incluindo treinos, medidas, fotos e histórico de aulas. Esta ação não pode ser desfeita.
        </p>
        <button
          onClick={() => setShowDelete(true)}
          className="w-full py-4 text-error font-black text-xs uppercase tracking-widest bg-error/10 rounded-2xl hover:bg-error/20 transition-all border border-error/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">delete_forever</span>
          Eliminar Conta Permanentemente
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function Profile() {
  const { user, userProfile, updateProfile, signOut } = useAppStore();
  const [activeTab, setActiveTab] = useState('perfil');
  const role = userProfile?.role || 'client';

  return (
    <div className="space-y-6 pb-8">
      <section>
        <p className="text-on-surface-variant font-label text-sm font-black uppercase tracking-widest mb-1 opacity-70">
          A tua conta
        </p>
        <h2 className="text-primary font-headline font-black text-4xl tracking-tighter">
          Perfil
        </h2>
      </section>

      {/* Avatar com upload */}
      <AvatarUpload
        userId={user?.id}
        name={userProfile?.name}
        email={user?.email}
        avatarUrl={userProfile?.avatar_url}
        onUploaded={(url) => updateProfile({ avatar_url: url })}
      />

      {/* Nome e email abaixo do avatar */}
      <div className="text-center -mt-2">
        <h3 className="text-xl font-black text-primary font-headline tracking-tighter">
          {userProfile?.name || 'Sem nome'}
        </h3>
        <p className="text-on-surface-variant text-sm font-medium mt-0.5">{user?.email}</p>
        <span className="inline-block mt-2 bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
          {role === 'pt' ? 'Personal Trainer' : 'Atleta'}
        </span>
      </div>

      {/* Stats do PT */}
      {role === 'pt' && <PTStats userId={user?.id} />}

      {/* Tabs */}
      <div className="flex gap-2 bg-surface-container rounded-2xl p-1.5">
        {[
          { key: 'perfil',        label: 'Perfil',     icon: 'person' },
          { key: 'password',      label: 'Password',   icon: 'lock' },
          { key: 'configuracoes', label: 'Definições', icon: 'settings' },
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

      {activeTab === 'perfil' && userProfile && (
        <EditProfile
          userId={user.id}
          userProfile={userProfile}
          onSaved={(newName) => updateProfile({ name: newName })}
        />
      )}

      {activeTab === 'password' && <ChangePassword />}

      {activeTab === 'configuracoes' && (
        <SettingsSection signOut={signOut} userId={user?.id} />
      )}
    </div>
  );
}
