-- ============================================================================
-- Migration 009: Billing Cycle em payments e plan_expires_at em users
-- Descrição: Suporte a expiração de planos pagos via PIX/Boleto por período
-- Data: 20 de Março de 2026
-- ============================================================================

-- Adicionar ciclo de cobrança na tabela de pagamentos
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'MONTHLY';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_payment_billing_cycle'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT valid_payment_billing_cycle
      CHECK (billing_cycle IN ('MONTHLY', 'QUARTERLY', 'YEARLY'));
  END IF;
END$$;

COMMENT ON COLUMN payments.billing_cycle IS 'Ciclo de cobrança: MONTHLY (1 mês), QUARTERLY (3 meses), YEARLY (1 ano)';

-- Adicionar data de expiração do plano na tabela de usuários
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;

COMMENT ON COLUMN users.plan_expires_at IS 'Data em que o plano expira e deve ser renovado';

-- Índice para o job de expiração buscar eficientemente
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at ON users(plan_expires_at)
  WHERE plan_status IN ('active', 'expiring_soon');
