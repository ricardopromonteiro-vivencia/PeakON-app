-- ============================================================
-- ATUALIZAÇÃO DA AGENDA - Agendamento Direto pelo PT
-- Executa este script no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar coluna booked_by_pt à tabela bookings
--    true = PT agendou diretamente (status fica 'approved' imediatamente)
--    false/null = cliente fez o pedido (fluxo normal pending → approved/rejected)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booked_by_pt BOOLEAN NOT NULL DEFAULT false;

-- 2. Adicionar max_clients a pt_availability
--    NULL = sem limite (padrão: 1 — sessão individual)
--    > 1  = aula de grupo (ex: 5 alunos em simultâneo)
ALTER TABLE public.pt_availability
  ADD COLUMN IF NOT EXISTS max_clients INT NOT NULL DEFAULT 1;

-- 3. Política RLS: PT pode criar bookings em nome dos seus clientes
--    (a policy "PT manages own bookings" já existe mas é FOR ALL,
--     esta garante que o PT pode INSERT diretamente)
DROP POLICY IF EXISTS "PT can book for clients" ON public.bookings;
CREATE POLICY "PT can book for clients" ON public.bookings
  FOR INSERT
  WITH CHECK (pt_id = auth.uid());

-- 4. Política RLS: PT pode remover bookings que ele próprio criou
DROP POLICY IF EXISTS "PT can delete own bookings" ON public.bookings;
CREATE POLICY "PT can delete own bookings" ON public.bookings
  FOR DELETE
  USING (pt_id = auth.uid());
