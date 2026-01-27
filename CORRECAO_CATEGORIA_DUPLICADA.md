# 🐛 Correção: Categorias Duplicadas por Tipo

## Problema Identificado

Não era possível cadastrar uma **receita** e uma **despesa** com o mesmo nome.

**Exemplo:**
- ✅ Criar categoria "SALARIO" como DESPESA → OK
- ❌ Criar categoria "SALARIO" como RECEITA → BLOQUEADO (retornava a despesa existente)

## Causa Raiz

No arquivo [src/services/categoriesService.js](src/services/categoriesService.js), a validação de unicidade verificava apenas:
- `user_id` 
- `name`

**Mas NÃO verificava o `type`** (income/expense).

```javascript
// ❌ CÓDIGO ANTIGO - PROBLEMA
const { data: exists } = await supabaseAdmin
  .from('categories')
  .select('id')
  .eq('user_id', userId)
  .ilike('name', trimmed)
  .maybeSingle()
```

## Solução Implementada

Adicionada validação do campo `type` na checagem de duplicidade:

```javascript
// ✅ CÓDIGO CORRIGIDO
const { data: exists } = await supabaseAdmin
  .from('categories')
  .select('id, name, icon, color, created_at, type, is_default')
  .eq('user_id', userId)
  .eq('type', catType)  // 👈 NOVO: valida por tipo também
  .ilike('name', trimmed)
  .maybeSingle()
```

## Comportamento Correto Agora

| Nome | Tipo | Resultado |
|------|------|-----------|
| SALARIO | expense | ✅ Cria categoria |
| SALARIO | income | ✅ Cria categoria (permitido!) |
| SALARIO | expense | ⚠️ Retorna existente |
| Aluguel | income | ✅ Cria categoria |
| Aluguel | expense | ✅ Cria categoria (permitido!) |

## Impacto

✅ Usuários podem ter categorias com o mesmo nome para receitas E despesas  
✅ Mantém unicidade por combinação `(user_id + name + type)`  
✅ Não quebra funcionalidades existentes  
✅ Melhor experiência do usuário

## Testes Recomendados

1. Criar categoria "SALARIO" tipo DESPESA
2. Criar categoria "SALARIO" tipo RECEITA → deve funcionar!
3. Tentar criar "SALARIO" tipo DESPESA novamente → retorna existente
4. Verificar que transações continuam funcionando normalmente

---

**Data da Correção:** 27/01/2026  
**Arquivo Alterado:** `src/services/categoriesService.js` (linhas 57-65)
