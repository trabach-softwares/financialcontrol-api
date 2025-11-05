# 📁 Migrations - Banco de Dados

Este diretório contém as migrations SQL para a integração de pagamentos com Asaas.

## 📋 Ordem de Execução

Execute as migrations **na ordem numérica** no Supabase SQL Editor:

### 1. `001_create_payments_table.sql`
Cria a tabela principal de pagamentos com todos os campos necessários.

**Conteúdo:**
- Tabela `payments`
- Índices para performance
- Triggers para `updated_at`
- Comentários nas colunas

**Executar:** ✅ Obrigatório

---

### 2. `002_add_asaas_customer_id_to_users.sql`
Adiciona campo para armazenar ID do cliente no Asaas.

**Conteúdo:**
- Coluna `asaas_customer_id` na tabela `users`
- Índice para busca rápida

**Executar:** ✅ Obrigatório

---

### 3. `003_add_plan_status_to_users.sql`
Adiciona campos de controle de status do plano.

**Conteúdo:**
- Coluna `plan_status` (active/inactive/expired/cancelled)
- Coluna `plan_activated_at`
- Atualização de registros existentes

**Executar:** ✅ Obrigatório

---

### 4. `admin_queries.sql`
Consultas úteis para administração e relatórios.

**Conteúdo:**
- Consultas de pagamentos
- Relatórios financeiros
- Análises de conversão
- Views úteis
- Scripts de manutenção

**Executar:** ⚠️  Opcional (copiar queries conforme necessário)

---

## 🚀 Como Executar

### Opção 1: Supabase Dashboard (Recomendado)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo da migration
6. Clique em **Run**
7. Verifique se apareceu "Success"

### Opção 2: CLI do Supabase

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Executar migration
supabase db push migrations/001_create_payments_table.sql
```

### Opção 3: Cliente PostgreSQL

```bash
# Conectar ao banco
psql -h db.xxx.supabase.co -U postgres -d postgres

# Executar migration
\i migrations/001_create_payments_table.sql
```

---

## ✅ Verificar se Funcionou

Após executar as migrations, rode estas queries para validar:

```sql
-- Verificar tabela payments
SELECT COUNT(*) FROM payments;

-- Verificar coluna asaas_customer_id
SELECT asaas_customer_id FROM users LIMIT 1;

-- Verificar coluna plan_status
SELECT plan_status, plan_activated_at FROM users LIMIT 1;

-- Listar índices criados
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('payments', 'users') 
  AND indexname LIKE '%asaas%' OR indexname LIKE '%plan_status%';
```

**Resultado esperado:** Sem erros!

---

## 🔄 Rollback (Desfazer)

Se precisar reverter as migrations:

### Rollback 003
```sql
ALTER TABLE users DROP COLUMN IF EXISTS plan_status;
ALTER TABLE users DROP COLUMN IF EXISTS plan_activated_at;
DROP INDEX IF EXISTS idx_users_plan_status;
```

### Rollback 002
```sql
ALTER TABLE users DROP COLUMN IF EXISTS asaas_customer_id;
DROP INDEX IF EXISTS idx_users_asaas_customer_id;
```

### Rollback 001
```sql
DROP TABLE IF EXISTS payments CASCADE;
DROP FUNCTION IF EXISTS update_payments_updated_at();
```

**⚠️ CUIDADO:** Rollback apaga dados! Use apenas em desenvolvimento.

---

## 📊 Estrutura Final

Após executar todas migrations, o banco terá:

### Tabela: `payments`
```
- id (UUID, PK)
- user_id (UUID, FK → users)
- plan_id (UUID, FK → plans)
- asaas_payment_id (VARCHAR, UNIQUE)
- asaas_customer_id (VARCHAR)
- value (DECIMAL)
- net_value (DECIMAL)
- payment_method (VARCHAR)
- status (VARCHAR)
- due_date (TIMESTAMP)
- paid_at (TIMESTAMP)
- confirmed_at (TIMESTAMP)
- invoice_url (TEXT)
- transaction_receipt_url (TEXT)
- pix_payload (TEXT)
- pix_qr_code_image (TEXT)
- pix_expires_at (TIMESTAMP)
- boleto_barcode (TEXT)
- boleto_pdf_url (TEXT)
- boleto_bank_slip_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabela: `users` (campos adicionados)
```
+ asaas_customer_id (VARCHAR, UNIQUE)
+ plan_status (VARCHAR)
+ plan_activated_at (TIMESTAMP)
```

### Índices Criados
```
- idx_payments_user_id
- idx_payments_asaas_payment_id
- idx_payments_status
- idx_payments_created_at
- idx_users_asaas_customer_id
- idx_users_plan_status
```

---

## 🔍 Troubleshooting

### Erro: "relation already exists"
**Causa:** Migration já foi executada.

**Solução:** Ignorar (já está criado) ou fazer rollback primeiro.

---

### Erro: "permission denied"
**Causa:** Usuário sem permissão de criar tabelas.

**Solução:** Usar Service Role Key do Supabase ou usuário postgres.

---

### Erro: "foreign key constraint"
**Causa:** Tabela referenciada não existe.

**Solução:** Certifique-se que as tabelas `users` e `plans` existem.

```sql
-- Verificar
SELECT * FROM users LIMIT 1;
SELECT * FROM plans LIMIT 1;
```

---

## 📚 Documentação Relacionada

- **Guia de Integração:** `../PAYMENT_INTEGRATION.md`
- **Quick Start:** `../QUICK_START_PAYMENTS.md`
- **Troubleshooting:** `../TROUBLESHOOTING.md`
- **API Docs:** `../src/docs/API_DOCS.md`

---

## ✅ Checklist

- [ ] Executar `001_create_payments_table.sql`
- [ ] Executar `002_add_asaas_customer_id_to_users.sql`
- [ ] Executar `003_add_plan_status_to_users.sql`
- [ ] Verificar se tabelas foram criadas
- [ ] Verificar se índices foram criados
- [ ] Testar inserção de dados

---

**Pronto!** Banco de dados configurado para processar pagamentos! 🚀
