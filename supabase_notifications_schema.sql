-- ============================================
-- NOTIFICATIONS SCHEMA
-- ============================================

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_plan', 'plan_updated', 'booking_confirmed', 'booking_cancelled', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- dados adicionais (ex: plan_id, client_id, etc.)
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users podem ver apenas as suas notificações
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users podem atualizar (marcar como lida) as suas notificações
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Apenas PTs e admins podem criar notificações (através de triggers/functions)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTION: Criar notificação quando plano é atribuído
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_plan()
RETURNS TRIGGER AS $$
DECLARE
  client_user_id UUID;
  plan_name TEXT;
BEGIN
  -- Só notifica quando um novo plano é atribuído (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Obter o user_id do cliente através da tabela clients
    SELECT u.id INTO client_user_id
    FROM public.clients c
    JOIN public.users u ON u.linked_client_id = c.id
    WHERE c.id = NEW.client_id
    LIMIT 1;
    
    -- Obter o nome do plano
    SELECT name INTO plan_name
    FROM public.workout_plans
    WHERE id = NEW.plan_id
    LIMIT 1;
    
    -- Se encontrou o user_id do cliente, criar notificação
    IF client_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        client_user_id,
        'new_plan',
        '🏋️ Novo Plano de Treino!',
        'O teu Personal Trainer atribuiu-te um novo plano de treino' || 
          CASE WHEN plan_name IS NOT NULL THEN ': ' || plan_name ELSE '' END || 
          '. Vê os detalhes e começa já!',
        jsonb_build_object(
          'plan_id', NEW.plan_id,
          'client_id', NEW.client_id,
          'label', NEW.label,
          'assigned_by', NEW.assigned_by
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar quando um plano é atribuído na tabela client_plans
DROP TRIGGER IF EXISTS trigger_notify_new_plan ON public.client_plans;
CREATE TRIGGER trigger_notify_new_plan
  AFTER INSERT ON public.client_plans
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_plan();

-- ============================================
-- FUNCTION: Marcar todas as notificações como lidas
-- ============================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE user_id = user_uuid AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Limpar notificações antigas (>30 dias)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE notifications IS 'Armazena notificações push para utilizadores';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificação: new_plan, plan_updated, booking_confirmed, etc.';
COMMENT ON COLUMN notifications.data IS 'Dados adicionais em formato JSON para a notificação';
COMMENT ON FUNCTION notify_new_plan() IS 'Cria notificação quando um PT atribui um plano a um cliente';
COMMENT ON FUNCTION mark_all_notifications_read(UUID) IS 'Marca todas as notificações de um utilizador como lidas';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Remove notificações com mais de 30 dias';
