import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CONTACT_EMAIL = 'peakon.app@gmail.com';
const APP_URL       = 'https://peakon-app.netlify.app';

// ─── Botão de instalação PWA ──────────────────────────────────
function InstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled]           = useState(false);
  const [installing, setInstalling]         = useState(false);

  useEffect(() => {
    // Captura o evento beforeinstallprompt (Chrome/Android)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detecta se já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
    setInstalling(false);
  };

  const canInstall = !!deferredPrompt && !installed;

  return (
    <div className={`rounded-[2rem] p-6 text-center flex flex-col items-center gap-4 border-2 ${
      installed
        ? 'bg-[#1a7f64]/10 border-[#1a7f64]/30'
        : canInstall
          ? 'bg-primary border-primary shadow-lg shadow-primary/20'
          : 'bg-surface-container-low border-outline-variant/20'
    }`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
        installed ? 'bg-[#1a7f64]/20' : canInstall ? 'bg-on-primary/10' : 'bg-primary/10'
      }`}>
        <span className={`material-symbols-outlined text-3xl ${
          installed ? 'text-[#1a7f64]' : canInstall ? 'text-on-primary' : 'text-primary'
        }`}>
          {installed ? 'check_circle' : 'install_mobile'}
        </span>
      </div>

      <div>
        <h3 className={`text-lg font-black font-headline tracking-tighter ${
          canInstall ? 'text-on-primary' : 'text-primary'
        }`}>
          {installed ? 'App Instalada!' : 'Instalar Aplicação'}
        </h3>
        <p className={`text-sm mt-1 leading-relaxed ${
          canInstall ? 'text-on-primary/80' : 'text-on-surface-variant'
        }`}>
          {installed
            ? 'A PeakON já está instalada no teu dispositivo.'
            : 'Instala a app no teu telemóvel para um acesso mais rápido.'}
        </p>
      </div>

      {canInstall && (
        <button
          onClick={handleInstall}
          disabled={installing}
          className="w-full bg-on-primary text-primary rounded-2xl py-3 font-black text-sm uppercase tracking-widest active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
        >
          <span className="material-symbols-outlined text-xl">download</span>
          {installing ? 'A instalar...' : 'Instalar Agora'}
        </button>
      )}

      {!canInstall && !installed && (
        <p className="text-on-surface-variant/60 text-xs text-center leading-relaxed">
          Já podes instalar através do menu do teu navegador (Chrome/Safari).
          Vê as instruções abaixo para o teu dispositivo.
        </p>
      )}
    </div>
  );
}

// ─── Secção expansível ────────────────────────────────────────
function Section({ icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left active:bg-surface-container transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
          </div>
          <h3 className="font-black text-primary text-sm uppercase tracking-widest">{title}</h3>
        </div>
        <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-outline-variant/10 space-y-3 text-on-surface-variant text-sm leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
      <span>{children}</span>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function Help() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)}
          className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform flex-shrink-0">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <p className="text-on-surface-variant text-sm font-black uppercase tracking-widest opacity-70">Suporte</p>
          <h2 className="text-primary font-headline font-black text-3xl tracking-tighter leading-tight">Ajuda &amp; Suporte</h2>
        </div>
      </div>

      <p className="text-on-surface-variant text-sm">Tudo o que precisas de saber sobre a aplicação PeakON.</p>

      {/* 3 cards principais */}
      <div className="space-y-4">
        {/* Apoio ao utilizador */}
        <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">mail</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-primary font-headline tracking-tighter">Apoio ao Utilizador</h3>
            <p className="text-on-surface-variant text-sm mt-1">
              Tens alguma dúvida ou encontraste um problema? Envia-nos um email:
            </p>
          </div>
          <a href={`mailto:${CONTACT_EMAIL}`}
            className="bg-primary/10 text-primary font-black text-sm px-5 py-2.5 rounded-2xl hover:bg-primary/20 transition-colors active:scale-95">
            {CONTACT_EMAIL}
          </a>
        </div>

        {/* Instalar app — card de destaque com botão automático */}
        <InstallCard />

        {/* Como instalar no telemóvel */}
        <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-3xl">smartphone</span>
            </div>
            <h3 className="text-lg font-black text-primary font-headline tracking-tighter">Como Instalar no Telemóvel</h3>
          </div>

          {/* Android */}
          <div>
            <p className="font-black text-primary text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">android</span>
              Android (Chrome)
            </p>
            <div className="space-y-2">
              <Step n="1">Abre o <strong>Chrome</strong> e acede ao site <span className="text-primary font-bold">{APP_URL}</span></Step>
              <Step n="2">Clica nos <strong>3 pontos verticais</strong> no topo direito.</Step>
              <Step n="3">Seleciona <strong>"Instalar aplicação"</strong> ou <strong>"Adicionar ao ecrã principal"</strong>.</Step>
              <Step n="4">Confirma a instalação. A app aparece no teu ecrã como qualquer outra aplicação.</Step>
            </div>
          </div>

          <div className="h-px bg-outline-variant/20" />

          {/* iPhone */}
          <div>
            <p className="font-black text-primary text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">phone_iphone</span>
              iPhone / iOS (Safari)
            </p>
            <div className="space-y-2">
              <Step n="1">Abre o <strong>Safari</strong> e acede ao site <span className="text-primary font-bold">{APP_URL}</span></Step>
              <Step n="2">Clica no botão de <strong>Partilha</strong> (ícone com seta para cima, na barra inferior).</Step>
              <Step n="3">Desliza para baixo e clica em <strong>"Adicionar ao Ecrã Principal"</strong>.</Step>
              <Step n="4">Confirma o nome e clica em <strong>"Adicionar"</strong>. A app fica no teu ecrã inicial.</Step>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Perguntas Frequentes</p>

        <Section icon="lock_reset" title="Esqueci a minha palavra-passe">
          <p>Na página de login, clica em <strong className="text-primary">"Esqueceste a palavra-passe?"</strong> e insere o teu email. Receberás um link para criar uma nova palavra-passe.</p>
          <p>Se não receberes o email, verifica a pasta de spam ou contacta-nos em <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-bold">{CONTACT_EMAIL}</a>.</p>
        </Section>

        <Section icon="key" title="Não tenho código de convite (aluno)">
          <p>O código de convite é gerado pelo teu Personal Trainer quando cria o teu perfil na app.</p>
          <p>Contacta o teu PT para que te envie o código. Cada código só pode ser usado uma vez.</p>
        </Section>

        <Section icon="person_add" title="Sou PT e quero registar-me">
          <p>Para te registares como Personal Trainer precisas de um <strong className="text-primary">código de acesso</strong> fornecido pelo administrador da plataforma.</p>
          <p>Contacta-nos em <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-bold">{CONTACT_EMAIL}</a> para receberes o teu código.</p>
        </Section>

        <Section icon="confirmation_number" title="Como funcionam os packs de aulas">
          <p>O teu PT cria um pack com um número de aulas definido. Cada vez que realizas uma sessão, o PT desconta uma aula do teu saldo.</p>
          <p>Podes ver o teu saldo atual e o histórico completo na tab <strong className="text-primary">Pack</strong> do teu dashboard.</p>
          <p>Se as aulas não forem todas usadas num ciclo e o pack estiver com renovação automática, o saldo acumula para o próximo ciclo.</p>
        </Section>

        <Section icon="notifications_off" title="Não estou a receber notificações">
          <p>As notificações push estão atualmente em desenvolvimento e serão ativadas numa versão futura da app.</p>
          <p>Para já, verifica regularmente a app para acompanhar as atualizações do teu PT.</p>
        </Section>

        <Section icon="delete_forever" title="Como elimino a minha conta">
          <p>Vai a <strong className="text-primary">Perfil → Definições → Zona de Perigo</strong> e clica em <strong>"Eliminar Conta Permanentemente"</strong>.</p>
          <p>Terás de escrever <strong className="text-primary">ELIMINAR</strong> para confirmar. Esta ação é irreversível e apaga todos os teus dados.</p>
        </Section>
      </div>

      {/* Rodapé */}
      <div className="bg-primary rounded-[2rem] p-6 text-center space-y-2">
        <span className="material-symbols-outlined text-on-primary text-3xl block">support_agent</span>
        <p className="text-on-primary font-black text-sm uppercase tracking-widest">Ainda precisas de ajuda?</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-on-primary/80 text-sm font-bold underline">
          {CONTACT_EMAIL}
        </a>
        <p className="text-on-primary/50 text-[10px] mt-2">© {new Date().getFullYear()} PeakON · Todos os direitos reservados</p>
      </div>
    </div>
  );
}
