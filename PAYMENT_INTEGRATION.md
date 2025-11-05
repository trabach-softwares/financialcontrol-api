# 💳 Integração de Pagamentos - Asaas

Sistema de pagamentos integrado com Asaas, suportando **PIX**, **Boleto Bancário** e **Cartão de Crédito**.

---

## 🚀 Configuração Inicial

### 1. Criar Conta no Asaas

1. Acesse: https://www.asaas.com
2. Crie uma conta gratuita
3. Faça login no Dashboard

### 2. Obter Credenciais de Sandbox

Para testes, use o ambiente **Sandbox**:

1. Acesse: https://sandbox.asaas.com
2. Vá em **Integrações** → **API Key**
3. Copie a **API Key de Sandbox**
4. Cole no arquivo `.env`:

```env
ASAAS_API_KEY=your_sandbox_api_key_here
ASAAS_ENVIRONMENT=sandbox
```

### 3. Configurar Webhook

O webhook permite que o Asaas notifique sua aplicação quando um pagamento é confirmado.

1. No Dashboard Asaas, vá em **Webhooks**
2. Clique em **Novo Webhook**
3. Configure:
   - **URL**: `https://seu-dominio.com/api/webhooks/asaas`
   - **Eventos**: Marque todos os eventos de pagamento
   - **Autenticação**: Gere uma chave secreta
4. Copie a **Chave Secreta** e adicione no `.env`:

```env
ASAAS_WEBHOOK_SECRET=your_webhook_secret_here
```

**Nota para desenvolvimento local:**
- Use **ngrok** ou **localtunnel** para expor localhost
- Exemplo: `ngrok http 3000`
- Use a URL pública gerada: `https://abc123.ngrok.io/api/webhooks/asaas`

### 4. Executar Migrations

Execute os scripts SQL para criar as tabelas necessárias:

```bash
# No seu cliente PostgreSQL/Supabase, execute:
# 1. migrations/001_create_payments_table.sql
# 2. migrations/002_add_asaas_customer_id_to_users.sql
```

Ou via Supabase Dashboard:
1. Vá em **SQL Editor**
2. Cole e execute cada migration

### 5. Instalar Dependências

```bash
npm install axios
```

### 6. Iniciar Servidor

```bash
npm run dev
```

---

## 🧪 Testes no Sandbox

### Cartões de Teste

**✅ Cartão Aprovado:**
```
Número: 5162306260253648
Nome: Qualquer nome
Validade: Qualquer data futura (ex: 12/2030)
CVV: Qualquer (ex: 123)
```

**❌ Cartão Recusado:**
```
Número: 5162306260253621
Nome: Qualquer nome
Validade: Qualquer data futura
CVV: Qualquer
```

### PIX (Sandbox)

No ambiente sandbox, o pagamento PIX é **automaticamente aprovado após 10 segundos**.

**Fluxo de teste:**
1. Crie um pagamento via API
2. Receba o QR Code
3. Aguarde 10 segundos
4. O webhook será disparado automaticamente
5. Consulte o status do pagamento

### Boleto (Sandbox)

**Fluxo de teste:**
1. Crie um pagamento via API
2. Receba o PDF do boleto
3. Para simular pagamento:
   - Acesse Dashboard Asaas → **Cobranças**
   - Encontre a cobrança
   - Clique em **Ações** → **Confirmar Pagamento**
4. O webhook será disparado

---

## 📡 Endpoints Disponíveis

### 1. Criar Pagamento

**POST** `/api/payments`

```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "uuid-do-plano",
    "paymentMethod": "PIX"
  }'
```

**Métodos aceitos:**
- `PIX` - Pagamento instantâneo via QR Code
- `BOLETO` - Boleto bancário
- `CREDIT_CARD` - Cartão de crédito (adicionar objeto `creditCard`)

### 2. Consultar Pagamento

**GET** `/api/payments/:paymentId`

```bash
curl http://localhost:3000/api/payments/pay_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Obter QR Code PIX

**GET** `/api/payments/:paymentId/pix`

```bash
curl http://localhost:3000/api/payments/pay_abc123/pix \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Listar Pagamentos

**GET** `/api/payments?status=PENDING&limit=10`

```bash
curl "http://localhost:3000/api/payments?status=PENDING" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Cancelar Pagamento

**DELETE** `/api/payments/:paymentId`

```bash
curl -X DELETE http://localhost:3000/api/payments/pay_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔔 Webhook

O endpoint de webhook recebe notificações do Asaas sobre mudanças de status:

**Endpoint:** `POST /api/webhooks/asaas`

**Eventos tratados:**
- `PAYMENT_RECEIVED` - Pagamento recebido
- `PAYMENT_CONFIRMED` - Pagamento confirmado
- `PAYMENT_OVERDUE` - Pagamento vencido
- `PAYMENT_DELETED` - Pagamento cancelado
- `PAYMENT_REFUNDED` - Pagamento estornado

**Quando um pagamento é confirmado:**
1. ✅ Status do pagamento é atualizado no banco
2. ✅ Plano do usuário é ativado (`users.plan_id`)
3. ✅ Campo `plan_status` atualizado para `'active'`
4. ✅ Data de ativação registrada (`plan_activated_at`)

---

## 🔍 Verificar Logs

Os logs ajudam a debugar problemas:

```bash
# Ver logs do servidor
npm run dev

# Logs importantes:
# ✅ Asaas configurado: sandbox (https://sandbox.asaas.com/api/v3)
# 📝 Criando cliente Asaas para usuário: user@example.com
# 💳 Criando cobrança Asaas (PIX) - R$ 99.90
# 🔔 Webhook recebido: PAYMENT_RECEIVED - Payment: pay_abc123
# ✅ Plano ativado para usuário abc-123
```

