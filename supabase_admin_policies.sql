-- ============================================================
-- POLÍTICAS DE ADMIN - PeakON
-- Executa este script no Supabase SQL Editor
-- Permite ao admin ver tudo o que PT e cliente vêem
-- ============================================================

-- 1. Função SECURITY DEFINER para verificar se é admin
--    (evita recursão infinita no RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- TABELA: users
-- ============================================================
DROP POLICY IF EXISTS "admin_view_all_users"    ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "users_select" ON public.users
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "users_insert" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update" ON public.users
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- ============================================================
-- TABELA: clients
-- ============================================================
DROP POLICY IF EXISTS "admin_view_all_clients"     ON public.clients;
DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;

CREATE POLICY "clients_select" ON public.clients
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ============================================================
-- TABELA: workouts
-- ============================================================
DROP POLICY IF EXISTS "admin_view_all_workouts"       ON public.workouts;
DROP POLICY IF EXISTS "Users can manage own workouts"  ON public.workouts;
DROP POLICY IF EXISTS "Clients can view own workouts"  ON public.workouts;

CREATE POLICY "workouts_select" ON public.workouts
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND linked_client_id = workouts.client_id
    )
  );

CREATE POLICY "workouts_insert" ON public.workouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workouts_update" ON public.workouts
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "workouts_delete" ON public.workouts
  FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ============================================================
-- TABELA: progress_logs
-- ============================================================
DROP POLICY IF EXISTS "Users can manage progress logs for their clients" ON public.progress_logs;

CREATE POLICY "progress_logs_all" ON public.progress_logs
  FOR ALL
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = progress_logs.client_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = progress_logs.client_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- TABELA: photos
-- ============================================================
DROP POLICY IF EXISTS "Users can manage photos for their clients" ON public.photos;

CREATE POLICY "photos_all" ON public.photos
  FOR ALL
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = photos.client_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = photos.client_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- TABELA: body_metrics
-- ============================================================
DROP POLICY IF EXISTS "Users can manage metrics for their clients" ON public.body_metrics;

CREATE POLICY "body_metrics_all" ON public.body_metrics
  FOR ALL
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = body_metrics.client_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = body_metrics.client_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- TABELA: workout_plans
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own plans" ON public.workout_plans;

CREATE POLICY "workout_plans_select" ON public.workout_plans
  FOR SELECT
  USING (pt_id = auth.uid() OR public.is_admin());

CREATE POLICY "workout_plans_insert" ON public.workout_plans
  FOR INSERT
  WITH CHECK (pt_id = auth.uid());

CREATE POLICY "workout_plans_update" ON public.workout_plans
  FOR UPDATE
  USING (pt_id = auth.uid() OR public.is_admin());

CREATE POLICY "workout_plans_delete" ON public.workout_plans
  FOR DELETE
  USING (pt_id = auth.uid() OR public.is_admin());

-- ============================================================
-- TABELA: workout_plan_exercises
-- ============================================================
DROP POLICY IF EXISTS "Users can manage exercises for their plans" ON public.workout_plan_exercises;

CREATE POLICY "workout_plan_exercises_all" ON public.workout_plan_exercises
  FOR ALL
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE id = workout_plan_exercises.plan_id AND pt_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE id = workout_plan_exercises.plan_id AND pt_id = auth.uid()
    )
  );

-- ============================================================
-- TABELA: workout_exercises
-- ============================================================
DROP POLICY IF EXISTS "Users can manage items of their workouts"  ON public.workout_exercises;
DROP POLICY IF EXISTS "Clients can view their workout items"       ON public.workout_exercises;

CREATE POLICY "workout_exercises_select" ON public.workout_exercises
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.workouts
      WHERE id = workout_exercises.workout_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workouts w
      JOIN public.users u ON w.client_id = u.linked_client_id
      WHERE w.id = workout_exercises.workout_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_write" ON public.workout_exercises
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE id = workout_exercises.workout_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE id = workout_exercises.workout_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- TABELA: client_packs
-- ============================================================
DROP POLICY IF EXISTS "pt_manage_packs"       ON public.client_packs;
DROP POLICY IF EXISTS "client_view_own_pack"  ON public.client_packs;

CREATE POLICY "client_packs_select" ON public.client_packs
  FOR SELECT
  USING (
    pt_id = auth.uid()
    OR public.is_admin()
    OR client_id IN (
      SELECT linked_client_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "client_packs_write" ON public.client_packs
  FOR ALL
  USING (pt_id = auth.uid() OR public.is_admin())
  WITH CHECK (pt_id = auth.uid());

-- ============================================================
-- TABELA: pack_transactions
-- ============================================================
DROP POLICY IF EXISTS "pt_view_transactions"          ON public.pack_transactions;
DROP POLICY IF EXISTS "client_view_own_transactions"  ON public.pack_transactions;

CREATE POLICY "pack_transactions_select" ON public.pack_transactions
  FOR SELECT
  USING (
    pt_id = auth.uid()
    OR public.is_admin()
    OR client_id IN (
      SELECT linked_client_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "pack_transactions_write" ON public.pack_transactions
  FOR ALL
  USING (pt_id = auth.uid() OR public.is_admin())
  WITH CHECK (pt_id = auth.uid());
