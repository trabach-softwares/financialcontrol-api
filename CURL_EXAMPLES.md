# 🔗 Exemplos de Requisições cURL

Este arquivo contém exemplos prontos de todas as requisições da API de pagamentos.

**⚠️ Importante:** Substitua os valores entre `<>` pelos valores reais!

---

## 🏥 Health Check

```bash
# Verificar se API está online
curl https://api.financialcontrol.com.br/health
```

---

## 🔐 Autenticação

### Registrar Novo Usuário

```bash
curl -X POST https://api.financialcontrol.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "Senha123!",
    "name": "Seu Nome",
    "cpf_cnpj": "12345678901"
  }'
```

### Login

```bash
curl -X POST https://api.financialcontrol.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "Senha123!"
  }'
```

**⚠️ Copie o `token` da resposta!**

---

## 📋 Planos

### Listar Planos Disponíveis

```bash
curl -X GET https://api.financialcontrol.com.br/api/plans \
  -H "Authorization: Bearer <SEU_TOKEN>"
```

**⚠️ Copie o `id` do plano que você quer assinar!**

---

## 💳 Pagamentos

### 1. Criar Pagamento PIX

```bash
curl -X POST https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer <SEU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "<UUID_DO_PLANO>",
    "paymentMethod": "PIX"
  }'
```

**Resposta contém:**
- `pix.payload`: Código Copia e Cola
- `pix.qrCodeUrl`: Imagem do QR Code (Base64)
- `invoice_url`: Link para visualizar no navegador

---

### 2. Criar Pagamento com Boleto

```bash
curl -X POST https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer <SEU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "<UUID_DO_PLANO>",
    "paymentMethod": "BOLETO"
  }'
```

**Resposta contém:**
- `boleto.barcode`: Código de barras
- `boleto.pdfUrl`: Link para PDF do boleto
- `invoice_url`: Link para visualizar no navegador

---

### 3. Criar Pagamento com Cartão de Crédito

```bash
curl -X POST https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer <SEU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "<UUID_DO_PLANO>",
    "paymentMethod": "CREDIT_CARD",
    "creditCard": {
      "holderName": "JOAO DA SILVA",
      "number": "5162306219378829",
      "expiryMonth": "12",
      "expiryYear": "2028",
      "ccv": "318"
    }
  }'
```

**⚠️ Em produção, use um cartão real!**

**Cartões de Teste (Sandbox):**
- ✅ Aprovado: `5162306219378829` | CCV: `318`
- ❌ Recusado: `5600510960358877` | CCV: `438`

---

### 4. Listar Pagamentos do Usuário

```bash
# Listar todos
curl -X GET https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer <SEU_TOKEN>"

# Com filtros
curl -X GET "https://api.financialcontrol.com.br/api/payments?status=CONFIRMED&limit=10" \
  -H "Authorization: Bearer <SEU_TOKEN>"
```

**Filtros disponíveis:**
- `status`: PENDING, RECEIVED, CONFIRMED, OVERDUE, CANCELLED
- `payment_method`: PIX, BOLETO, CREDIT_CARD
- `limit`: número máximo de resultados (padrão: 10)
- `offset`: pular N resultados (para paginação)

---

### 5. Consultar Status de um Pagamento

```bash
curl -X GET https://api.financialcontrol.com.br/api/payments/<PAYMENT_ID> \
  -H "Authorization: Bearer <SEU_TOKEN>"
```

---

### 6. Obter QR Code do PIX (novamente)

```bash
# Se você perdeu o QR Code ou ele expirou
curl -X GET https://api.financialcontrol.com.br/api/payments/<PAYMENT_ID>/pix \
  -H "Authorization: Bearer <SEU_TOKEN>"
```

**Retorna:**
- Novo QR Code
- Novo Payload
- Nova data de expiração

---

### 7. Cancelar Pagamento Pendente

```bash
curl -X DELETE https://api.financialcontrol.com.br/api/payments/<PAYMENT_ID> \
  -H "Authorization: Bearer <SEU_TOKEN>"
```

**⚠️ Só funciona para pagamentos com status PENDING!**

---

## 👤 Perfil do Usuário

### Buscar Dados do Usuário Logado

```bash
curl -X GET https://api.financialcontrol.com.br/api/users/me \
  -H "Authorization: Bearer <SEU_TOKEN>"
```

**Retorna:**
- Dados do usuário
- `plan_status`: active, inactive, cancelled
- `plan_activated_at`: data de ativação
- `plan_expires_at`: data de expiração

---

## 🔔 Webhook (Apenas para referência)

O webhook é chamado automaticamente pelo Asaas. Você não deve chamá-lo manualmente.

**URL do Webhook:**
```
https://api.financialcontrol.com.br/api/webhooks/asaas
```

