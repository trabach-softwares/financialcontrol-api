-- Criar tabela de pagamentos para integração com Asaas
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  
  -- Asaas IDs
  asaas_payment_id VARCHAR(255) NOT NULL UNIQUE,
  asaas_customer_id VARCHAR(255) NOT NULL,
  
  -- Dados do pagamento
  value DECIMAL(10, 2) NOT NULL,
  net_value DECIMAL(10, 2),  -- Valor líquido após taxas do Asaas
  payment_method VARCHAR(50) NOT NULL,  -- PIX, BOLETO, CREDIT_CARD
  status VARCHAR(50) NOT NULL,  -- PENDING, RECEIVED, CONFIRMED, OVERDUE, CANCELLED
  
  -- Datas
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  
  -- URLs e dados específicos
  invoice_url TEXT,
  transaction_receipt_url TEXT,
  
  -- PIX específico
  pix_payload TEXT,
  pix_qr_code_image TEXT,  -- Base64 da imagem
  pix_expires_at TIMESTAMP,
  
  -- Boleto específico
  boleto_barcode TEXT,
  boleto_pdf_url TEXT,
  boleto_bank_slip_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign Keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_payment_id ON payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Comentários
COMMENT ON TABLE payments IS 'Tabela de pagamentos integrada com Asaas (PIX, Boleto, Cartão)';
COMMENT ON COLUMN payments.asaas_payment_id IS 'ID da cobrança no Asaas';
COMMENT ON COLUMN payments.asaas_customer_id IS 'ID do cliente no Asaas';
COMMENT ON COLUMN payments.net_value IS 'Valor líquido recebido (após taxas)';
COMMENT ON COLUMN payments.payment_method IS 'Método: PIX | BOLETO | CREDIT_CARD';
COMMENT ON COLUMN payments.status IS 'Status: PENDING | RECEIVED | CONFIRMED | OVERDUE | CANCELLED';
