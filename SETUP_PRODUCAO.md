# 🚀 Setup Rápido - Produção Asaas

## ⚠️ IMPORTANTE: Migrations Obrigatórias

Antes de testar pagamentos, você **DEVE** executar as migrations no banco de dados!

### Passo 1: Acessar Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto: **dzozpxmdvbrkdtipynhy**
3. Clique em **SQL Editor** (no menu lateral)
4. Clique em **New Query**

---

### Passo 2: Executar Migration 001 (Tabela Payments)

Cole e execute este SQL:

\`\`\`sql
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
  net_value DECIMAL(10, 2),
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  
  -- Datas
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  
  -- URLs e dados específicos
  invoice_url TEXT,
  transaction_receipt_url TEXT,
  
  -- PIX específico
  pix_payload TEXT,
  pix_qr_code_image TEXT,
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_payment_id ON payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Trigger para updated_at
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
\`\`\`

✅ Clique em **RUN** e aguarde "Success"

---

### Passo 3: Executar Migration 002 (Campo asaas_customer_id)

Nova query, cole e execute:

\`\`\`sql
-- Adicionar coluna para armazenar ID do cliente no Asaas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255) UNIQUE;

-- Índice
CREATE INDEX IF NOT EXISTS idx_users_asaas_customer_id ON users(asaas_customer_id);
\`\`\`

✅ Clique em **RUN**

---

### Passo 4: Executar Migration 003 (Status do Plano)

Nova query, cole e execute:

\`\`\`sql
-- Adicionar campos de controle de status do plano
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMP;

-- Índice
CREATE INDEX IF NOT EXISTS idx_users_plan_status ON users(plan_status);

-- Atualizar usuários existentes com plano
UPDATE users 
SET plan_status = 'active', 
    plan_activated_at = NOW() 
WHERE plan_id IS NOT NULL 
  AND plan_status IS NULL;
\`\`\`

✅ Clique em **RUN**

---

### Passo 5: Verificar se Funcionou

Execute esta query para validar:

\`\`\`sql
-- Verificar tabela payments
SELECT COUNT(*) as total_payments FROM payments;

-- Verificar colunas novas em users
SELECT 
  asaas_customer_id, 
  plan_status, 
  plan_activated_at 
FROM users 
LIMIT 1;
\`\`\`

✅ Deve retornar sem erros!

---

## 🔧 Configuração do Webhook

### URL do Webhook em Produção:

Seu backend está rodando em qual URL? Exemplos:

- **Vercel:** `https://seu-app.vercel.app/api/webhooks/asaas`
- **Render:** `https://seu-app.onrender.com/api/webhooks/asaas`
- **Railway:** `https://seu-app.railway.app/api/webhooks/asaas`
- **Heroku:** `https://seu-app.herokuapp.com/api/webhooks/asaas`

### Configurar no Dashboard Asaas:

1. Acesse: https://www.asaas.com (produção)
2. Vá em **Integrações** → **Webhooks**
3. Clique em **Novo Webhook**
4. Configure:
   - **URL:** Sua URL de produção + `/api/webhooks/asaas`
   - **Eventos:** Marcar todos de pagamento
   - **Token de Acesso:** `1738a629219c35f20ad7f26c877be643d70abaf8928e072b4273c646f7ccc3c0`
   - **Status:** Ativo

---

## 🧪 Testar em Produção

### 1. Fazer Login
\`\`\`bash
curl -X POST https://sua-url-producao.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "seu@email.com",
    "password": "suasenha"
  }'
\`\`\`

### 2. Criar Pagamento PIX Real
\`\`\`bash
curl -X POST https://sua-url-producao.com/api/payments \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "planId": "uuid-do-plano",
    "paymentMethod": "PIX"
  }'
\`\`\`

### 3. Pagar com App do Banco
- Use o app do seu banco
- Escaneie o QR Code ou cole o código PIX
- Faça o pagamento

### 4. Verificar Webhook
- Aguarde 1-5 segundos
- O webhook deve chegar automaticamente
- Verifique os logs do servidor

---

## ✅ Pronto!

Após executar as migrations e configurar o webhook, sua API está pronta para processar pagamentos reais! 🚀

**IMPORTANTE:** Comece com valores baixos (R$ 1,00) para validar todo o fluxo antes de usar valores reais.
