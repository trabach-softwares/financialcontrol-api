-- Tabela de endereços dos usuários
-- Necessária para cobranças com cartão de crédito via Asaas (creditCardHolderInfo)
-- Relação 1:1 com users (cada usuário tem no máximo um endereço cadastrado)

CREATE TABLE IF NOT EXISTS user_addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE,

  -- Endereço
  postal_code   VARCHAR(9)  NOT NULL,      -- Ex: 88000-000 ou 88000000
  street        VARCHAR(255),              -- Logradouro
  number        VARCHAR(20),               -- Número
  complement    VARCHAR(100),              -- Apto, Bloco, etc.
  neighborhood  VARCHAR(100),              -- Bairro
  city          VARCHAR(100),              -- Cidade
  state         VARCHAR(2),                -- UF (ex: SC, SP)
  country       VARCHAR(2) DEFAULT 'BR',   -- País (ISO 3166-1 alpha-2)

  -- Controle
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- FK
  CONSTRAINT fk_user_addresses_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Índice para lookup rápido por usuário
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_addresses_updated_at();

-- RLS: cada usuário só vê/edita seu próprio endereço
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_addresses_select_own" ON user_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_addresses_insert_own" ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_addresses_update_own" ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_addresses_delete_own" ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE  user_addresses               IS 'Endereço de cobrança do usuário (1:1 com users)';
COMMENT ON COLUMN user_addresses.postal_code   IS 'CEP — obrigatório para cobranças com cartão no Asaas';
COMMENT ON COLUMN user_addresses.state         IS 'UF com 2 caracteres, ex: SC';
COMMENT ON COLUMN user_addresses.country       IS 'Código ISO 3166-1 alpha-2, padrão BR';
