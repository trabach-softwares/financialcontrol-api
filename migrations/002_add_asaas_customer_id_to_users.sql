-- Adicionar coluna para armazenar ID do cliente no Asaas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255) UNIQUE;

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_users_asaas_customer_id ON users(asaas_customer_id);

-- Comentário
COMMENT ON COLUMN users.asaas_customer_id IS 'ID do cliente no gateway de pagamento Asaas';