**Headers enviados pelo Asaas:**
```
Content-Type: application/json
asaas-access-token: 1738a629219c35f20ad7f26c877be643d70abaf8928e072b4273c646f7ccc3c0
```

---

## 📊 Exemplos Completos

### Fluxo Completo: Criar Usuário → Assinar Plano → Pagar PIX

```bash
# 1. Registrar
REGISTER_RESPONSE=$(curl -s -X POST https://api.financialcontrol.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "Senha123!",
    "name": "Usuário Teste",
    "cpf_cnpj": "12345678901"
  }')

echo "Resposta do registro:"
echo "$REGISTER_RESPONSE" | jq .

# Extrair token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')
echo "Token: $TOKEN"

# 2. Listar planos
PLANS_RESPONSE=$(curl -s -X GET https://api.financialcontrol.com.br/api/plans \
  -H "Authorization: Bearer $TOKEN")

echo "Planos disponíveis:"
echo "$PLANS_RESPONSE" | jq .

# Extrair ID do primeiro plano
PLAN_ID=$(echo "$PLANS_RESPONSE" | jq -r '.data[0].id')
echo "Plan ID: $PLAN_ID"

# 3. Criar pagamento PIX
PAYMENT_RESPONSE=$(curl -s -X POST https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"planId\": \"$PLAN_ID\",
    \"paymentMethod\": \"PIX\"
  }")

echo "Pagamento criado:"
echo "$PAYMENT_RESPONSE" | jq .

# Extrair dados do PIX
PIX_PAYLOAD=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.pix.payload')
INVOICE_URL=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.invoice_url')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 PAGUE O PIX:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Link: $INVOICE_URL"
echo ""
echo "Copia e Cola:"
echo "$PIX_PAYLOAD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 4. Aguardar e verificar status (executar após pagar)
echo ""
echo "Aguarde ~5 segundos após pagar e execute:"
echo "curl -H 'Authorization: Bearer $TOKEN' https://api.financialcontrol.com.br/api/payments | jq ."
```

**⚠️ Requer `jq` instalado:** `brew install jq`

---

### Fluxo Simplificado (sem jq)

```bash
# 1. Registrar e obter token
curl -X POST https://api.financialcontrol.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "Senha123!",
    "name": "Usuário Teste",
    "cpf_cnpj": "12345678901"
  }'

# Copie o TOKEN da resposta acima

# 2. Listar planos
curl -X GET https://api.financialcontrol.com.br/api/plans \
  -H "Authorization: Bearer <SEU_TOKEN>"

# Copie o PLAN_ID da resposta acima

# 3. Criar pagamento PIX
curl -X POST https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer <SEU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "<PLAN_ID>",
    "paymentMethod": "PIX"
  }'

# Pague o PIX usando o QR Code ou Copia e Cola

# 4. Verificar status após ~5 segundos
curl -X GET https://api.financialcontrol.com.br/api/payments \
  -H "Authorization: Bearer <SEU_TOKEN>"

# 5. Verificar se plano foi ativado
curl -X GET https://api.financialcontrol.com.br/api/users/me \
  -H "Authorization: Bearer <SEU_TOKEN>"
```

---

## 🐛 Troubleshooting

### Erro: "Token inválido" ou 401

**Causa:** Token expirou ou está incorreto

**Solução:**
1. Faça login novamente para obter novo token
2. Verifique se copiou o token completo
3. Token tem validade de 30 minutos (configurável no .env)

---

### Erro: "Plan not found"

**Causa:** ID do plano não existe

**Solução:**
1. Liste os planos disponíveis
2. Copie o ID exato (UUID)

---

### Erro: "Payment not found"

**Causa:** Pagamento não existe ou pertence a outro usuário

**Solução:**
1. Liste seus pagamentos
2. Verifique se usou o ID correto

---

## 💡 Dicas

1. **Salve o token:** Ele é necessário em todas as requisições autenticadas
2. **Use Postman/Insomnia:** Importe o `api-collection-payments.json` para facilitar
3. **Monitore os logs:** Acompanhe o servidor em tempo real
4. **Teste PIX primeiro:** É o mais rápido (1-5 segundos)
5. **Valores baixos:** Use R$ 1,00 ou R$ 0,01 para testes

---

## 📦 Importar Collection

Se preferir usar Postman ou Insomnia:

```bash
# O arquivo já está no projeto
./api-collection-payments.json
```

**No Postman:**
1. File → Import
2. Selecione `api-collection-payments.json`
3. Configure a variável `{{baseUrl}}` = `https://api.financialcontrol.com.br`
4. Configure a variável `{{token}}` após fazer login

**No Insomnia:**
1. Application → Import/Export
2. Import Data → From File
3. Selecione `api-collection-payments.json`