---

## 🐛 Troubleshooting

### Erro: "ASAAS_API_KEY não configurada"

**Solução:** Verifique se o `.env` contém a API Key:
```env
ASAAS_API_KEY=sua_api_key_aqui
```

### Erro: "Webhook signature inválida"

**Possíveis causas:**
1. `ASAAS_WEBHOOK_SECRET` não configurada
2. Chave incorreta no `.env`
3. Payload modificado durante transmissão

**Solução:** 
- Em desenvolvimento, você pode comentar temporariamente a validação no código
- Verifique se a chave no `.env` é a mesma do Dashboard Asaas

### Pagamento PIX não é confirmado automaticamente

**Em Sandbox:**
- Aguarde 10 segundos após criar o pagamento
- Verifique se o webhook está configurado corretamente
- Veja os logs do servidor para verificar se o webhook chegou

**Em Produção:**
- Pagamento real é necessário
- O Asaas envia webhook quando o PIX é pago

### Erro: "Pagamento não encontrado"

**Causas:**
1. O `paymentId` está incorreto
2. O pagamento pertence a outro usuário
3. Pagamento não foi criado corretamente

**Solução:**
- Verifique o ID do pagamento
- Liste os pagamentos do usuário: `GET /api/payments`

---

## 📊 Status de Pagamentos

| Status | Descrição |
|--------|-----------|
| `PENDING` | Aguardando pagamento |
| `RECEIVED` | Pagamento recebido (aguardando compensação) |
| `CONFIRMED` | Pagamento confirmado |
| `OVERDUE` | Vencido (não pago no prazo) |
| `CANCELLED` | Cancelado pelo usuário ou sistema |
| `REFUNDED` | Estornado |

---

## 💰 Taxas Asaas

| Método | Taxa |
|--------|------|
| PIX | R$ 0,99 por transação |
| Boleto | R$ 3,49 por boleto |
| Cartão de Crédito | 3,99% + R$ 0,40 |

**Valores líquidos:**
- O campo `net_value` na tabela `payments` contém o valor líquido (após taxas)
- Exemplo: Pagamento de R$ 100,00 via PIX = R$ 99,01 líquido

---

## 🔐 Segurança

### Boas Práticas Implementadas:

1. ✅ **Autenticação JWT** em todos endpoints (exceto webhook)
2. ✅ **Validação de signature** no webhook
3. ✅ **Validação de propriedade** (usuário só acessa seus pagamentos)
4. ✅ **Sanitização de dados** do cartão de crédito
5. ✅ **HTTPS obrigatório** em produção
6. ✅ **Rate limiting** (configurável)
7. ✅ **Logs detalhados** de transações

### Dados Sensíveis:

- **Nunca** armazene dados completos do cartão no banco
- O Asaas processa os dados do cartão de forma segura (PCI-DSS compliant)
- Apenas IDs de transações são armazenados localmente

---

## 🚀 Deploy em Produção

### 1. Alterar Ambiente

```env
ASAAS_ENVIRONMENT=production
ASAAS_API_KEY=sua_api_key_de_producao
```

### 2. Obter API Key de Produção

1. Acesse: https://www.asaas.com
2. Vá em **Integrações** → **API Key**
3. **IMPORTANTE:** API Key de produção só aparece após ativação da conta

### 3. Ativar Conta Asaas

Para usar em produção, você precisa:
- Preencher dados da empresa
- Enviar documentação (CNPJ, documentos dos sócios)
- Aguardar aprovação (1-3 dias úteis)

### 4. Configurar Webhook de Produção

- URL deve ser HTTPS (obrigatório)
- Recomendado: usar domínio próprio
- Evite: IP público, subdomínios genéricos

### 5. Testar Antes de Lançar

- Faça pagamentos reais de baixo valor (R$ 0,01) para validar
- Verifique se webhooks estão chegando corretamente
- Teste os 3 métodos: PIX, Boleto e Cartão

---

## 📚 Documentação Adicional

- **Asaas API Docs:** https://docs.asaas.com
- **Dashboard Asaas:** https://www.asaas.com
- **Sandbox Asaas:** https://sandbox.asaas.com
- **Suporte:** suporte@asaas.com | (16) 3025-3022
- **Status da API:** https://status.asaas.com

---

## ✅ Checklist de Implementação

- [x] Criar tabela `payments` no banco
- [x] Adicionar coluna `asaas_customer_id` na tabela `users`
- [x] Configurar variáveis de ambiente
- [x] Implementar `POST /api/payments`
- [x] Implementar `GET /api/payments/:id`
- [x] Implementar `GET /api/payments/:id/pix`
- [x] Implementar `GET /api/payments`
- [x] Implementar `DELETE /api/payments/:id`
- [x] Implementar `POST /api/webhooks/asaas`
- [ ] Configurar webhook no Dashboard Asaas
- [ ] Executar migrations no banco de dados
- [ ] Testar com cartão de teste
- [ ] Testar PIX no sandbox
- [ ] Testar Boleto no sandbox
- [ ] Validar webhook funcionando
- [ ] (Opcional) Implementar emails de notificação

---

## 🎉 Pronto!

A integração está completa. Agora o frontend pode chamar os endpoints e processar pagamentos!

**Próximos passos recomendados:**
1. Execute as migrations no banco
2. Configure as variáveis de ambiente
3. Teste no Postman/Insomnia
4. Configure o webhook no Dashboard Asaas
5. Integre com o frontend

Qualquer dúvida, consulte a documentação ou entre em contato! 🚀
