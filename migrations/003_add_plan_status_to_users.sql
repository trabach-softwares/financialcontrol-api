-- Adicionar campos de controle de status do plano na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMP;

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_users_plan_status ON users(plan_status);

-- Comentários
COMMENT ON COLUMN users.plan_status IS 'Status do plano: active | inactive | expired | cancelled';
COMMENT ON COLUMN users.plan_activated_at IS 'Data de ativação do plano atual';

-- Atualizar usuários existentes com plano para status ativo
UPDATE users 
SET plan_status = 'active', 
    plan_activated_at = NOW() 
WHERE plan_id IS NOT NULL 
  AND plan_status IS NULL;
