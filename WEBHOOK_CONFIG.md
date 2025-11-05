# 🚀 Configuração Final - Webhook Asaas (Produção)

## 📍 URL do Backend
```
https://api.financialcontrol.com.br
```

## 🔔 Configurar Webhook no Asaas

### Passo 1: Acessar Dashboard Asaas
1. Acesse: https://www.asaas.com (PRODUÇÃO)
2. Faça login com sua conta
3. Vá em **Integrações** → **Webhooks**
4. Clique em **"Novo Webhook"** ou **"Adicionar Webhook"**

---

### Passo 2: Configurar o Webhook

Preencha os campos assim:

**URL do Webhook:**
```
https://api.financialcontrol.com.br/api/webhooks/asaas
```

**Eventos para Monitorar:**
Marque TODOS estes eventos:
- ✅ `PAYMENT_CREATED` - Cobrança criada
- ✅ `PAYMENT_UPDATED` - Cobrança atualizada
- ✅ `PAYMENT_CONFIRMED` - Pagamento confirmado (IMPORTANTE!)
- ✅ `PAYMENT_RECEIVED` - Pagamento recebido (IMPORTANTE!)
- ✅ `PAYMENT_OVERDUE` - Pagamento vencido
- ✅ `PAYMENT_DELETED` - Pagamento cancelado
- ✅ `PAYMENT_RESTORED` - Pagamento restaurado
- ✅ `PAYMENT_REFUNDED` - Pagamento estornado
- ✅ `PAYMENT_RECEIVED_IN_CASH_DELETED` - Confirmação de pagamento em dinheiro removida
- ✅ `PAYMENT_CHARGEBACK_REQUESTED` - Chargeback solicitado
- ✅ `PAYMENT_CHARGEBACK_DISPUTE` - Contestação de chargeback
- ✅ `PAYMENT_AWAITING_CHARGEBACK_REVERSAL` - Aguardando reversão de chargeback
- ✅ `PAYMENT_DUNNING_RECEIVED` - Recuperação de pagamento recebida
- ✅ `PAYMENT_DUNNING_REQUESTED` - Recuperação de pagamento solicitada
- ✅ `PAYMENT_BANK_SLIP_VIEWED` - Boleto visualizado
- ✅ `PAYMENT_CHECKOUT_VIEWED` - Checkout visualizado

**Status:**
- ✅ **ATIVO**

**Autenticação - Token de Acesso:**
```
1738a629219c35f20ad7f26c877be643d70abaf8928e072b4273c646f7ccc3c0
```

**Versão da API:** (deixe padrão ou selecione a mais recente)

**Interromper Envios em Caso de Erros:**
- ⚠️ **Desmarque** esta opção (para não parar os webhooks se houver erro temporário)

---

### Passo 3: Salvar e Testar

1. Clique em **"Salvar"** ou **"Criar Webhook"**
2. O Asaas vai mostrar a confirmação
3. Você pode ver o webhook na lista de "Meus Webhooks"

---

## 🧪 Testar Webhook

### Opção 1: Teste Manual no Asaas

Alguns dashboards do Asaas permitem testar o webhook:
1. Vá na lista de webhooks
2. Clique no webhook criado
3. Procure botão **"Testar"** ou **"Enviar Teste"**
4. Verifique os logs do seu servidor

### Opção 2: Criar Pagamento Real de Teste

```bash
# 1. Fazer login na API
curl -X POST https://api.financialcontrol.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "suasenha"
  }'

# 2. Copiar o token e criar pagamento de R$ 1,00
curl -X POST https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "uuid-do-plano",
    "paymentMethod": "PIX"
  }'

# 3. Pagar com app do banco
# Escaneie o QR Code ou cole o código PIX

# 4. Aguardar webhook (1-5 segundos)
# Verificar logs do servidor
```

---

## ✅ Verificar se Webhook Está Funcionando

### 1. Verificar Logs do Servidor

