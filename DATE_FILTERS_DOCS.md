# Filtros de Data - API Documentation

## 📋 Resumo

Implementação de filtros de data com validação em todos os endpoints principais da API.

## ✅ Endpoints Atualizados

### 1. GET /api/transactions

**Query Parameters:**
- `start_date` (string, opcional): Data inicial no formato YYYY-MM-DD
- `end_date` (string, opcional): Data final no formato YYYY-MM-DD
- `type` (string, opcional): "income" ou "expense"
- `category` (string, opcional): Nome da categoria
- `paid` (boolean, opcional): Status de pagamento
- `limit` (number, opcional): Limite de resultados
- `page` (number, opcional): Página para paginação
- `sort` (string, opcional): Ordenação

**Exemplos:**

```bash
# Todas as transações de novembro de 2025
GET /api/transactions?start_date=2025-11-01&end_date=2025-11-30

# Apenas despesas de novembro
GET /api/transactions?start_date=2025-11-01&end_date=2025-11-30&type=expense

# Transações a partir de 01/11
GET /api/transactions?start_date=2025-11-01

# Transações até 30/11
GET /api/transactions?end_date=2025-11-30

# Sem filtros (retorna todas)
GET /api/transactions
```

---

### 2. GET /api/dashboard/stats

**Query Parameters:**
- `start_date` (string, opcional): Data inicial no formato YYYY-MM-DD
- `end_date` (string, opcional): Data final no formato YYYY-MM-DD

**Comportamento:**
- **Sem filtros:** Retorna estatísticas do mês atual
- **Com filtros:** Retorna estatísticas do período especificado

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-11-01",
      "endDate": "2025-11-30",
      "income": 5000.00,
      "expense": 3000.00,
      "balance": 2000.00
    },
    "allTime": {
      "income": 50000.00,
      "expense": 30000.00,
      "balance": 20000.00,
      "totalTransactions": 150
    }
  }
}
```

**Exemplos:**

```bash
# Estatísticas do mês atual (padrão)
GET /api/dashboard/stats

# Estatísticas de novembro
GET /api/dashboard/stats?start_date=2025-11-01&end_date=2025-11-30

# Estatísticas desde 01/01/2025
GET /api/dashboard/stats?start_date=2025-01-01
```

---

### 3. GET /api/dashboard/charts

**Query Parameters:**
- `start_date` (string, opcional): Data inicial no formato YYYY-MM-DD
- `end_date` (string, opcional): Data final no formato YYYY-MM-DD
- `period` (string, opcional): Período pré-definido ("1month", "3months", "6months", "1year")

**Prioridade:**
1. Se `start_date` ou `end_date` fornecidos → usa filtro de datas
2. Se apenas `period` fornecido → calcula datas baseado no período
3. Sem filtros → padrão de 6 meses

**Exemplos:**

```bash
# Padrão (últimos 6 meses)
GET /api/dashboard/charts

# Último mês
GET /api/dashboard/charts?period=1month

# Novembro completo
GET /api/dashboard/charts?start_date=2025-11-01&end_date=2025-11-30

# Desde outubro
GET /api/dashboard/charts?start_date=2025-10-01
```

---

## 🔒 Validações

Todas as validações são aplicadas automaticamente:

### ✅ Formato de Data

- **Formato aceito:** YYYY-MM-DD (ISO 8601)
- **Exemplos válidos:** "2025-11-01", "2025-12-31"
- **Exemplos inválidos:** "01/11/2025", "2025-13-01", "2025-02-31"

**Erro 400:**
```json
{
  "success": false,
  "message": "start_date deve estar no formato YYYY-MM-DD (ex: 2025-11-01)"
}
```

### ✅ Validação de Intervalo

- `start_date` deve ser menor ou igual a `end_date`

**Erro 400:**
```json
{
  "success": false,
  "message": "start_date deve ser menor ou igual a end_date"
}
```

### ✅ Compatibilidade

Os endpoints aceitam tanto `snake_case` quanto `camelCase`:
- `start_date` ou `startDate`
- `end_date` ou `endDate`

---

## 🧪 Testes

Execute o script de testes automatizado:

```bash
chmod +x test-date-filters.sh
./test-date-filters.sh
```

Ou teste manualmente com curl:

```bash
# Teste válido
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/transactions?start_date=2025-11-01&end_date=2025-11-30"

# Teste com formato inválido (deve retornar 400)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/transactions?start_date=2025/11/01"

# Teste com start_date > end_date (deve retornar 400)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/transactions?start_date=2025-11-30&end_date=2025-11-01"
```

---

## 📝 Código de Exemplo (Frontend)

### JavaScript/Fetch

```javascript
// Obter transações de novembro
const response = await fetch('/api/transactions?start_date=2025-11-01&end_date=2025-11-30', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

### Axios

```javascript
// Estatísticas do período
const { data } = await axios.get('/api/dashboard/stats', {
  params: {
    start_date: '2025-11-01',
    end_date: '2025-11-30'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🔧 Arquivos Modificados

1. **src/utils/dateValidation.js** (NOVO)
   - Funções de validação de data
   - Helpers para manipulação de datas

2. **src/controllers/transactionController.js**
   - Adicionada validação de datas em `getAll()`

3. **src/controllers/dashboardController.js**
   - Adicionada validação em `getStats()`
   - Adicionada validação em `getCharts()`

4. **src/services/dashboardService.js**
   - Modificado `getStats()` para aceitar filtros de data
   - Modificado `getCharts()` para aceitar filtros de data

5. **test-date-filters.sh** (NOVO)
   - Script de testes automatizados

---

## 📊 Casos de Uso

### Use Case 1: Dashboard Mensal
```bash
GET /api/dashboard/stats?start_date=2025-11-01&end_date=2025-11-30
GET /api/dashboard/charts?start_date=2025-11-01&end_date=2025-11-30
```

### Use Case 2: Relatório Anual
```bash
GET /api/transactions?start_date=2025-01-01&end_date=2025-12-31&type=expense
```

### Use Case 3: Últimos 3 Meses
```bash
GET /api/dashboard/charts?period=3months
```

### Use Case 4: Transações Futuras
```bash
GET /api/transactions?start_date=2025-12-01
```

---

## ⚠️ Observações

1. **Retrocompatibilidade:** O parâmetro `period` continua funcionando em `/dashboard/charts`
2. **Performance:** Filtros de data usam índices do banco de dados para melhor performance
3. **Timezone:** Todas as datas são tratadas como UTC
4. **Validação:** Validação acontece antes de consultar o banco de dados

---

## 🎯 Próximos Passos (Opcional)

- [ ] Adicionar filtro de hora (datetime completo)
- [ ] Implementar cache de estatísticas por período
- [ ] Adicionar filtros de data em outros endpoints (categorias, contas)
- [ ] Criar relatórios agendados com filtros de data
