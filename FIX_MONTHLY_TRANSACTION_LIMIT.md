# Correção: Limite de Transações Mensais

## 🐛 Problema Identificado

O sistema estava contando **1 dia a mais** ao verificar transações do mês atual.

### Exemplo do Bug:
Para novembro/2025, o período estava sendo calculado como:
- **Início:** 2025-11-01 ✅
- **Fim:** 2025-12-01 ❌ (deveria ser 2025-11-30)

Isso fazia com que transações do dia 01/12 fossem contadas como novembro!

---

## 🔧 Causa Raiz

O código anterior usava:
```javascript
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
const endDate = lastDayOfMonth.toISOString().split('T')[0];
```

**Problema:** 
- `new Date(2025, 10, 0, 23, 59, 59)` = 30/Nov/2025 às 23:59:59
- `.toISOString()` converte para UTC
- Dependendo do timezone, pode virar 01/Dez/2025

---

## ✅ Solução Aplicada

Código novo e mais robusto:
```javascript
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth(); // 0-11

// Primeiro dia: YYYY-MM-01
const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

// Último dia: calcular corretamente
const lastDay = new Date(year, month + 1, 0).getDate();
const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
```

**Resultado:**
- Novembro/2025: `2025-11-01` até `2025-11-30` ✅
- Fevereiro/2024: `2024-02-01` até `2024-02-29` ✅ (ano bissexto)
- Fevereiro/2025: `2025-02-01` até `2025-02-28` ✅

---

## 🧪 Como Testar

### Teste 1: Verificar logs
Ao criar uma transação, você verá:
```
📊 [PLAN_LIMIT] Verificando transações do mês para usuário xxx
   Período: 2025-11-01 até 2025-11-30
   Resultado: X/15 transações no mês
```

### Teste 2: Criar transação em novembro
```bash
curl -X POST 'http://localhost:3000/api/transactions' \
  -H 'Authorization: Bearer $TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"type":"income","amount":10,"date":"2025-11-15"}'
```

Deve contar apenas transações entre 01/11 e 30/11.

### Teste 3: No primeiro dia do próximo mês
Em 01/12/2025, o contador deve **resetar para 0** automaticamente!

---

## 📊 Comportamento Esperado

### Exemplo: Usuário no Plano Gratuito (15 transações/mês)

| Data | Transações em Nov | Pode criar? | Mensagem |
|------|------------------|-------------|----------|
| 05/11/2025 | 5/15 | ✅ Sim | 10 restantes |
| 15/11/2025 | 14/15 | ✅ Sim | 1 restante |
| 20/11/2025 | 15/15 | ❌ Não | Limite atingido |
| 25/11/2025 | 15/15 | ❌ Não | Limite atingido |
| 01/12/2025 | 0/15 | ✅ Sim | **RESETOU!** |

---

## 🎯 Impacto da Correção

### Antes (Bug):
- Novembro tinha **31 dias** de contagem (01/11 até 01/12)
- Usuário poderia ter 16-17 transações em vez de 15
- Bug favorecia o usuário mas quebrava a regra de negócio

### Depois (Correto):
- Novembro tem **30 dias** de contagem (01/11 até 30/11)
- Limite respeitado rigorosamente
- Reseta corretamente todo dia 1º do mês

---

## 🔍 Verificação no Banco

Execute esta query para confirmar:
```sql
SELECT 
  COUNT(*) as total_novembro
FROM transactions
WHERE user_id = 'seu-user-id'
  AND date >= '2025-11-01'
  AND date <= '2025-11-30'; -- Corrigido: era <= '2025-12-01'
```

---

## ✅ Status

- [x] Bug identificado
- [x] Correção aplicada
- [x] Logs adicionados para debug
- [ ] Testar em produção
- [ ] Monitorar resetamento no dia 01/12

---

## 📝 Notas Técnicas

1. **Timezone:** A solução evita problemas de timezone construindo a string diretamente
2. **Ano Bissexto:** O `new Date(year, month + 1, 0).getDate()` calcula corretamente (29 em fevereiro bissexto)
3. **Performance:** Não afeta performance, apenas correção de lógica
4. **Retroativo:** Não afeta transações já criadas, apenas validação futura
