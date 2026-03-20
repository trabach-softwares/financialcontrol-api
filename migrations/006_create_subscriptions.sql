-- ============================================================================
-- Migration 006: Create Subscriptions Table
-- Descrição: Tabela para gerenciar assinaturas recorrentes (trimestral/anual)
-- Data: 11 de Fevereiro de 2026
-- ============================================================================

-- Extensão UUID (se ainda não existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Tabela: subscriptions
-- Descrição: Armazena assinaturas recorrentes do Asaas (QUARTERLY, YEARLY)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  
  -- Dados do Asaas
  asaas_subscription_id TEXT UNIQUE NOT NULL,
  asaas_customer_id TEXT NOT NULL,
  
  -- Ciclo de cobrança
  cycle VARCHAR(20) NOT NULL, -- MONTHLY, QUARTERLY, YEARLY
  value DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED, SUSPENDED
  
  -- Datas importantes
  next_due_date DATE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Informações do cartão (apenas últimos dígitos - PCI Compliant)
  card_brand VARCHAR(20),         -- VISA, MASTERCARD, ELO, AMEX, HIPERCARD, etc
  card_last4 VARCHAR(4),          -- Últimos 4 dígitos
  
  -- Controle de timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints de validação
  CONSTRAINT valid_cycle CHECK (cycle IN ('MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY')),
  CONSTRAINT valid_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED')),
  CONSTRAINT positive_value CHECK (value > 0)
);

-- ============================================================================
-- Índices para Performance
-- ============================================================================

-- Índice para buscar assinaturas de um usuário (query mais comum)
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Índice para buscar por ID do Asaas (usado em webhooks)
CREATE INDEX idx_subscriptions_asaas_id ON subscriptions(asaas_subscription_id);

-- Índice para filtrar por status
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Índice para buscar assinaturas próximas ao vencimento
CREATE INDEX idx_subscriptions_next_due_date ON subscriptions(next_due_date);

-- Índice para buscar por plano
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);

-- Índice composto para buscar assinatura ativa de um usuário (performance máxima)
CREATE INDEX idx_subscriptions_user_active ON subscriptions(user_id, status) 
WHERE status = 'ACTIVE';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Habilitar RLS na tabela
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem visualizar apenas suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas suas próprias assinaturas
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Apenas sistema pode inserir assinaturas (via service role)
CREATE POLICY "Service role can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (true);

-- Política: Apenas sistema pode deletar assinaturas (via service role)
CREATE POLICY "Service role can delete subscriptions"
  ON subscriptions FOR DELETE
  USING (true);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que executa a função antes de cada UPDATE
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================================
-- Comentários das Colunas (Documentação no DB)
-- ============================================================================

COMMENT ON TABLE subscriptions IS 'Assinaturas recorrentes (trimestral/anual) gerenciadas pelo Asaas';
COMMENT ON COLUMN subscriptions.id IS 'UUID único da assinatura';
COMMENT ON COLUMN subscriptions.user_id IS 'Referência ao usuário (FK)';
COMMENT ON COLUMN subscriptions.plan_id IS 'Referência ao plano (FK)';
COMMENT ON COLUMN subscriptions.asaas_subscription_id IS 'ID da assinatura no Asaas (sub_xxxxxxxx)';
COMMENT ON COLUMN subscriptions.asaas_customer_id IS 'ID do cliente no Asaas (cus_xxxxxxxx)';
COMMENT ON COLUMN subscriptions.cycle IS 'Ciclo de cobrança: MONTHLY, QUARTERLY, YEARLY';
COMMENT ON COLUMN subscriptions.value IS 'Valor da assinatura em R$';
COMMENT ON COLUMN subscriptions.status IS 'Status: ACTIVE, EXPIRED, CANCELLED, SUSPENDED';
COMMENT ON COLUMN subscriptions.next_due_date IS 'Próxima data de cobrança';
COMMENT ON COLUMN subscriptions.started_at IS 'Data de início da assinatura';
COMMENT ON COLUMN subscriptions.cancelled_at IS 'Data de cancelamento (null se ativa)';
COMMENT ON COLUMN subscriptions.expires_at IS 'Data de expiração (null se ativa)';
COMMENT ON COLUMN subscriptions.last_payment_date IS 'Data do último pagamento recebido';
COMMENT ON COLUMN subscriptions.card_brand IS 'Bandeira do cartão (VISA, MASTERCARD, etc)';
COMMENT ON COLUMN subscriptions.card_last4 IS 'Últimos 4 dígitos do cartão (PCI Compliant)';

-- ============================================================================
-- View: Active Subscriptions (para relatórios)
-- ============================================================================

CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.id,
  s.user_id,
  u.name AS user_name,
  u.email AS user_email,
  s.plan_id,
  p.name AS plan_name,
  s.cycle,
  s.value,
  s.next_due_date,
  s.started_at,
  s.card_brand,
  s.card_last4,
  (s.next_due_date - CURRENT_DATE) AS days_until_renewal
FROM subscriptions s
INNER JOIN users u ON s.user_id = u.id
INNER JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'ACTIVE'
ORDER BY s.next_due_date ASC;

COMMENT ON VIEW active_subscriptions IS 'View de assinaturas ativas com informações do usuário e plano';

-- ============================================================================
-- Dados de Teste (apenas em desenvolvimento)
-- ============================================================================

-- Descomentar para inserir dados de teste
/*
INSERT INTO subscriptions (
  user_id, 
  plan_id, 
  asaas_subscription_id, 
  asaas_customer_id,
  cycle,
  value,
  status,
  next_due_date,
  card_brand,
  card_last4
) VALUES (
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM plans WHERE name = 'Pro' LIMIT 1),
  'sub_test_' || gen_random_uuid(),
  'cus_test_' || gen_random_uuid(),
  'YEARLY',
  499.90,
  'ACTIVE',
  CURRENT_DATE + INTERVAL '1 year',
  'VISA',
  '1234'
);
*/

-- ============================================================================
-- Verificação Final
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    RAISE NOTICE '✅ Tabela subscriptions criada com sucesso!';
    RAISE NOTICE '✅ Índices criados: 6';
    RAISE NOTICE '✅ RLS habilitado: 5 policies';
    RAISE NOTICE '✅ Trigger created_at criado';
    RAISE NOTICE '✅ View active_subscriptions criada';
  ELSE
    RAISE EXCEPTION '❌ Erro ao criar tabela subscriptions';
  END IF;
END $$;
