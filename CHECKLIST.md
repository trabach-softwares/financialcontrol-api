# ✅ Checklist Completo - Integração Asaas

## 📋 Passo a Passo para Colocar em Produção

---

## Fase 1: Configuração Inicial (15 min)

### 1.1 Criar Conta Asaas
- [ ] Acessar https://www.asaas.com
- [ ] Criar conta gratuita
- [ ] Confirmar email
- [ ] Fazer login

### 1.2 Configurar Sandbox
- [ ] Acessar https://sandbox.asaas.com
- [ ] Ir em **Integrações** → **API Key**
- [ ] Copiar API Key de Sandbox
- [ ] Guardar em local seguro

### 1.3 Configurar Variáveis de Ambiente
- [ ] Abrir arquivo `.env`
- [ ] Adicionar:
```env
ASAAS_API_KEY=sua_api_key_sandbox_aqui
ASAAS_ENVIRONMENT=sandbox
ASAAS_WEBHOOK_SECRET=sua_chave_webhook_aqui
```
- [ ] Salvar arquivo

---

## Fase 2: Banco de Dados (10 min)

### 2.1 Executar Migrations
- [ ] Acessar Supabase Dashboard
- [ ] Ir em **SQL Editor**
- [ ] Executar `migrations/001_create_payments_table.sql`
- [ ] Executar `migrations/002_add_asaas_customer_id_to_users.sql`
- [ ] Executar `migrations/003_add_plan_status_to_users.sql`
- [ ] Verificar se executou sem erros

### 2.2 Validar Estrutura
```sql
-- Copiar e executar:
SELECT COUNT(*) FROM payments;
SELECT asaas_customer_id FROM users LIMIT 1;
SELECT plan_status FROM users LIMIT 1;
```
- [ ] Todas queries retornaram sem erro

---

## Fase 3: Instalar Dependências (2 min)

```bash
npm install
```
- [ ] Instalação concluída sem erros
- [ ] Axios instalado (verificar em package.json)

---

## Fase 4: Iniciar Servidor (2 min)

```bash
npm run dev
```

### Verificar Logs
- [ ] Deve aparecer: `✅ Asaas configurado: sandbox`
- [ ] Deve aparecer: `Server running on port 3000`
- [ ] Sem erros no console

---

## Fase 5: Configurar Webhook (10 min)

### 5.1 Expor Localhost (Desenvolvimento)
```bash
# Instalar ngrok
brew install ngrok

# Ou baixar: https://ngrok.com/download

# Executar
ngrok http 3000
```
- [ ] Copiar URL pública (ex: https://abc123.ngrok.io)

### 5.2 Configurar no Asaas
- [ ] Acessar Dashboard Asaas Sandbox
- [ ] Ir em **Webhooks**
- [ ] Clicar em **Novo Webhook**
- [ ] Configurar:
  - URL: `https://abc123.ngrok.io/api/webhooks/asaas`
  - Eventos: Marcar todos de pagamento
  - Status: Ativo
- [ ] Gerar chave secreta
- [ ] Copiar chave secreta
- [ ] Adicionar no `.env`:
```env
ASAAS_WEBHOOK_SECRET=chave_copiada_aqui
```
- [ ] Reiniciar servidor (`npm run dev`)

---

## Fase 6: Testes Básicos (20 min)

### 6.1 Teste de Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "suasenha"
  }'
```
- [ ] Retornou token JWT
- [ ] Copiar token

### 6.2 Listar Planos
```bash
curl http://localhost:3000/api/plans \
  -H "Authorization: Bearer SEU_TOKEN"
```
- [ ] Retornou lista de planos
- [ ] Copiar UUID de um plano

### 6.3 Criar Pagamento PIX
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "UUID_DO_PLANO",
    "paymentMethod": "PIX"
  }'
```
- [ ] Retornou sucesso
- [ ] Retornou QR Code PIX
- [ ] Retornou payment ID
- [ ] Copiar payment ID

### 6.4 Aguardar Confirmação PIX (10 segundos)
```bash
# Esperar 10 segundos...

# Consultar status
curl http://localhost:3000/api/payments/PAYMENT_ID \
  -H "Authorization: Bearer SEU_TOKEN"
```
- [ ] Status mudou para `RECEIVED` ou `CONFIRMED`

### 6.5 Verificar Ativação do Plano
```sql
SELECT plan_id, plan_status, plan_activated_at 
FROM users 
WHERE email = 'seu@email.com';
```
- [ ] `plan_status = 'active'`
- [ ] `plan_activated_at` está preenchido

### 6.6 Testar Cartão de Crédito
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "UUID_DO_PLANO",
    "paymentMethod": "CREDIT_CARD",
    "creditCard": {
      "number": "5162306260253648",
      "holderName": "TESTE APROVADO",
      "expiryDate": "12/2030",
      "cvv": "123"
    }
  }'
```
- [ ] Pagamento aprovado imediatamente
- [ ] Status: `RECEIVED`

### 6.7 Testar Boleto
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "UUID_DO_PLANO",
    "paymentMethod": "BOLETO"
  }'
```
- [ ] Retornou PDF do boleto
- [ ] Retornou código de barras
- [ ] Retornou URL do boleto

### 6.8 Listar Pagamentos
```bash
curl http://localhost:3000/api/payments \
  -H "Authorization: Bearer SEU_TOKEN"
```
- [ ] Retornou lista com pagamentos criados

