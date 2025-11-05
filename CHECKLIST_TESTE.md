# ✅ Checklist de Teste em Produção

Use este checklist para garantir que tudo está funcionando corretamente em produção.

---

## 📋 Pré-Teste

Antes de iniciar os testes, verifique:

### Banco de Dados
- [ ] Executei `migrations/drop_views.sql` no Supabase
- [ ] Executei `migrations/001_create_payments_table.sql` no Supabase
- [ ] Executei `migrations/002_add_asaas_customer_id_to_users.sql` no Supabase
- [ ] Executei `migrations/003_add_plan_status_to_users.sql` no Supabase
- [ ] Executei queries de verificação em `migrations/admin_queries.sql`
- [ ] Tabela `payments` foi criada com sucesso
- [ ] Coluna `asaas_customer_id` existe na tabela `users`
- [ ] Colunas `plan_status`, `plan_activated_at`, `plan_expires_at` existem na tabela `users`

### Variáveis de Ambiente (Produção)
- [ ] `ASAAS_API_KEY` está configurada (começa com `$aact_prod_`)
- [ ] `ASAAS_ENVIRONMENT` está como `production`
- [ ] `ASAAS_WEBHOOK_SECRET` está configurado
- [ ] `SUPABASE_URL` está correto
- [ ] `SUPABASE_ANON_KEY` está correto
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está correto
- [ ] `JWT_SECRET` está configurado
- [ ] `ALLOWED_ORIGINS` inclui seu domínio do frontend

### Asaas Dashboard
- [ ] Acessei https://www.asaas.com (PRODUÇÃO)
- [ ] Fiz login na minha conta
- [ ] Fui em **Integrações** → **Webhooks**
- [ ] Cliquei em **"Novo Webhook"**
- [ ] Configurei URL: `https://api.financialcontrol.com.br/api/webhooks/asaas`
- [ ] Configurei Token: `1738a629219c35f20ad7f26c877be643d70abaf8928e072b4273c646f7ccc3c0`
- [ ] Marquei TODOS os eventos de pagamento
- [ ] Status está **ATIVO**
- [ ] Salvei a configuração
- [ ] Webhook aparece na lista de "Meus Webhooks"

### API em Produção
- [ ] API está acessível em `https://api.financialcontrol.com.br`
- [ ] `/health` retorna `{"success":true}`
- [ ] Código foi deployado com as alterações de pagamento
- [ ] Logs do servidor estão acessíveis

---

## 🧪 Testes Funcionais

### 1. Health Check ✅
- [ ] Executei: `curl https://api.financialcontrol.com.br/health`
- [ ] Retornou: `{"success":true, "message":"API is healthy"}`
- [ ] Status HTTP: 200

### 2. Registro/Login de Usuário ✅
- [ ] Registrei novo usuário com sucesso
- [ ] Recebi token JWT válido
- [ ] Token tem formato: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] Salvei o token para próximas requisições

### 3. Listagem de Planos ✅
- [ ] Listei planos com: `GET /api/plans`
- [ ] Retornou array de planos
- [ ] Cada plano tem: `id`, `name`, `price`, `billing_cycle`
- [ ] Copiei o `id` do plano para testar

### 4. Criação de Pagamento PIX ✅
- [ ] Criei pagamento com: `POST /api/payments` + `paymentMethod: "PIX"`
- [ ] Retornou `status: "PENDING"`
- [ ] Recebi `pix.payload` (Copia e Cola)
- [ ] Recebi `pix.qrCodeUrl` (imagem Base64)
- [ ] Recebi `invoice_url` (link para visualizar)
- [ ] Recebi `asaas_payment_id` (começa com `pay_`)
- [ ] Valor está correto

### 5. Pagamento PIX ✅
- [ ] Abri o `invoice_url` no navegador
- [ ] QR Code é exibido corretamente
- [ ] Copiei o PIX Copia e Cola OU
- [ ] Escaneei o QR Code pelo app do banco
- [ ] Confirmei o pagamento no app do banco
- [ ] Valor debitado da conta

### 6. Confirmação do Pagamento ✅
- [ ] Aguardei ~5 segundos após pagar
- [ ] Consultei: `GET /api/payments`
- [ ] Status mudou para `RECEIVED` ou `CONFIRMED`
- [ ] Campo `paid_at` está preenchido
- [ ] Campo `confirmed_at` está preenchido

### 7. Ativação Automática do Plano ✅
- [ ] Consultei: `GET /api/users/me`
- [ ] `plan_status` está como `"active"`
- [ ] `plan_activated_at` está preenchido com data/hora
- [ ] `plan_expires_at` está preenchido (30 dias à frente)
- [ ] `plan_id` está correto

---

## 🔔 Verificação de Webhook

### Logs do Servidor
- [ ] Acessei logs do servidor (Vercel/Render/Railway)
- [ ] Encontrei log: `"🔔 Webhook recebido: PAYMENT_RECEIVED"`
- [ ] Encontrei log: `"✅ Webhook processado com sucesso"`
- [ ] Encontrei log: `"✅ Plano ativado para usuário"`
- [ ] Não há erros 500 nos logs

