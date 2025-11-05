# 🔧 Troubleshooting - Integração Asaas

## 🐛 Problemas Comuns e Soluções

---

## ❌ Erro: "ASAAS_API_KEY não configurada no .env"

### Sintomas
```
❌ Erro na configuração do Asaas: ASAAS_API_KEY não configurada no .env
```

### Causa
Variável de ambiente não está definida ou o servidor não foi reiniciado.

### Solução
1. Verifique o arquivo `.env`:
```env
ASAAS_API_KEY=sua_api_key_aqui
```

2. Reinicie o servidor:
```bash
# Ctrl+C para parar
npm run dev
```

3. Confirme que a mensagem aparece no console:
```
✅ Asaas configurado: sandbox (https://sandbox.asaas.com/api/v3)
```

---

## ❌ Erro: "Webhook signature inválida"

### Sintomas
```
❌ Webhook signature inválida
```

### Causa
- `ASAAS_WEBHOOK_SECRET` incorreta ou não configurada
- Header de assinatura não está sendo enviado
- Payload foi modificado durante transmissão

### Solução

**1. Verificar configuração:**
```env
ASAAS_WEBHOOK_SECRET=sua_chave_secreta_webhook
```

**2. Verificar Dashboard Asaas:**
- Vá em **Webhooks**
- Confirme que a chave é a mesma do `.env`

**3. Desabilitar validação temporariamente (apenas DEV):**

No arquivo `src/services/paymentService.js`:
```javascript
validateWebhookSignature(payload, signature) {
  // Comentar temporariamente para testes
  return true; // ⚠️  APENAS PARA DESENVOLVIMENTO!
  
  // ...código original
}
```

**⚠️ IMPORTANTE:** Nunca desabilite em produção!

---

## ❌ Erro: "Plano não encontrado ou inativo"

### Sintomas
```
Plano não encontrado ou inativo
```

### Causa
- UUID do plano incorreto
- Plano foi desativado no banco

### Solução

**1. Verificar planos disponíveis:**
```sql
SELECT id, name, is_active FROM plans;
```

**2. Ativar plano se necessário:**
```sql
UPDATE plans SET is_active = true WHERE id = 'uuid-do-plano';
```

**3. Usar UUID correto no frontend:**
```javascript
{
  "planId": "abc123-...",  // UUID correto
  "paymentMethod": "PIX"
}
```

---

## ❌ Erro: "Usuário não encontrado"

### Sintomas
```
Usuário não encontrado
```

### Causa
- Token JWT inválido ou expirado
- Usuário foi deletado

### Solução

**1. Fazer login novamente:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha"}'
```

**2. Usar o novo token:**
```bash
Authorization: Bearer NOVO_TOKEN_AQUI
```

---

## ❌ Erro: "Erro ao criar cliente no gateway de pagamento"

### Sintomas
```
Erro ao criar cliente no gateway de pagamento
```

### Possíveis Causas
1. CPF inválido ou já cadastrado
2. Dados obrigatórios faltando
3. API Key inválida

### Solução

**1. Verificar dados do usuário:**
```sql
SELECT name, email, cpf, phone FROM users WHERE id = 'user-uuid';
```

**2. Verificar logs do servidor:**
```
❌ Erro ao criar cliente Asaas: [detalhes do erro]
```

**3. Testar API diretamente:**
```bash
curl -X POST https://sandbox.asaas.com/api/v3/customers \
  -H "access_token: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@example.com",
    "cpfCnpj": "12345678900"
  }'
```

---

## ❌ PIX não confirma automaticamente (Sandbox)

### Sintomas
Após criar pagamento PIX, ele fica em `PENDING` indefinidamente.

### Causa
- Webhook não está configurado
- URL do webhook incorreta
- Ngrok/localtunnel parou de funcionar

### Solução

**1. Verificar configuração do webhook:**
- Acesse: https://sandbox.asaas.com
- Vá em **Webhooks**
- Confirme URL: `https://seu-dominio.com/api/webhooks/asaas`

**2. Para testes locais, use ngrok:**
```bash
# Instalar ngrok
brew install ngrok

# Expor localhost
ngrok http 3000

# Copiar URL pública (ex: https://abc123.ngrok.io)
```

**3. Atualizar webhook no Asaas:**
- URL: `https://abc123.ngrok.io/api/webhooks/asaas`
- Salvar

**4. Aguardar 10 segundos após criar pagamento**

**5. Verificar logs do servidor:**
```
🔔 Webhook recebido: PAYMENT_RECEIVED - Payment: pay_abc123
✅ Plano ativado para usuário abc-123
```

**6. Se não aparecer, simular manualmente:**
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

## ❌ Cartão de Crédito Recusado

### Sintomas
```
{
  "success": false,
  "message": "Cartão recusado"
}
```

### Causa
- Cartão inválido
- Dados incorretos
- Limite excedido (produção)

### Solução (Sandbox)

**Use cartão de teste APROVADO:**
```
Número: 5162 3062 6025 3648
Nome: TESTE APROVADO
Validade: 12/2030
CVV: 123
```

**Cartão RECUSADO (para testar erro):**
```
Número: 5162 3062 6025 3621
```

---

## ❌ Erro: "Pagamento não encontrado"

