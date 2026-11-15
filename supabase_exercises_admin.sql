-- ============================================================
-- POLÍTICAS DE ADMIN PARA EXERCÍCIOS - PeakON
-- Executa este script no Supabase SQL Editor.
-- Permite ao admin editar e eliminar exercícios do catálogo.
-- ============================================================

-- Remove políticas antigas (do supabase_schema.sql original)
DROP POLICY IF EXISTS "All authenticated users can see exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can insert exercises"               ON public.exercises;

-- SELECT: qualquer utilizador autenticado pode ver o catálogo
CREATE POLICY "exercises_select" ON public.exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: PT autenticado pode adicionar exercícios personalizados;
--         admin também pode
CREATE POLICY "exercises_insert" ON public.exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: apenas o PT que criou o exercício, ou o admin
CREATE POLICY "exercises_update" ON public.exercises
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR created_by IS NULL        -- exercícios globais do sistema
    OR public.is_admin()
  )
  WITH CHECK (true);

-- DELETE: apenas o PT que criou, ou o admin
CREATE POLICY "exercises_delete" ON public.exercises
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR created_by IS NULL
    OR public.is_admin()
  );
