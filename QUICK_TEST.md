# 🚀 Como Testar em Produção - Guia Rápido

## ✅ Pré-requisitos

Antes de começar, certifique-se de que:

1. ✅ **Migrations foram executadas** no Supabase
2. ✅ **Webhook está configurado** no Asaas
3. ✅ **API está rodando** em produção

---

## 🎯 Opção 1: Teste Automatizado (Recomendado)

Execute o script que testa o fluxo completo automaticamente:

```bash
./test-payment.sh
```

**O script faz:**
1. ✅ Verifica se API está online
2. ✅ Cria um novo usuário de teste
3. ✅ Lista os planos disponíveis
4. ✅ Cria um pagamento PIX
5. ⏸️ Aguarda você pagar o PIX
6. ✅ Monitora o status do pagamento
7. ✅ Verifica se o plano foi ativado
8. ✅ Mostra um resumo completo

**Duração:** 2-5 minutos (depende de quanto tempo leva para você pagar)

---

## 🎯 Opção 2: Teste Manual com cURL

### Passo 1: Registrar e fazer login

```bash
# 1. Registrar novo usuário
curl -X POST https://api.financialcontrol.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "Senha123!",
    "name": "Seu Nome",
    "cpf_cnpj": "12345678901"
  }'

# ⚠️ COPIE O TOKEN da resposta!
```

### Passo 2: Listar planos

```bash
# 2. Listar planos (substitua SEU_TOKEN)
curl -X GET https://api.financialcontrol.com.br/api/plans \
  -H "Authorization: Bearer SEU_TOKEN"

# ⚠️ COPIE O ID do plano que você quer testar!
```

### Passo 3: Criar pagamento PIX

```bash
# 3. Criar pagamento PIX (substitua SEU_TOKEN e PLAN_ID)
curl -X POST https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "PLAN_ID",
    "paymentMethod": "PIX"
  }'

# A resposta contém:
# - pix.payload (Copia e Cola)
# - pix.qrCodeUrl (QR Code em Base64)
# - invoice_url (link para visualizar)
```

### Passo 4: Pagar o PIX

1. Copie o `pix.payload` ou abra o `invoice_url`
2. Abra o app do seu banco
3. Vá em PIX → Pagar
4. Escaneie o QR Code ou cole o código
5. Confirme o pagamento

### Passo 5: Verificar status

```bash
# Aguarde 5 segundos e verifique
curl -X GET https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer SEU_TOKEN"

# Status deve estar: CONFIRMED ou RECEIVED
```

### Passo 6: Verificar se plano foi ativado

```bash
curl -X GET https://api.financialcontrol.com.br/api/users/me \
  -H "Authorization: Bearer SEU_TOKEN"

# Verifique: plan_status deve ser "active"
```

**Duração:** 5-10 minutos

---

## 🎯 Opção 3: Usar Postman/Insomnia

1. Importe o arquivo: `api-collection-payments.json`
2. Configure a variável `baseUrl` = `https://api.financialcontrol.com.br`
3. Faça login e copie o token
4. Configure a variável `token` com o valor copiado
5. Execute as requisições na ordem:
   - Register ou Login
   - List Plans
   - Create Payment (PIX)
   - (Pague o PIX)
   - Get Payment Status
   - Get User Profile

**Duração:** 5-10 minutos

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **`TESTES_PRODUCAO.md`**: Guia completo com todos os cenários de teste
- **`CURL_EXAMPLES.md`**: Todos os exemplos de cURL prontos para usar
- **`WEBHOOK_CONFIG.md`**: Como configurar o webhook no Asaas
- **`test-payment.sh`**: Script de teste automatizado

---

## 🐛 Problemas Comuns

### ❌ API não responde

```bash
# Verificar se está online
curl https://api.financialcontrol.com.br/health
```

### ❌ Erro 401 (Token inválido)

- Faça login novamente para obter novo token
- Token expira em 30 minutos

### ❌ Webhook não chega

1. Verifique configuração no Asaas Dashboard
2. URL: `https://api.financialcontrol.com.br/api/webhooks/asaas`
3. Token: `1738a629219c35f20ad7f26c877be643d70abaf8928e072b4273c646f7ccc3c0`

### ❌ Plano não ativa

- Verifique logs do servidor
- Verifique histórico de webhooks no Asaas
- Execute query no Supabase para verificar status

---

## ✅ Checklist de Sucesso

Seu teste foi bem-sucedido se:

- [ ] API responde no `/health`
- [ ] Consegue criar usuário ou fazer login
- [ ] Consegue listar planos
- [ ] Consegue criar pagamento PIX
- [ ] Recebe QR Code e Copia e Cola
- [ ] Consegue pagar o PIX pelo app do banco
- [ ] Status do pagamento muda para CONFIRMED em ~5 segundos
- [ ] `plan_status` do usuário muda para `active`
- [ ] Logs mostram webhook recebido

---

## 🎉 Pronto!

Escolha uma das 3 opções acima e comece a testar! 🚀

**Recomendação:** Comece com o **script automatizado** (`./test-payment.sh`) - é o mais rápido e fácil!
