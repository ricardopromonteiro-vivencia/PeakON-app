-- ============================================================
-- MEDIDAS CORPORAIS EXPANDIDAS - PeakON
-- Executa este script no Supabase SQL Editor
-- ============================================================

-- Adicionar todas as medidas corporais à tabela body_metrics existente
-- (as colunas chest, waist, arm, leg já existem — adicionamos as restantes)

ALTER TABLE public.body_metrics
  ADD COLUMN IF NOT EXISTS height      numeric(5,1),  -- altura cm
  ADD COLUMN IF NOT EXISTS neck        numeric(5,1),  -- pescoço cm
  ADD COLUMN IF NOT EXISTS shoulder    numeric(5,1),  -- ombros cm
  ADD COLUMN IF NOT EXISTS chest       numeric(5,1),  -- peito cm (já existe mas recria se não)
  ADD COLUMN IF NOT EXISTS waist       numeric(5,1),  -- cintura cm
  ADD COLUMN IF NOT EXISTS abdomen     numeric(5,1),  -- abdómen cm
  ADD COLUMN IF NOT EXISTS hip         numeric(5,1),  -- anca/glúteo cm
  ADD COLUMN IF NOT EXISTS arm         numeric(5,1),  -- braço contraído cm
  ADD COLUMN IF NOT EXISTS forearm     numeric(5,1),  -- antebraço cm
  ADD COLUMN IF NOT EXISTS thigh       numeric(5,1),  -- coxa cm
  ADD COLUMN IF NOT EXISTS calf        numeric(5,1),  -- gémeo cm
  ADD COLUMN IF NOT EXISTS body_fat    numeric(4,1),  -- gordura corporal %
  ADD COLUMN IF NOT EXISTS notes       text;          -- notas livres

-- RLS já está configurada na tabela body_metrics (supabase_admin_policies.sql)
-- Garante que o admin também pode ver as medidas
DROP POLICY IF EXISTS "admin_view_body_metrics" ON public.body_metrics;
CREATE POLICY "admin_view_body_metrics" ON public.body_metrics
  FOR SELECT
  USING (public.is_admin());
