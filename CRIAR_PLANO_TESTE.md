# 🎯 Criar Plano de Teste para Pagamentos

## ❌ Problema

O teste automatizado falha porque o único plano disponível é "Gratuito" (R$ 0), e o Asaas não aceita pagamentos de valor zero.

```
❌ Falha ao criar pagamento
{"success":false,"data":null,"message":"O campo value deve ser informado"}
```

## ✅ Solução

Criar um plano PAGO (valor > R$ 0) no banco de dados para testes.

---

## 📝 Opção 1: Plano de R$ 1,00 (Recomendado para Testes)

Execute no **Supabase SQL Editor**:

```sql
-- Criar plano de teste de R$ 1,00
INSERT INTO plans (
  name,
  description,
  price,
  billing_cycle,
  features,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Plano Teste',
  'Plano para testes de pagamento - R$ 1,00',
  1.00,
  'monthly',
  ARRAY['Teste de pagamento', 'PIX/Boleto/Cartão'],
  true,
  NOW(),
  NOW()
);

-- Verificar se foi criado
SELECT id, name, price, billing_cycle, is_active 
FROM plans 
WHERE name = 'Plano Teste';
```

---

## 📝 Opção 2: Planos Realistas

Se quiser criar planos mais realistas:

```sql
-- Plano Básico - R$ 29,90
INSERT INTO plans (
  name,
  description,
  price,
  billing_cycle,
  features,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Plano Básico',
  'Plano ideal para começar',
  29.90,
  'monthly',
  ARRAY[
    'Até 100 transações por mês',
    'Relatórios básicos',
    'Suporte por email'
  ],
  true,
  NOW(),
  NOW()
);

-- Plano Premium - R$ 49,90
INSERT INTO plans (
  name,
  description,
  price,
  billing_cycle,
  features,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Plano Premium',
  'Plano completo para seu negócio',
  49.90,
  'monthly',
  ARRAY[
    'Transações ilimitadas',
    'Relatórios avançados',
    'Dashboard completo',
    'Suporte prioritário',
    'Exportação de dados'
  ],
  true,
  NOW(),
  NOW()
);

-- Verificar planos criados
SELECT id, name, price, billing_cycle, is_active 
FROM plans 
WHERE price > 0
ORDER BY price ASC;
```

---

## 📝 Opção 3: Atualizar Plano Gratuito

Se quiser apenas testar, pode temporariamente mudar o preço do plano gratuito:

```sql
-- CUIDADO: Isso vai cobrar dos usuários que têm plano gratuito!
-- Use apenas em ambiente de desenvolvimento/teste

-- Atualizar plano gratuito para R$ 1,00 temporariamente
UPDATE plans 
SET price = 1.00 
WHERE name = 'Gratuito';

-- Depois de testar, voltar para R$ 0
UPDATE plans 
SET price = 0.00 
WHERE name = 'Gratuito';
```

⚠️ **NÃO RECOMENDADO EM PRODUÇÃO!**

---

## 🧪 Após Criar o Plano

1. **Verificar se o plano existe:**
```sql
SELECT id, name, price, is_active 
FROM plans 
WHERE price > 0;
```

2. **Executar teste novamente:**
```bash
./test-payment.sh
```

3. **Resultado esperado:**
```
[3/8] Listando planos disponíveis...
✅ Planos encontrados
     1  Gratuito
     2  Plano Teste

   Plano selecionado: Plano Teste
   Preço: R$ 1
   ID: abc-123-...

[4/8] Criando pagamento PIX...
✅ Pagamento PIX criado com sucesso
```

---

## 🎯 Valor Mínimo Recomendado

| Método | Valor Mínimo | Recomendado para Teste |
|--------|--------------|------------------------|
| **PIX** | R$ 0,01 | R$ 1,00 |
| **Boleto** | R$ 5,00 | R$ 5,00 |
| **Cartão** | R$ 1,00 | R$ 1,00 |

**Para testes, recomendo R$ 1,00** - é um valor baixo que funciona para todos os métodos.

---

## 🔍 Verificar Estrutura da Tabela Plans

Se não souber quais campos existem:

```sql
-- Ver estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'plans'
ORDER BY ordinal_position;

-- Ver dados existentes
SELECT * FROM plans;
```

---

## ✅ Checklist

- [ ] Acessei Supabase SQL Editor
- [ ] Executei INSERT para criar plano de teste
- [ ] Verifiquei que plano foi criado (`SELECT * FROM plans`)
- [ ] Plano tem `price > 0` e `is_active = true`
- [ ] Executei `./test-payment.sh` novamente
- [ ] Teste passou da etapa [4/8] com sucesso

---

## 🚀 Próximo Passo

Após criar o plano pago:

```bash
./test-payment.sh
```

Agora sim o teste vai funcionar! 🎉
