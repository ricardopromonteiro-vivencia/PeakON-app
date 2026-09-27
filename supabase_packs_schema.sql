-- ============================================================
-- SISTEMA DE PACKS DE AULAS - PeakON
-- Executa este script no Supabase SQL Editor
-- ============================================================

-- Tabela: client_packs
-- Um pack ativo por aluno. Guarda configuração e saldo de aulas.
CREATE TABLE IF NOT EXISTS client_packs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pt_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Configuração do pack
  total_sessions  INT NOT NULL CHECK (total_sessions > 0),   -- Aulas por ciclo
  renewal_type    TEXT NOT NULL CHECK (renewal_type IN ('monthly', 'weekly', 'manual')),
  next_renewal_at TIMESTAMPTZ,   -- Data da próxima renovação automática (NULL se manual)

  -- Saldo atual (acumula se sobrar do ciclo anterior)
  sessions_remaining INT NOT NULL DEFAULT 0 CHECK (sessions_remaining >= 0),

  -- Estado
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para buscar o pack ativo de um aluno rapidamente
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_packs_active
  ON client_packs(client_id)
  WHERE is_active = true;

-- Tabela: pack_transactions
-- Histórico de todos os movimentos do pack (desconto, adição, renovação)
CREATE TABLE IF NOT EXISTS pack_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id         UUID NOT NULL REFERENCES client_packs(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pt_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Tipo de transação
  type            TEXT NOT NULL CHECK (type IN ('deduct', 'add', 'renewal', 'create')),
  -- deduct   = PT descontou aulas manualmente
  -- add      = PT adicionou aulas manualmente
  -- renewal  = Renovação automática (saldo anterior + novas aulas)
  -- create   = Criação inicial do pack

  amount          INT NOT NULL,   -- Número de aulas movimentadas (sempre positivo)
  balance_before  INT NOT NULL,   -- Saldo antes da transação
  balance_after   INT NOT NULL,   -- Saldo depois da transação
  notes           TEXT,           -- Nota opcional do PT

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_pack_transactions_pack_id   ON pack_transactions(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_transactions_client_id ON pack_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_pack_transactions_pt_id     ON pack_transactions(pt_id);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE client_packs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_transactions  ENABLE ROW LEVEL SECURITY;

-- PT vê e gere os packs dos seus alunos
CREATE POLICY "pt_manage_packs" ON client_packs
  FOR ALL
  USING (pt_id = auth.uid())
  WITH CHECK (pt_id = auth.uid());

-- Aluno vê apenas o seu próprio pack
-- (usa users.linked_client_id para ligar auth.uid() ao registo do aluno)
CREATE POLICY "client_view_own_pack" ON client_packs
  FOR SELECT
  USING (
    client_id IN (
      SELECT linked_client_id FROM users WHERE id = auth.uid()
    )
  );

-- PT vê o histórico dos seus alunos
CREATE POLICY "pt_view_transactions" ON pack_transactions
  FOR ALL
  USING (pt_id = auth.uid())
  WITH CHECK (pt_id = auth.uid());

-- Aluno vê apenas o seu próprio histórico
CREATE POLICY "client_view_own_transactions" ON pack_transactions
  FOR SELECT
  USING (
    client_id IN (
      SELECT linked_client_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================================
-- Função: renovação automática
-- Chama esta função periodicamente (ex: cron job ou Edge Function)
-- para processar renovações mensais/semanais na data certa
-- ============================================================

CREATE OR REPLACE FUNCTION process_pack_renewals()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  new_balance INT;
BEGIN
  FOR rec IN
    SELECT *
    FROM client_packs
    WHERE is_active = true
      AND renewal_type IN ('monthly', 'weekly')
      AND next_renewal_at <= now()
  LOOP
    new_balance := rec.sessions_remaining + rec.total_sessions;

    -- Atualiza saldo e próxima data de renovação
    UPDATE client_packs
    SET
      sessions_remaining = new_balance,
      next_renewal_at = CASE
        WHEN renewal_type = 'monthly' THEN next_renewal_at + INTERVAL '1 month'
        WHEN renewal_type = 'weekly'  THEN next_renewal_at + INTERVAL '1 week'
      END,
      updated_at = now()
    WHERE id = rec.id;

    -- Regista a transação de renovação
    INSERT INTO pack_transactions (pack_id, client_id, pt_id, type, amount, balance_before, balance_after)
    VALUES (rec.id, rec.client_id, rec.pt_id, 'renewal', rec.total_sessions, rec.sessions_remaining, new_balance);

  END LOOP;
END;
$$;
