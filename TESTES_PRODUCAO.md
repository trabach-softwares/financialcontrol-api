# 🧪 Guia de Testes em Produção

## 📋 Pré-requisitos

Antes de testar, verifique se:

- ✅ **Migrations executadas** no Supabase
- ✅ **Webhook configurado** no Asaas
- ✅ **API em produção** rodando em `https://api.financialcontrol.com.br`
- ✅ **Variáveis de ambiente** configuradas corretamente
- ✅ **Conta ativa** no Asaas (produção)

---

## 🎯 Fluxo Completo de Teste

### 1️⃣ Testar Health Check da API

```bash
# Verificar se API está online
curl https://api.financialcontrol.com.br/health

# Resposta esperada:
# {
#   "success": true,
#   "message": "API is healthy",
#   "timestamp": "2025-11-04T..."
# }
```

---

### 2️⃣ Criar/Login de Usuário

```bash
# Opção A: Registrar novo usuário
curl -X POST https://api.financialcontrol.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "Senha123!",
    "name": "Usuário Teste",
    "cpf_cnpj": "12345678901"
  }'

# Opção B: Fazer login com usuário existente
curl -X POST https://api.financialcontrol.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "suasenha"
  }'

# Resposta esperada:
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#     "user": {
#       "id": "abc-123-...",
#       "email": "teste@exemplo.com",
#       "name": "Usuário Teste"
#     }
#   }
# }
```

**⚠️ IMPORTANTE:** Copie o `token` da resposta! Você vai usar em todos os próximos requests.

---

### 3️⃣ Listar Planos Disponíveis

```bash
# Substitua SEU_TOKEN pelo token recebido no login
curl -X GET https://api.financialcontrol.com.br/api/plans \
  -H "Authorization: Bearer SEU_TOKEN"

# Resposta esperada:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "uuid-do-plano-1",
#       "name": "Plano Básico",
#       "price": 29.90,
#       "billing_cycle": "monthly"
#     },
#     {
#       "id": "uuid-do-plano-2",
#       "name": "Plano Premium",
#       "price": 49.90,
#       "billing_cycle": "monthly"
#     }
#   ]
# }
```

**⚠️ IMPORTANTE:** Copie o `id` do plano que você quer testar!

---

### 4️⃣ Criar Pagamento PIX (Teste Real)

```bash
# Criar pagamento PIX de R$ 0,01 para teste
curl -X POST https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "uuid-do-plano",
    "paymentMethod": "PIX"
  }'

# Resposta esperada:
# {
#   "success": true,
#   "data": {
#     "id": "abc-123",
#     "asaas_payment_id": "pay_xyz789",
#     "status": "PENDING",
#     "value": 29.90,
#     "payment_method": "PIX",
#     "due_date": "2025-11-05",
#     "pix": {
#       "payload": "00020126...9999",
#       "qrCodeUrl": "data:image/png;base64,iVBOR...",
#       "expiresAt": "2025-11-04T23:59:59Z"
#     },
#     "invoice_url": "https://www.asaas.com/i/xyz789"
#   }
# }
```

**✅ O que você recebe:**
- `pix.payload`: Código PIX (Copia e Cola)
- `pix.qrCodeUrl`: Imagem do QR Code (Base64 - mostrar no frontend)
- `invoice_url`: Link para visualizar boleto no navegador

---

### 5️⃣ Pagar o PIX

**Opções para pagar:**

#### 🔹 Opção 1: QR Code (Recomendado)
1. Mostre a imagem do QR Code no seu frontend
2. Abra o app do seu banco
3. Escaneie o QR Code
4. Confirme o pagamento

#### 🔹 Opção 2: Copia e Cola
1. Copie o `pix.payload`
2. Abra o app do seu banco
3. Vá em PIX → Pagar → Pix Copia e Cola
4. Cole o código
5. Confirme o pagamento

#### 🔹 Opção 3: Simular Pagamento no Asaas (Sandbox)
⚠️ **Só funciona em SANDBOX!** Em produção você precisa pagar de verdade.

---

### 6️⃣ Aguardar Confirmação (1-5 segundos)

Após pagar o PIX, o Asaas envia webhook automaticamente:

1. **Imediatamente:** `PAYMENT_RECEIVED` (pagamento detectado)
2. **1-5 segundos depois:** `PAYMENT_CONFIRMED` (pagamento confirmado)

✅ **Seu backend vai:**
- Receber o webhook
- Validar o token
- Atualizar status do pagamento para `RECEIVED` ou `CONFIRMED`
- Ativar o plano do usuário (`plan_status = 'active'`)

---

### 7️⃣ Verificar Status do Pagamento

