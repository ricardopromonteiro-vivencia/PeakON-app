-- ============================================================
-- ACESSO DE PT + SUSPENSÃO - PeakON
-- Executa este script no Supabase SQL Editor
-- ============================================================

-- 1. Alargar o check de role para incluir 'admin'
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('pt', 'client', 'admin'));

-- 2. Adicionar coluna status a users (ativo / suspenso)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'suspended'));

-- 3. Tabela de códigos de acesso para PT
--    O admin gera um código único que o PT usa no registo
CREATE TABLE IF NOT EXISTS public.pt_access_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL UNIQUE,
  email        TEXT,                          -- email pré-definido pelo admin (opcional)
  created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  used_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  used_at      TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,                   -- NULL = sem expiração
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para pt_access_codes
ALTER TABLE public.pt_access_codes ENABLE ROW LEVEL SECURITY;

-- Admin pode gerir todos os códigos
CREATE POLICY "admin_manage_pt_codes" ON public.pt_access_codes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Qualquer pessoa autenticada pode ler (para validar no registo)
-- mas só se ainda não foi usado
CREATE POLICY "anyone_read_unused_code" ON public.pt_access_codes
  FOR SELECT
  USING (used_at IS NULL);

-- 4. Atualizar o trigger handle_new_user para:
--    a) validar o código de acesso do PT
--    b) marcar o código como usado
--    c) bloquear registo de PT sem código válido
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  cli_id      UUID := NULL;
  v_role      TEXT := COALESCE(new.raw_user_meta_data->>'role', 'pt');
  v_pt_code   TEXT := new.raw_user_meta_data->>'pt_access_code';
  v_inv_code  TEXT := new.raw_user_meta_data->>'invite_code';
  code_row    RECORD;
BEGIN
  -- Validar código de acesso para PT
  IF v_role = 'pt' THEN
    IF v_pt_code IS NULL OR v_pt_code = '' THEN
      RAISE EXCEPTION 'Código de acesso de PT obrigatório.';
    END IF;

    SELECT * INTO code_row
    FROM public.pt_access_codes
    WHERE code = v_pt_code
      AND used_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Código de acesso inválido ou já utilizado.';
    END IF;
  END IF;

  -- Para alunos: encontrar o cliente pelo invite_code
  IF v_role = 'client' AND v_inv_code IS NOT NULL THEN
    SELECT id INTO cli_id
    FROM public.clients
    WHERE invite_code = v_inv_code
    LIMIT 1;

    IF cli_id IS NOT NULL THEN
      UPDATE public.clients
      SET is_registered = true
      WHERE id = cli_id;
    END IF;
  END IF;

  -- Inserir utilizador
  INSERT INTO public.users (id, email, role, linked_client_id)
  VALUES (new.id, new.email, v_role, cli_id);

  -- Marcar código de PT como usado
  IF v_role = 'pt' AND code_row IS NOT NULL THEN
    UPDATE public.pt_access_codes
    SET used_by = new.id, used_at = now()
    WHERE id = code_row.id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Policy para admin poder atualizar status de users (suspensão)
--    (já existe users_update que permite admin UPDATE, mas garantir explicitamente)
DROP POLICY IF EXISTS "admin_suspend_users" ON public.users;
CREATE POLICY "admin_suspend_users" ON public.users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- GUIA: Configurar Email no Supabase
-- ============================================================
-- 1. Vai a: Supabase Dashboard → Authentication → Providers → Email
--    - Enable Email provider: ON
--    - Confirm email: ON  ← ativa confirmação obrigatória
--    - Secure email change: ON
--
-- 2. Para SMTP personalizado (recomendado para produção):
--    Vai a: Authentication → Settings → SMTP Settings
--    Preenche com as credenciais do teu serviço de email.
--    Recomendações:
--      - Resend (resend.com) — grátis até 3000 emails/mês
--      - SendGrid — grátis até 100 emails/dia
--
--    Exemplo com Resend:
--      Host: smtp.resend.com
--      Port: 587
--      Username: resend
--      Password: <API Key do Resend>
--      Sender email: noreply@peakon.app  (ou outro domínio verificado)
--
-- 3. Personalizar templates dos emails:
--    Vai a: Authentication → Email Templates
--    - Confirm signup → personaliza o assunto e corpo em português
--    - Reset password → personaliza em português
--
--    Exemplo de assunto (Confirm signup):
--      "Confirma o teu registo no PeakON"
--
--    Exemplo de corpo:
--      <h2>Bem-vindo ao PeakON!</h2>
--      <p>Clica no botão abaixo para confirmar o teu email.</p>
--      <a href="{{ .ConfirmationURL }}">Confirmar Email</a>
-- ============================================================