No seu servidor (Vercel, Render, Railway, etc), procure por:

```
🔔 Webhook recebido: PAYMENT_RECEIVED - Payment: pay_abc123
✅ Webhook processado: PAYMENT_RECEIVED
✅ Plano ativado para usuário abc-123
```

### 2. Verificar no Banco de Dados

Execute no Supabase SQL Editor:

```sql
-- Ver últimos webhooks processados
SELECT 
  asaas_payment_id,
  status,
  paid_at,
  confirmed_at,
  updated_at
FROM payments 
WHERE status IN ('RECEIVED', 'CONFIRMED')
ORDER BY updated_at DESC 
LIMIT 10;

-- Ver usuários com plano ativado recentemente
SELECT 
  name,
  email,
  plan_status,
  plan_activated_at
FROM users 
WHERE plan_status = 'active'
ORDER BY plan_activated_at DESC 
LIMIT 10;
```

### 3. Verificar no Dashboard Asaas

1. Vá em **Integrações** → **Webhooks**
2. Clique no webhook criado
3. Procure pela seção **"Histórico"** ou **"Logs"**
4. Verifique se há registros de envios
5. Status deve estar **"200 OK"** (sucesso)

---

## 🔍 Monitorar Webhooks

### Ver Tentativas Falhadas

No Dashboard Asaas:
- Se houver erro 500 ou timeout
- Asaas tenta reenviar automaticamente
- Você verá quantas tentativas foram feitas

### Headers Enviados pelo Asaas

O Asaas envia estes headers:
```
asaas-access-token: 1738a629219c35f20ad7f26c877be643d70abaf8928e072b4273c646f7ccc3c0
Content-Type: application/json
User-Agent: Asaas
```

Seu backend valida o `asaas-access-token` automaticamente! ✅

---

## 🐛 Troubleshooting

### Webhook não chega

**Possíveis causas:**
1. URL incorreta
2. Token incorreto
3. Servidor fora do ar
4. Firewall bloqueando

**Soluções:**
1. Verificar URL: `https://api.financialcontrol.com.br/api/webhooks/asaas`
2. Verificar token no `.env` é o mesmo do Asaas
3. Testar se API está online: `curl https://api.financialcontrol.com.br/health`
4. Verificar logs do servidor

### Webhook retorna erro 401

**Causa:** Token incorreto

**Solução:**
1. Copiar token do `.env`: `1738a629219c35f20ad7f26c877be643d70abaf8928e072b4273c646f7ccc3c0`
2. Colar exatamente no campo "Token de Acesso" do webhook no Asaas
3. Salvar novamente

### Webhook retorna erro 500

**Causa:** Erro no código do backend

**Solução:**
1. Verificar logs do servidor
2. Verificar se migrations foram executadas
3. Verificar se variáveis de ambiente estão corretas

---

## 📋 Checklist Final

- [ ] Webhook configurado no Asaas com URL: `https://api.financialcontrol.com.br/api/webhooks/asaas`
- [ ] Token configurado: `1738a629219c35f20ad7f26c877be643d70abaf8928e072b4273c646f7ccc3c0`
- [ ] Todos eventos de pagamento marcados
- [ ] Status: ATIVO
- [ ] Migrations executadas no banco de dados
- [ ] Variáveis de ambiente configuradas em produção
- [ ] Teste de pagamento realizado
- [ ] Webhook chegou e foi processado
- [ ] Plano foi ativado automaticamente

---

## 🎉 Pronto!

Agora quando um cliente pagar:
1. ✅ Asaas envia webhook automaticamente
2. ✅ Seu backend valida e processa
3. ✅ Plano do usuário é ativado
4. ✅ Cliente tem acesso liberado

**Tudo funcionando! 🚀**

---

## 📞 Contatos Úteis

- **Suporte Asaas:** suporte@asaas.com
- **Telefone:** (16) 3025-3022
- **Docs:** https://docs.asaas.com
- **Status:** https://status.asaas.com