### Sintomas
```
Pagamento não encontrado
```

### Causa
- UUID incorreto
- Pagamento pertence a outro usuário
- Pagamento não foi criado

### Solução

**1. Listar pagamentos do usuário:**
```bash
curl http://localhost:3000/api/payments \
  -H "Authorization: Bearer TOKEN"
```

**2. Verificar no banco:**
```sql
SELECT asaas_payment_id, user_id, status 
FROM payments 
WHERE asaas_payment_id = 'pay_abc123';
```

**3. Verificar se o UUID está correto:**
- Copiar do response ao criar pagamento
- Não usar UUID interno, usar `asaas_payment_id`

---

## ❌ Erro 401: Unauthorized

### Sintomas
```json
{
  "success": false,
  "message": "Token inválido ou expirado"
}
```

### Causa
- Token JWT expirado
- Token não enviado no header
- Token inválido

### Solução

**1. Verificar header:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**2. Fazer login novamente:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha"}'
```

**3. Verificar expiração do token:**
```env
JWT_EXPIRES_IN=7d  # No .env
```

---

## ❌ Migrations não executadas

### Sintomas
```
error: relation "payments" does not exist
```

### Causa
Tabelas não foram criadas no banco de dados.

### Solução

**1. Executar migrations no Supabase:**

Vá em **SQL Editor** e execute em ordem:
```sql
-- 1. Criar tabela payments
-- Cole: migrations/001_create_payments_table.sql

-- 2. Adicionar asaas_customer_id
-- Cole: migrations/002_add_asaas_customer_id_to_users.sql

-- 3. Adicionar plan_status
-- Cole: migrations/003_add_plan_status_to_users.sql
```

**2. Verificar se funcionou:**
```sql
SELECT * FROM payments LIMIT 1;
SELECT asaas_customer_id FROM users LIMIT 1;
```

---

## ❌ Webhook chegando mas plano não ativa

### Sintomas
Webhook recebido, mas `users.plan_status` não muda para `'active'`.

### Causa
- `externalReference` não está correto
- Erro ao atualizar banco de dados
- UUID do usuário inválido

### Solução

**1. Verificar logs:**
```
🔔 Webhook recebido: PAYMENT_RECEIVED - Payment: pay_abc123
❌ Erro ao confirmar pagamento: [detalhes]
```

**2. Verificar externalReference:**
```sql
SELECT 
  p.asaas_payment_id,
  p.user_id,
  u.id as user_exists
FROM payments p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.asaas_payment_id = 'pay_abc123';
```

**3. Ativar manualmente (temporário):**
```sql
UPDATE users 
SET 
  plan_id = 'uuid-do-plano',
  plan_status = 'active',
  plan_activated_at = NOW()
WHERE id = 'uuid-do-usuario';
```

---

## ❌ Erro: "Cannot read property 'id' of undefined"

### Sintomas
```
TypeError: Cannot read property 'id' of undefined
```

### Causa
Dados retornados do Asaas estão em formato diferente do esperado.

### Solução

**1. Adicionar logs para debug:**

Em `src/services/paymentService.js`:
```javascript
console.log('Response Asaas:', JSON.stringify(asaasResponse.data, null, 2));
```

**2. Verificar response do Asaas:**
- Pode ter mudado estrutura da API
- Consultar docs: https://docs.asaas.com

---

## ❌ Axios not found

### Sintomas
```
Error: Cannot find module 'axios'
```

### Solução
```bash
npm install axios
```

---

## 🔍 Debug Geral

### Verificar Status dos Serviços

**1. API está rodando?**
```bash
curl http://localhost:3000/health
```

**2. Asaas está online?**
```bash
curl https://status.asaas.com
```

**3. Banco de dados conectado?**
```sql
SELECT NOW();
```

### Habilitar Logs Detalhados

Em `src/services/paymentService.js`, adicione console.logs:
```javascript
console.log('📍 Criando pagamento:', { userId, planId, paymentMethod });
console.log('📍 Payload Asaas:', paymentPayload);
console.log('📍 Response Asaas:', asaasResponse.data);
```

### Testar Endpoints Manualmente

Use Postman, Insomnia ou cURL para testar cada endpoint isoladamente.

**Collection pronta:** `api-collection-payments.json`

---

## 📚 Recursos Adicionais

- **Docs Asaas:** https://docs.asaas.com
- **Status Asaas:** https://status.asaas.com
- **Suporte Asaas:** suporte@asaas.com | (16) 3025-3022
- **FAQ Asaas:** https://ajuda.asaas.com

---

## 🆘 Quando Pedir Ajuda

Se nenhuma solução acima resolver:

1. ✅ Reunir informações:
   - Logs completos do erro
   - Código relevante
   - Versão do Node.js
   - Ambiente (dev/prod)

2. ✅ Verificar documentação:
   - `PAYMENT_INTEGRATION.md`
   - `QUICK_START_PAYMENTS.md`

3. ✅ Contatar suporte Asaas:
   - Email: suporte@asaas.com
   - Tel: (16) 3025-3022
   - Chat: https://www.asaas.com

---

**Dica:** Mantenha os logs habilitados durante os primeiros dias em produção para detectar problemas rapidamente!
