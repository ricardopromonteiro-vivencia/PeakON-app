import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LAST_UPDATED = '15 de setembro de 2026';
const APP_NAME     = 'PeakON';
const CONTACT_EMAIL = 'peakon.app@gmail.com';

// ─── Secção reutilizável ─────────────────────────────────────
function Section({ icon, title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left active:bg-surface-container transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
          </div>
          <h3 className="font-black text-primary text-sm uppercase tracking-widest leading-tight">{title}</h3>
        </div>
        <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 text-on-surface-variant text-sm leading-relaxed border-t border-outline-variant/10 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

function P({ children }) {
  return <p className="text-on-surface-variant text-sm leading-relaxed">{children}</p>;
}

function Li({ children }) {
  return (
    <li className="flex items-start gap-2">
      <span className="material-symbols-outlined text-primary text-sm mt-0.5 flex-shrink-0">arrow_right</span>
      <span>{children}</span>
    </li>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <p className="text-on-surface-variant text-sm font-black uppercase tracking-widest opacity-70">Legal</p>
          <h2 className="text-primary font-headline font-black text-3xl tracking-tighter leading-tight">
            Termos & Privacidade
          </h2>
        </div>
      </div>

      {/* Aviso de versão */}
      <div className="bg-primary/5 rounded-2xl px-4 py-3 flex items-center gap-3 border border-primary/10">
        <span className="material-symbols-outlined text-primary">info</span>
        <div>
          <p className="text-primary font-bold text-xs">Última atualização: {LAST_UPDATED}</p>
          <p className="text-on-surface-variant text-xs mt-0.5">
            Ao utilizar a app {APP_NAME} aceitas os termos aqui descritos.
          </p>
        </div>
      </div>

      {/* ── 1. Identificação ─────────────────────────────────── */}
      <Section icon="business" title="1. Identificação da Aplicação">
        <P>
          <strong className="text-primary">PeakON</strong> é uma aplicação web de gestão de treino pessoal,
          destinada a Personal Trainers (PT) e seus clientes, que permite registar sessões de treino,
          acompanhar a evolução física e gerir pacotes de aulas.
        </P>
        <P>
          Para questões legais ou de privacidade, contacta-nos através de{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-bold underline">{CONTACT_EMAIL}</a>.
        </P>
      </Section>

      {/* ── 2. Condições de Uso ───────────────────────────────── */}
      <Section icon="gavel" title="2. Condições de Utilização">
        <P>Ao criar uma conta na {APP_NAME}, confirmas que:</P>
        <ul className="space-y-2 mt-2">
          <Li>Tens 16 anos ou mais, ou tens autorização de um responsável legal.</Li>
          <Li>Os dados fornecidos são verdadeiros e atuais.</Li>
          <Li>Não utilizarás a app para fins ilegais ou que prejudiquem terceiros.</Li>
          <Li>Não tentarás aceder a dados de outros utilizadores sem autorização.</Li>
        </ul>
        <P>
          A {APP_NAME} reserva o direito de suspender contas que violem estes termos, sem aviso prévio.
        </P>
      </Section>

      {/* ── 3. Isenção de responsabilidade — atividade física ── */}
      <Section icon="warning" title="3. Isenção de Responsabilidade — Atividade Física">
        <div className="bg-error/5 border border-error/20 rounded-2xl p-4">
          <p className="text-error font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">priority_high</span>
            Aviso Importante
          </p>
          <P>
            A {APP_NAME} é uma plataforma de gestão e registo. <strong className="text-primary">Não substitui
            aconselhamento médico, fisioterapêutico ou nutricional.</strong>
          </P>
        </div>
        <P>
          A {APP_NAME} <strong className="text-primary">não se responsabiliza</strong> por quaisquer lesões,
          danos físicos, problemas de saúde ou outros prejuízos resultantes, direta ou indiretamente, da
          prática de exercício físico com base em planos ou registos feitos na plataforma.
        </P>
        <P>
          É da exclusiva responsabilidade do utilizador e do seu Personal Trainer:
        </P>
        <ul className="space-y-2">
          <Li>Avaliar a aptidão física antes de iniciar qualquer programa de treino.</Li>
          <Li>Consultar um médico em caso de condições de saúde pré-existentes.</Li>
          <Li>Ajustar a intensidade do treino de acordo com o estado de saúde.</Li>
          <Li>Parar imediatamente o exercício se sentir dores ou mal-estar.</Li>
        </ul>
        <P>
          O Personal Trainer é um profissional independente e autónomo. A {APP_NAME} não é responsável pela
          qualidade, adequação ou segurança dos planos de treino criados pelos PTs na plataforma.
        </P>
      </Section>

      {/* ── 4. Propriedade dos dados ──────────────────────────── */}
      <Section icon="database" title="4. Propriedade dos Dados">
        <P>
          Os dados introduzidos na {APP_NAME} (treinos, medidas, fotos, etc.) pertencem ao utilizador que
          os criou. A {APP_NAME} não vende nem partilha estes dados com terceiros para fins comerciais.
        </P>
        <P>
          Os dados são armazenados de forma segura na infraestrutura da{' '}
          <strong className="text-primary">Supabase</strong>, com servidores localizados na União Europeia,
          em conformidade com o RGPD.
        </P>
      </Section>

      {/* ── 5. RGPD / Privacidade ─────────────────────────────── */}
      <Section icon="shield" title="5. Proteção de Dados (RGPD)">
        <P>
          A {APP_NAME} cumpre o <strong className="text-primary">Regulamento Geral sobre a Proteção de Dados
          (RGPD — Regulamento UE 2016/679)</strong>.
        </P>

        <p className="font-black text-primary text-xs uppercase tracking-widest mt-2">Dados que recolhemos</p>
        <ul className="space-y-2">
          <Li>Email e password (para autenticação).</Li>
          <Li>Nome e foto de perfil (opcional, fornecidos pelo utilizador).</Li>
          <Li>Dados de treino: peso, medidas corporais, fotos de progresso, registos de sessões.</Li>
          <Li>Dados de pacotes de aulas: histórico de transações.</Li>
        </ul>

        <p className="font-black text-primary text-xs uppercase tracking-widest mt-4">Finalidade do tratamento</p>
        <ul className="space-y-2">
          <Li>Prestar o serviço de gestão de treino pessoal.</Li>
          <Li>Permitir a comunicação entre PT e aluno dentro da plataforma.</Li>
          <Li>Melhorar a experiência e funcionalidades da app.</Li>
        </ul>

        <p className="font-black text-primary text-xs uppercase tracking-widest mt-4">Os teus direitos</p>
        <ul className="space-y-2">
          <Li><strong>Acesso:</strong> podes consultar todos os dados que temos sobre ti.</Li>
          <Li><strong>Retificação:</strong> podes corrigir dados incorretos ou incompletos.</Li>
          <Li><strong>Eliminação:</strong> podes solicitar a eliminação da tua conta e dados ("direito ao esquecimento").</Li>
          <Li><strong>Portabilidade:</strong> podes solicitar os teus dados num formato legível por máquina.</Li>
          <Li><strong>Oposição:</strong> podes opor-te ao tratamento dos teus dados.</Li>
        </ul>

        <P>
          Para exercer qualquer destes direitos, envia um email para{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-bold underline">{CONTACT_EMAIL}</a>.
        </P>

        <p className="font-black text-primary text-xs uppercase tracking-widest mt-4">Retenção de dados</p>
        <P>
          Os dados são mantidos enquanto a conta estiver ativa. Após eliminação da conta, os dados pessoais
          são apagados num prazo máximo de 30 dias, exceto quando exigido por obrigação legal.
        </P>
      </Section>

      {/* ── 6. Cookies e rastreamento ─────────────────────────── */}
      <Section icon="cookie" title="6. Cookies e Rastreamento">
        <P>
          A {APP_NAME} utiliza apenas cookies técnicos essenciais para o funcionamento da autenticação
          (sessão de utilizador). <strong className="text-primary">Não utilizamos cookies de rastreamento,
          publicidade ou analytics de terceiros.</strong>
        </P>
      </Section>

      {/* ── 7. Alterações aos termos ──────────────────────────── */}
      <Section icon="edit_document" title="7. Alterações aos Termos">
        <P>
          A {APP_NAME} pode atualizar estes termos a qualquer momento. Alterações significativas serão
          comunicadas através da app. A continuação da utilização após notificação constitui aceitação dos
          novos termos.
        </P>
      </Section>

      {/* ── 8. Legislação aplicável ───────────────────────────── */}
      <Section icon="account_balance" title="8. Legislação Aplicável">
        <P>
          Estes termos são regidos pela lei portuguesa. Em caso de litígio, é competente o tribunal da
          comarca de Portugal. O utilizador pode ainda recorrer à{' '}
          <strong className="text-primary">CNPD — Comissão Nacional de Proteção de Dados</strong>{' '}
          (<a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.cnpd.pt</a>)
          para apresentar queixa relativa ao tratamento dos seus dados pessoais.
        </P>
      </Section>

      {/* Contacto */}
      <div className="bg-primary rounded-[2rem] p-6 text-center">
        <span className="material-symbols-outlined text-on-primary text-3xl mb-2 block">mail</span>
        <p className="text-on-primary font-black text-sm uppercase tracking-widest mb-1">Questões ou pedidos</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-on-primary/80 text-sm font-bold underline"
        >
          {CONTACT_EMAIL}
        </a>
      </div>
    </div>
  );
}