```bash
# Verificar se pagamento foi confirmado
curl -X GET https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer SEU_TOKEN"

# Resposta esperada (APÓS pagamento):
# {
#   "success": true,
#   "data": {
#     "payments": [
#       {
#         "id": "abc-123",
#         "status": "CONFIRMED",
#         "value": 29.90,
#         "paid_at": "2025-11-04T15:30:00Z",
#         "confirmed_at": "2025-11-04T15:30:05Z"
#       }
#     ]
#   }
# }
```

**Status possíveis:**
- `PENDING`: Aguardando pagamento
- `RECEIVED`: Pagamento detectado
- `CONFIRMED`: Pagamento confirmado ✅
- `OVERDUE`: Vencido
- `CANCELLED`: Cancelado

---

### 8️⃣ Verificar se Plano foi Ativado

```bash
# Buscar dados do usuário logado
curl -X GET https://api.financialcontrol.com.br/api/users/me \
  -H "Authorization: Bearer SEU_TOKEN"

# Resposta esperada (APÓS pagamento confirmado):
# {
#   "success": true,
#   "data": {
#     "id": "abc-123",
#     "email": "teste@exemplo.com",
#     "name": "Usuário Teste",
#     "plan_id": "uuid-do-plano",
#     "plan_status": "active",        ← DEVE ESTAR "active"
#     "plan_activated_at": "2025-11-04T15:30:05Z",
#     "plan_expires_at": "2025-12-04T15:30:05Z"
#   }
# }
```

---

## 🧪 Testar Outros Métodos de Pagamento

### 💳 Boleto Bancário

```bash
curl -X POST https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "uuid-do-plano",
    "paymentMethod": "BOLETO"
  }'

# Resposta:
# {
#   "success": true,
#   "data": {
#     "status": "PENDING",
#     "boleto": {
#       "barcode": "34191.79001 01043.510047 91020.150008 1 96610000002990",
#       "pdfUrl": "https://www.asaas.com/b/pdf/xyz789"
#     },
#     "invoice_url": "https://www.asaas.com/i/xyz789"
#   }
# }
```

**Para pagar:**
1. Acesse o `pdfUrl` e baixe o PDF
2. Pague no internet banking ou caixa eletrônico
3. ⏳ Webhook chega em **1-3 dias úteis**

---

### 💳 Cartão de Crédito

```bash
curl -X POST https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "uuid-do-plano",
    "paymentMethod": "CREDIT_CARD",
    "creditCard": {
      "holderName": "JOAO DA SILVA",
      "number": "5162306219378829",
      "expiryMonth": "12",
      "expiryYear": "2028",
      "ccv": "318"
    }
  }'

# ⚠️ Em PRODUÇÃO, use cartão real!
# ⚠️ Em SANDBOX, use cartões de teste do Asaas

# Resposta (aprovado instantaneamente):
# {
#   "success": true,
#   "data": {
#     "status": "CONFIRMED",     ← JÁ CONFIRMADO!
#     "paid_at": "2025-11-04T15:30:00Z",
#     "confirmed_at": "2025-11-04T15:30:00Z"
#   }
# }
```

**Cartões de Teste Asaas (SANDBOX):**
```
✅ Aprovado:
   5162306219378829 | CCV: 318 | Qualquer data futura

❌ Recusado (saldo insuficiente):
   5600510960358877 | CCV: 438 | Qualquer data futura

❌ Recusado (genérico):
   5616459779624447 | CCV: 886 | Qualquer data futura
```

---

## 🔍 Verificar Logs e Webhooks

### 1. Logs do Servidor

**Se estiver usando Vercel:**
```bash
vercel logs https://api.financialcontrol.com.br
```

**Se estiver usando Render/Railway:**
- Acesse o dashboard
- Vá em "Logs" ou "Runtime Logs"

**Procure por:**
```
🔔 Webhook recebido: PAYMENT_RECEIVED - Payment: pay_xyz789
✅ Webhook processado com sucesso: PAYMENT_RECEIVED
✅ Plano ativado para usuário abc-123
```

---

### 2. Logs no Asaas

1. Acesse https://www.asaas.com
2. Vá em **Integrações** → **Webhooks**
3. Clique no webhook configurado
4. Veja o **Histórico de Envios**

**Deve aparecer:**
- ✅ Status: `200 OK` (sucesso)
- ⏰ Horário do envio
- 📄 Payload enviado
- 📊 Resposta do seu servidor

---

### 3. Verificar no Banco de Dados

Execute no **Supabase SQL Editor**:

