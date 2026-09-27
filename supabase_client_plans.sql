-- ============================================================
-- MÚLTIPLOS PLANOS POR ALUNO - PeakON
-- Executa este script no Supabase SQL Editor
-- ============================================================

-- 1. Tabela de ligação: cliente ↔ planos (many-to-many)
--    Substitui clients.active_plan_id
CREATE TABLE IF NOT EXISTS public.client_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_id     UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  label       TEXT,          -- ex: "Manhã", "Seg/Qua/Sex", "Força A"
  sort_order  INT  NOT NULL DEFAULT 0,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_client_plans_client ON public.client_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_client_plans_plan   ON public.client_plans(plan_id);

-- 2. Tabela de eventos de atribuição (para a timeline)
CREATE TABLE IF NOT EXISTS public.plan_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_id     UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  plan_name   TEXT NOT NULL,   -- snapshot do nome no momento da atribuição
  label       TEXT,
  action      TEXT NOT NULL CHECK (action IN ('assigned', 'removed')),
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_assignments_client ON public.plan_assignments(client_id);

-- 3. RLS: client_plans
ALTER TABLE public.client_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_assignments  ENABLE ROW LEVEL SECURITY;

-- PT gere os planos dos seus alunos
CREATE POLICY "pt_manage_client_plans" ON public.client_plans
  FOR ALL
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Aluno vê os seus próprios planos
CREATE POLICY "client_view_own_plans" ON public.client_plans
  FOR SELECT
  USING (
    client_id IN (
      SELECT linked_client_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Admin vê tudo
CREATE POLICY "admin_view_client_plans" ON public.client_plans
  FOR SELECT USING (public.is_admin());

-- PT vê e escreve os seus eventos de atribuição
CREATE POLICY "pt_manage_plan_assignments" ON public.plan_assignments
  FOR ALL
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Aluno vê os seus próprios eventos
CREATE POLICY "client_view_plan_assignments" ON public.plan_assignments
  FOR SELECT
  USING (
    client_id IN (
      SELECT linked_client_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Admin vê tudo
CREATE POLICY "admin_view_plan_assignments" ON public.plan_assignments
  FOR SELECT USING (public.is_admin());

-- 4. Migrar dados existentes de clients.active_plan_id → client_plans
--    Executa APENAS se existirem alunos com plano atribuído
INSERT INTO public.client_plans (client_id, plan_id, label, assigned_by, sort_order)
SELECT
  c.id,
  c.active_plan_id,
  'Plano Principal',
  c.user_id,
  0
FROM public.clients c
WHERE c.active_plan_id IS NOT NULL
ON CONFLICT (client_id, plan_id) DO NOTHING;
