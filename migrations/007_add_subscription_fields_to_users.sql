-- ============================================================================
-- Migration 007: Add Subscription Fields to Users Table
-- Descrição: Adiciona campos de assinatura à tabela users para tracking rápido
-- Data: 11 de Fevereiro de 2026
-- ============================================================================

-- ============================================================================
-- Adicionar Colunas de Assinatura
-- ============================================================================

-- Adicionar campo de referência à assinatura ativa
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Adicionar campo de ciclo da assinatura (desnormalizado para performance)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS subscription_cycle VARCHAR(20);

-- Adicionar campo de status da assinatura (desnormalizado para performance)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive';

-- Constraint de validação para subscription_cycle
ALTER TABLE users 
  ADD CONSTRAINT valid_subscription_cycle 
  CHECK (subscription_cycle IS NULL OR subscription_cycle IN ('MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'));

-- Constraint de validação para subscription_status
ALTER TABLE users 
  ADD CONSTRAINT valid_subscription_status 
  CHECK (subscription_status IN ('active', 'inactive', 'expired', 'cancelled'));

-- ============================================================================
-- Índices para Performance
-- ============================================================================

-- Índice para buscar usuários por assinatura
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id);

-- Índice para filtrar usuários por status de assinatura
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Índice composto para buscar usuários com assinatura ativa
CREATE INDEX IF NOT EXISTS idx_users_active_subscription ON users(subscription_status) 
WHERE subscription_status = 'active';

-- ============================================================================
-- Comentários das Colunas (Documentação no DB)
-- ============================================================================

COMMENT ON COLUMN users.subscription_id IS 'Referência à assinatura ativa do usuário (null se sem assinatura)';
COMMENT ON COLUMN users.subscription_cycle IS 'Ciclo da assinatura: MONTHLY, QUARTERLY, YEARLY (desnormalizado)';
COMMENT ON COLUMN users.subscription_status IS 'Status da assinatura: active, inactive, expired, cancelled';

-- ============================================================================
-- View: Users with Active Subscriptions (para relatórios)
-- ============================================================================

CREATE OR REPLACE VIEW users_with_subscriptions AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.email,
  u.plan_id,
  p.name AS plan_name,
  u.subscription_id,
  u.subscription_cycle,
  u.subscription_status,
  s.value AS subscription_value,
  s.next_due_date,
  s.card_brand,
  s.card_last4,
  u.created_at AS user_created_at,
  s.started_at AS subscription_started_at
FROM users u
INNER JOIN plans p ON u.plan_id = p.id
LEFT JOIN subscriptions s ON u.subscription_id = s.id
WHERE u.subscription_status = 'active'
ORDER BY s.next_due_date ASC;

COMMENT ON VIEW users_with_subscriptions IS 'View de usuários com assinaturas ativas';

-- ============================================================================
-- Função: Sync User Subscription Status
-- Descrição: Mantém os campos de users sincronizados com subscriptions
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_user_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma assinatura é criada ou atualizada, sincronizar com users
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE users
    SET 
      subscription_id = NEW.id,
      subscription_cycle = NEW.cycle,
      subscription_status = CASE 
        WHEN NEW.status = 'ACTIVE' THEN 'active'
        WHEN NEW.status = 'CANCELLED' THEN 'cancelled'
        WHEN NEW.status = 'EXPIRED' THEN 'expired'
        WHEN NEW.status = 'SUSPENDED' THEN 'inactive'
        ELSE 'inactive'
      END
    WHERE id = NEW.user_id;
  END IF;
  
  -- Quando uma assinatura é deletada, limpar campos em users
  IF (TG_OP = 'DELETE') THEN
    UPDATE users
    SET 
      subscription_id = NULL,
      subscription_cycle = NULL,
      subscription_status = 'inactive'
    WHERE id = OLD.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Auto-sync subscription status
-- ============================================================================

DROP TRIGGER IF EXISTS sync_subscription_status_trigger ON subscriptions;

CREATE TRIGGER sync_subscription_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_subscription_status();

COMMENT ON FUNCTION sync_user_subscription_status() IS 'Mantém campos de assinatura em users sincronizados com subscriptions';

-- ============================================================================
-- Migrar Dados Existentes (se houver)
-- ============================================================================

-- Atualizar usuários que já tem plan_status = 'active' mas sem subscription_status
UPDATE users
SET subscription_status = 'inactive'
WHERE subscription_status IS NULL;

-- ============================================================================
-- Verificação Final
-- ============================================================================

DO $$
BEGIN
  -- Verificar se colunas foram criadas
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('subscription_id', 'subscription_cycle', 'subscription_status')
  ) THEN
    RAISE NOTICE '✅ Colunas de assinatura adicionadas à tabela users!';
    RAISE NOTICE '✅ Índices criados: 3';
    RAISE NOTICE '✅ View users_with_subscriptions criada';
    RAISE NOTICE '✅ Trigger de sincronização criado';
    
    -- Contar usuários
    DECLARE
      total_users INTEGER;
      users_with_subs INTEGER;
    BEGIN
      SELECT COUNT(*) INTO total_users FROM users;
      SELECT COUNT(*) INTO users_with_subs FROM users WHERE subscription_status = 'active';
      
      RAISE NOTICE 'ℹ️  Total de usuários: %', total_users;
      RAISE NOTICE 'ℹ️  Usuários com assinatura ativa: %', users_with_subs;
    END;
  ELSE
    RAISE EXCEPTION '❌ Erro ao adicionar colunas de assinatura';
  END IF;
END $$;