### Histórico no Asaas
- [ ] Acessei Asaas Dashboard → Integrações → Webhooks
- [ ] Cliquei no webhook criado
- [ ] Vi seção "Histórico" ou "Logs"
- [ ] Há registros de envios
- [ ] Status está **200 OK** (sucesso)
- [ ] Payload enviado está correto
- [ ] Response do servidor está OK

### Banco de Dados
- [ ] Executei query: `SELECT * FROM payments WHERE status IN ('RECEIVED', 'CONFIRMED')`
- [ ] Encontrei o pagamento criado
- [ ] Status está `CONFIRMED` ou `RECEIVED`
- [ ] `paid_at` e `confirmed_at` estão preenchidos
- [ ] Executei query: `SELECT * FROM users WHERE plan_status = 'active'`
- [ ] Encontrei o usuário
- [ ] `plan_status` está `active`
- [ ] `plan_activated_at` está preenchido

---

## 💳 Testes Adicionais (Opcional)

### Boleto Bancário
- [ ] Criei pagamento com: `paymentMethod: "BOLETO"`
- [ ] Recebi `boleto.barcode`
- [ ] Recebi `boleto.pdfUrl`
- [ ] PDF do boleto é acessível
- [ ] Código de barras está correto
- [ ] (Paguei o boleto - demora 1-3 dias úteis)
- [ ] Webhook chegou após compensação
- [ ] Status mudou para `CONFIRMED`
- [ ] Plano foi ativado

### Cartão de Crédito
- [ ] Criei pagamento com: `paymentMethod: "CREDIT_CARD"`
- [ ] Enviei dados do cartão: `holderName`, `number`, `expiryMonth`, `expiryYear`, `ccv`
- [ ] Pagamento foi aprovado instantaneamente
- [ ] Status retornou como `CONFIRMED` imediatamente
- [ ] `paid_at` e `confirmed_at` vieram preenchidos
- [ ] Plano foi ativado instantaneamente

### Cancelamento de Pagamento
- [ ] Criei pagamento PIX (não paguei)
- [ ] Cancelei com: `DELETE /api/payments/:id`
- [ ] Status mudou para `CANCELLED`
- [ ] Não é possível pagar mais
- [ ] Plano não foi ativado

### QR Code Expirado
- [ ] Criei pagamento PIX
- [ ] Aguardei QR Code expirar (geralmente 30 minutos)
- [ ] Solicitei novo QR Code: `GET /api/payments/:id/pix`
- [ ] Recebi novo `payload` e `qrCodeUrl`
- [ ] Consegui pagar com o novo QR Code

---

## 🐛 Testes de Erro

### Autenticação
- [ ] Tentei acessar endpoint protegido sem token → Erro 401
- [ ] Tentei acessar com token inválido → Erro 401
- [ ] Tentei acessar com token expirado → Erro 401

### Validações
- [ ] Tentei criar pagamento sem `planId` → Erro 400
- [ ] Tentei criar pagamento com `planId` inválido → Erro 404
- [ ] Tentei criar pagamento com `paymentMethod` inválido → Erro 400
- [ ] Tentei criar pagamento com cartão inválido → Erro 400

### Permissões
- [ ] Tentei acessar pagamento de outro usuário → Erro 403 ou 404
- [ ] Tentei cancelar pagamento de outro usuário → Erro 403 ou 404

### Webhook
- [ ] Simulei webhook com token incorreto → Erro 401 (logs do Asaas)
- [ ] Verificar que webhook com token correto funciona

---

## ✅ Resultado Final

### Tudo Funcionando? 🎉

Se você marcou todos os checkboxes acima (exceto opcionais), **PARABÉNS!** 🎊

Seu sistema de pagamentos está **100% funcional em produção**! 🚀

Você tem:
- ✅ API rodando corretamente
- ✅ Banco de dados configurado
- ✅ Webhook funcionando
- ✅ Pagamentos sendo processados
- ✅ Planos sendo ativados automaticamente

---

### Algo Deu Errado? 🐛

Se algum checkbox não foi marcado, consulte:

1. **[TESTES_PRODUCAO.md](TESTES_PRODUCAO.md)** - Guia completo com troubleshooting
2. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problemas comuns e soluções
3. **[WEBHOOK_CONFIG.md](WEBHOOK_CONFIG.md)** - Reconfigurar webhook
4. Logs do servidor para identificar erros
5. Histórico de webhooks no Asaas para ver falhas

---

## 📊 Métricas de Sucesso

Após os testes, você deve ter:

- ✅ **0 erros** nos logs do servidor
- ✅ **100% webhooks** com status 200 OK no Asaas
- ✅ **100% pagamentos** sendo confirmados
- ✅ **100% planos** sendo ativados automaticamente

---

## 🎯 Próximos Passos

Agora que tudo está funcionando:

1. **Integrar com Frontend**
   - Consumir endpoints de pagamento
   - Exibir QR Code do PIX
   - Mostrar status do pagamento
   - Liberar funcionalidades após ativação

2. **Monitorar Produção**
   - Configurar alertas de erro
   - Monitorar webhooks falhados
   - Acompanhar taxa de sucesso de pagamentos

3. **Melhorias Futuras**
   - Notificações por email
   - Histórico de pagamentos
   - Renovação automática
   - Descontos e cupons

---

**🎉 Parabéns! Seu sistema está pronto para receber pagamentos reais!**
