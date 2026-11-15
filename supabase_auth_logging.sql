-- ============================================================
-- AUTH LOGGING & SECURITY - PeakON
-- Regista tentativas de login falhadas para detecção de ataques
-- Executa este script no Supabase SQL Editor
-- ============================================================

-- 1. Tabela de tentativas de autenticação
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  attempt_type  TEXT NOT NULL CHECK (attempt_type IN ('login', 'signup', 'password_reset')),
  success       BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email ON public.auth_attempts(email);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip ON public.auth_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_created ON public.auth_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_failed ON public.auth_attempts(email, created_at DESC) WHERE success = false;

-- 2. RLS: apenas admin pode ver logs
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_auth_attempts" ON public.auth_attempts
  FOR SELECT
  USING (public.is_admin());

-- 3. Função para limpar logs antigos (opcional - mantém últimos 90 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_auth_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_attempts
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função para verificar se um email/IP está bloqueado por excesso de tentativas
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_email TEXT,
  p_ip TEXT DEFAULT NULL,
  p_minutes INTEGER DEFAULT 60,
  p_max_attempts INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Conta tentativas falhadas nas últimas X minutos
  SELECT COUNT(*) INTO v_count
  FROM public.auth_attempts
  WHERE (email = p_email OR (p_ip IS NOT NULL AND ip_address = p_ip))
    AND success = false
    AND created_at > now() - (p_minutes || ' minutes')::interval;
  
  -- Retorna true se ainda está dentro do limite
  RETURN v_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. View para análise de segurança (admin)
CREATE OR REPLACE VIEW public.auth_security_summary AS
SELECT
  DATE(created_at) as date,
  attempt_type,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE success = false) as failed_attempts,
  COUNT(*) FILTER (WHERE success = true) as successful_attempts,
  COUNT(DISTINCT email) as unique_emails,
  COUNT(DISTINCT ip_address) as unique_ips
FROM public.auth_attempts
GROUP BY DATE(created_at), attempt_type
ORDER BY date DESC, attempt_type;

-- 6. View para alertas de segurança (emails com muitas falhas)
CREATE OR REPLACE VIEW public.auth_suspicious_activity AS
SELECT
  email,
  ip_address,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt,
  COUNT(DISTINCT ip_address) as different_ips
FROM public.auth_attempts
WHERE success = false
  AND created_at > now() - interval '24 hours'
GROUP BY email, ip_address
HAVING COUNT(*) >= 5
ORDER BY failed_attempts DESC;

-- 7. Comentários para documentação
COMMENT ON TABLE public.auth_attempts IS 'Registo de todas as tentativas de autenticação (sucesso e falha) para análise de segurança';
COMMENT ON FUNCTION public.check_rate_limit IS 'Verifica se um email/IP excedeu o limite de tentativas falhadas';
COMMENT ON VIEW public.auth_security_summary IS 'Resumo diário de atividade de autenticação';
COMMENT ON VIEW public.auth_suspicious_activity IS 'Detecta atividade suspeita (múltiplas falhas em 24h)';

-- ============================================================
-- NOTA IMPORTANTE:
-- Este script cria a estrutura. O logging real é feito via:
-- 1. Client-side: Login.jsx regista tentativas via supabase.from('auth_attempts').insert()
-- 2. Opcional: Hook do Supabase Auth (requer configuração adicional)
-- ============================================================
