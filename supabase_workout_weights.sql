-- ============================================================
-- CARGA DE REFERÊNCIA E CARGA ATINGIDA - PeakON
-- Executa este script no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar carga de referência ao plano (definida pelo PT)
ALTER TABLE public.workout_plan_exercises
  ADD COLUMN IF NOT EXISTS reference_weight numeric(6,2);
-- Ex: 50.00 = 50 kg de referência. NULL = sem referência definida.

-- 2. Tabela de carga atingida por aluno por exercício do plano
--    Cada linha = um aluno + um exercício de um plano + o peso que atingiu
CREATE TABLE IF NOT EXISTS public.client_exercise_weights (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_exercise_id      UUID NOT NULL REFERENCES public.workout_plan_exercises(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  achieved_weight       numeric(6,2) NOT NULL,
  notes                 text,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_exercise_id, client_id)  -- um registo por aluno por exercício
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cew_client     ON public.client_exercise_weights(client_id);
CREATE INDEX IF NOT EXISTS idx_cew_plan_ex    ON public.client_exercise_weights(plan_exercise_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.client_exercise_weights ENABLE ROW LEVEL SECURITY;

-- PT vê os pesos dos seus alunos (via plano que lhe pertence)
CREATE POLICY "pt_view_client_weights" ON public.client_exercise_weights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_plan_exercises wpe
      JOIN public.workout_plans wp ON wpe.plan_id = wp.id
      WHERE wpe.id = client_exercise_weights.plan_exercise_id
        AND wp.pt_id = auth.uid()
    )
  );

-- Aluno gere apenas os seus próprios pesos
CREATE POLICY "client_manage_own_weights" ON public.client_exercise_weights
  FOR ALL
  USING (
    client_id IN (
      SELECT linked_client_id FROM public.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT linked_client_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Admin vê tudo
CREATE POLICY "admin_view_all_weights" ON public.client_exercise_weights
  FOR SELECT
  USING (public.is_admin());

-- PT pode também inserir/atualizar pesos em nome do aluno
CREATE POLICY "pt_upsert_client_weights" ON public.client_exercise_weights
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_plan_exercises wpe
      JOIN public.workout_plans wp ON wpe.plan_id = wp.id
      WHERE wpe.id = client_exercise_weights.plan_exercise_id
        AND wp.pt_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workout_plan_exercises wpe
      JOIN public.workout_plans wp ON wpe.plan_id = wp.id
      WHERE wpe.id = client_exercise_weights.plan_exercise_id
        AND wp.pt_id = auth.uid()
    )
  );