```sql
-- Ver todos pagamentos do usuário
SELECT 
  id,
  asaas_payment_id,
  value,
  payment_method,
  status,
  paid_at,
  confirmed_at,
  created_at
FROM payments 
WHERE user_id = 'abc-123'  -- ← Substitua pelo ID do usuário
ORDER BY created_at DESC;

-- Ver status do plano do usuário
SELECT 
  id,
  name,
  email,
  plan_id,
  plan_status,
  plan_activated_at,
  plan_expires_at
FROM users 
WHERE email = 'teste@exemplo.com';  -- ← Substitua pelo email do usuário
```

---

## 🐛 Troubleshooting

### ❌ Erro: "Payment not found"

**Causa:** ID do pagamento incorreto ou pagamento de outro usuário

**Solução:**
```bash
# Listar todos os pagamentos do usuário logado
curl -X GET https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

### ❌ Erro: "Plan not found"

**Causa:** ID do plano não existe

**Solução:**
```bash
# Listar planos disponíveis
curl -X GET https://api.financialcontrol.com.br/api/plans \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

### ❌ Webhook não chega

**Possíveis causas:**
1. Webhook não configurado no Asaas
2. URL incorreta
3. Token incorreto
4. Servidor fora do ar

**Solução:**
1. Verifique configuração em Asaas Dashboard
2. URL deve ser: `https://api.financialcontrol.com.br/api/webhooks/asaas`
3. Token deve ser: `1738a629219c35f20ad7f26c877be643d70abaf8928e072b4273c646f7ccc3c0`
4. Teste health check: `curl https://api.financialcontrol.com.br/health`

---

### ❌ Erro 401 no webhook

**Causa:** Token de webhook incorreto

**Solução:**
1. Verifique no `.env` da produção: `ASAAS_WEBHOOK_SECRET`
2. Verifique no Asaas Dashboard: Token de Acesso do webhook
3. Devem ser EXATAMENTE iguais!

---

### ❌ Plano não ativa automaticamente

**Causa:** Webhook não foi processado corretamente

**Solução:**
1. Verifique logs do servidor
2. Verifique histórico de webhooks no Asaas
3. Ative manualmente:

```sql
-- Ativar plano manualmente no banco (EMERGÊNCIA)
UPDATE users 
SET 
  plan_status = 'active',
  plan_activated_at = NOW(),
  plan_expires_at = NOW() + INTERVAL '30 days'
WHERE email = 'teste@exemplo.com';

-- Atualizar pagamento manualmente
UPDATE payments 
SET 
  status = 'CONFIRMED',
  paid_at = NOW(),
  confirmed_at = NOW()
WHERE asaas_payment_id = 'pay_xyz789';
```

---

## ✅ Checklist de Teste Completo

### Preparação
- [ ] API está online (`/health` retorna 200)
- [ ] Migrations executadas
- [ ] Webhook configurado no Asaas
- [ ] Variáveis de ambiente corretas

### Fluxo PIX
- [ ] Criar usuário ou fazer login
- [ ] Listar planos disponíveis
- [ ] Criar pagamento PIX
- [ ] Receber QR Code e payload
- [ ] Pagar PIX pelo app do banco
- [ ] Webhook é recebido em 1-5 segundos
- [ ] Status do pagamento muda para CONFIRMED
- [ ] Plano do usuário é ativado (`plan_status = active`)

### Fluxo Boleto (Opcional)
- [ ] Criar pagamento Boleto
- [ ] Receber código de barras e PDF
- [ ] Pagar boleto (demora 1-3 dias úteis)
- [ ] Webhook é recebido após compensação
- [ ] Plano é ativado

### Fluxo Cartão (Opcional)
- [ ] Criar pagamento com Cartão de Crédito
- [ ] Pagamento é aprovado instantaneamente
- [ ] Status já vem como CONFIRMED
- [ ] Plano é ativado imediatamente

### Validação
- [ ] Logs do servidor mostram webhook recebido
- [ ] Histórico de webhooks no Asaas mostra 200 OK
- [ ] Banco de dados mostra payment com status CONFIRMED
- [ ] Banco de dados mostra user com plan_status = active
- [ ] Frontend consegue detectar que usuário tem plano ativo

---

## 🎉 Teste Bem-Sucedido!

Se todos os checkboxes acima estiverem marcados, **seu sistema está funcionando perfeitamente!** 🚀

---

## 📞 Dúvidas?

- **Documentação Asaas:** https://docs.asaas.com
- **Suporte Asaas:** suporte@asaas.com
- **Status Asaas:** https://status.asaas.com

---

## 💡 Dicas Finais

1. **Comece com PIX:** É o mais rápido para testar (1-5 segundos)
2. **Use valores baixos:** R$ 1,00 é suficiente para teste
3. **Monitore os logs:** Sempre verifique logs durante testes
4. **Teste todos os métodos:** PIX, Boleto e Cartão têm fluxos diferentes
5. **Verifique o banco:** Confirme que dados foram salvos corretamente