### 6.9 Cancelar Pagamento
```bash
curl -X DELETE http://localhost:3000/api/payments/PAYMENT_ID \
  -H "Authorization: Bearer SEU_TOKEN"
```
- [ ] Pagamento cancelado com sucesso

---

## Fase 7: Integração Frontend (30 min)

### 7.1 Criar Pagamento
- [ ] Frontend chama `POST /api/payments`
- [ ] Recebe resposta com QR Code ou dados
- [ ] Exibe para usuário

### 7.2 Polling de Status
- [ ] Frontend consulta `GET /api/payments/:id` a cada 3s
- [ ] Detecta quando status muda para `RECEIVED`
- [ ] Exibe notificação de sucesso

### 7.3 Tela de Sucesso
- [ ] Redireciona para dashboard
- [ ] Mostra mensagem de sucesso
- [ ] Libera funcionalidades do plano

---

## Fase 8: Preparar para Produção (60 min)

### 8.1 Ativar Conta Asaas
- [ ] Preencher dados da empresa no Dashboard
- [ ] Enviar documentação (CNPJ, RG, etc)
- [ ] Aguardar aprovação (1-3 dias úteis)
- [ ] Receber confirmação por email

### 8.2 Configurar Produção
- [ ] Obter API Key de Produção
- [ ] Atualizar `.env` em produção:
```env
ASAAS_API_KEY=sua_api_key_producao
ASAAS_ENVIRONMENT=production
```
- [ ] Configurar webhook com URL HTTPS
- [ ] Testar webhook em produção

### 8.3 Testes em Produção
- [ ] Fazer pagamento real de R$ 0,01 (PIX)
- [ ] Verificar se webhook chegou
- [ ] Verificar se plano foi ativado
- [ ] Testar com Boleto (valor baixo)
- [ ] Testar com Cartão (valor baixo)

### 8.4 Monitoramento
- [ ] Configurar logs centralizados
- [ ] Configurar alertas de erro
- [ ] Configurar backup do banco
- [ ] Documentar processo de rollback

---

## Fase 9: Lançamento (15 min)

### 9.1 Deploy
- [ ] Fazer deploy do backend
- [ ] Fazer deploy do frontend
- [ ] Verificar variáveis de ambiente
- [ ] Testar endpoints em produção

### 9.2 Comunicação
- [ ] Anunciar nova funcionalidade
- [ ] Enviar email para usuários
- [ ] Atualizar documentação
- [ ] Preparar FAQ

### 9.3 Monitorar Primeiras Horas
- [ ] Acompanhar logs em tempo real
- [ ] Verificar taxa de conversão
- [ ] Verificar se webhooks estão chegando
- [ ] Resolver problemas imediatamente

---

## Fase 10: Manutenção Contínua

### Diariamente
- [ ] Verificar logs de erro
- [ ] Verificar pagamentos pendentes
- [ ] Verificar webhooks falhados

### Semanalmente
- [ ] Analisar taxa de conversão
- [ ] Analisar métodos mais usados
- [ ] Revisar pagamentos vencidos
- [ ] Entrar em contato com clientes inadimplentes

### Mensalmente
- [ ] Gerar relatório de receita
- [ ] Analisar MRR (Monthly Recurring Revenue)
- [ ] Analisar churn
- [ ] Otimizar fluxo de pagamento

---

## 🚨 Alertas Críticos

### Monitorar sempre:
- [ ] Taxa de webhooks falhados > 5%
- [ ] Taxa de pagamentos recusados > 30%
- [ ] Tempo de resposta > 5s
- [ ] Erros 500 em endpoints de pagamento

### Ações Imediatas se:
- ❌ Webhook não chegar por > 5 minutos
- ❌ Mais de 3 pagamentos falharem seguidos
- ❌ API Asaas retornar erro 500
- ❌ Banco de dados ficar offline

---

## 📊 KPIs para Acompanhar

- **Taxa de Conversão:** (Pagamentos confirmados / Pagamentos criados) × 100
- **Ticket Médio:** Soma(valores) / Total de pagamentos
- **MRR:** Receita mensal recorrente
- **Churn Rate:** Cancelamentos / Total de assinantes
- **Método Preferido:** PIX vs Boleto vs Cartão
- **Tempo Médio de Pagamento:** Criação → Confirmação

---

## ✅ Checklist Final

Antes de considerar completo:

- [ ] ✅ Migrations executadas
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Servidor rodando sem erros
- [ ] ✅ Webhook configurado e funcionando
- [ ] ✅ Testes PIX, Boleto e Cartão OK
- [ ] ✅ Frontend integrado
- [ ] ✅ Documentação atualizada
- [ ] ✅ Testes em produção realizados
- [ ] ✅ Monitoramento configurado
- [ ] ✅ Equipe treinada

---

## 🎉 Pronto!

Quando todos os itens estiverem marcados, sua integração de pagamentos está **100% funcional e pronta para processar transações reais**!

---

## 📚 Documentação de Referência

- `PAYMENT_INTEGRATION.md` - Guia completo
- `QUICK_START_PAYMENTS.md` - Início rápido
- `TROUBLESHOOTING.md` - Solução de problemas
- `IMPLEMENTATION_SUMMARY.md` - Resumo da implementação
- `src/docs/API_DOCS.md` - Documentação da API

---

**Boa sorte! 🚀**
