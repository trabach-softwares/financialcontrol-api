# 🚀 Quick Start - Pagamentos Asaas

## ⚡ Setup Rápido (5 minutos)

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `.env`:

```env
# Asaas Sandbox (para testes)
ASAAS_API_KEY=cole_sua_api_key_aqui
ASAAS_ENVIRONMENT=sandbox
ASAAS_WEBHOOK_SECRET=cole_sua_chave_webhook_aqui
```

**Onde obter:**
- API Key: https://sandbox.asaas.com → Integrações → API Key
- Webhook Secret: https://sandbox.asaas.com → Webhooks → Criar Webhook

---

### 2. Executar Migrations

No Supabase SQL Editor, execute em ordem:

```sql
-- 1. Criar tabela de pagamentos
-- Cole o conteúdo de: migrations/001_create_payments_table.sql

-- 2. Adicionar coluna asaas_customer_id
-- Cole o conteúdo de: migrations/002_add_asaas_customer_id_to_users.sql
```

---

### 3. Instalar Dependência

```bash
npm install
```

---

### 4. Iniciar Servidor

```bash
npm run dev
```

Você deve ver:
```
✅ Asaas configurado: sandbox (https://sandbox.asaas.com/api/v3)
Server running on port 3000
```

---

## 🧪 Teste Rápido com cURL

### Passo 1: Fazer Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "suasenha"
  }'
```

**Copie o token JWT da resposta!**

---

### Passo 2: Criar Pagamento PIX

```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "uuid-do-seu-plano",
    "paymentMethod": "PIX"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_abc123",
      "status": "PENDING",
      "value": 99.90
    },
    "pix": {
      "qrCodeImage": "data:image/png;base64,...",
      "payload": "00020126580014br.gov.bcb.pix...",
      "expiresAt": "2025-01-05T12:00:00Z"
    }
  }
}
```

---

### Passo 3: Aguardar Confirmação (Sandbox)

No sandbox, o pagamento é automaticamente aprovado após **10 segundos**.

Consulte o status:

```bash
curl http://localhost:3000/api/payments/pay_abc123 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Após 10 segundos, o status deve mudar para `RECEIVED` ou `CONFIRMED`.

---

## 💳 Teste com Cartão

```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "uuid-do-seu-plano",
    "paymentMethod": "CREDIT_CARD",
    "creditCard": {
      "number": "5162306260253648",
      "holderName": "TESTE APROVADO",
      "expiryDate": "12/2030",
      "cvv": "123"
    }
  }'
```

**Cartão aprovado imediatamente!** Status: `RECEIVED`

---

## 📄 Teste com Boleto

```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "uuid-do-seu-plano",
    "paymentMethod": "BOLETO"
  }'
```

**Resposta contém:**
- `boleto.pdfUrl` - Link do PDF
- `boleto.barcode` - Código de barras
- `boleto.bankSlipUrl` - Link do boleto

Para simular pagamento:
1. Acesse https://sandbox.asaas.com
2. Vá em **Cobranças**
3. Clique em **Confirmar Pagamento**

---

## 🔔 Testar Webhook Localmente

### Com ngrok:

```bash
# 1. Instalar ngrok
brew install ngrok  # macOS
# ou baixe em: https://ngrok.com/download

# 2. Expor localhost
ngrok http 3000

# 3. Copie a URL pública (ex: https://abc123.ngrok.io)

# 4. Configure no Asaas:
# URL: https://abc123.ngrok.io/api/webhooks/asaas
```

### Simular Webhook Manualmente:

```bash
curl -X POST http://localhost:3000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: sua_chave_webhook" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_abc123",
      "status": "RECEIVED",
      "value": 99.90,
      "netValue": 98.91,
      "confirmedDate": "2025-01-04T10:30:00Z",
      "externalReference": "uuid-do-usuario"
    }
  }'
```

---

## 📋 Verificar se Funcionou

### 1. Verificar Logs do Servidor

Você deve ver algo como:

```
📝 Criando cliente Asaas para usuário: user@example.com
✅ Cliente Asaas criado: cus_xyz789
💳 Criando cobrança Asaas (PIX) - R$ 99.90
✅ Cobrança criada no Asaas: pay_abc123
```

### 2. Consultar Banco de Dados

```sql
-- Ver pagamentos criados
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Ver usuários com plano ativo
SELECT id, name, email, plan_id, plan_status 
FROM users 
WHERE plan_status = 'active';
```

### 3. Testar no Frontend

Se o backend estiver funcionando, o frontend deve:
1. ✅ Criar pagamento com sucesso
2. ✅ Exibir QR Code PIX
3. ✅ Detectar pagamento confirmado (após 10s no sandbox)
4. ✅ Redirecionar usuário para dashboard

---

## ❌ Problemas Comuns

### "ASAAS_API_KEY não configurada"
- Verifique o arquivo `.env`
- Reinicie o servidor após alterar `.env`

### "Pagamento não encontrado"
- Confira se o `paymentId` está correto
- Verifique se o pagamento pertence ao usuário logado

### "Webhook signature inválida"
- Confirme a chave no `.env`
- Em dev, você pode desabilitar temporariamente a validação

### PIX não confirma automaticamente
- No sandbox, aguarde exatos 10 segundos
- Verifique os logs: deve aparecer "Webhook recebido"
- Confirme que o webhook está configurado

---

## ✅ Pronto!

Agora você pode:
- ✅ Criar pagamentos via API
- ✅ Processar PIX, Boleto e Cartão
- ✅ Receber webhooks do Asaas
- ✅ Ativar planos automaticamente

---

## 📚 Próximos Passos

1. Integre com o frontend
2. Personalize emails de confirmação
3. Adicione relatórios de pagamentos
4. Configure para produção (ASAAS_ENVIRONMENT=production)

**Documentação completa:** `PAYMENT_INTEGRATION.md`
