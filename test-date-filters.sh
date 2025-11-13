#!/bin/bash

# Testes de Filtros de Data - API FinancialControl
# Execute: chmod +x test-date-filters.sh && ./test-date-filters.sh

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuração
API_URL="http://localhost:3000/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1YzRjZGJiLTMxMmEtNDU0OC05M2YwLTExOTIzZTliM2QwMCIsImVtYWlsIjoianVyZW1hQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyOTk3NzQ2LCJleHAiOjE3NjM2MDI1NDZ9.XmiZciC5hL56KW6jCak_TDIPTDGYeCAaocY62GsPJas"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Testes de Filtros de Data${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# Função para fazer requisição
test_endpoint() {
  local description=$1
  local endpoint=$2
  local expected_status=${3:-200}
  
  echo -e "${YELLOW}Test:${NC} $description"
  echo -e "${YELLOW}Endpoint:${NC} $endpoint"
  
  response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/json" \
    "$API_URL$endpoint")
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$status_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSOU${NC} (Status: $status_code)"
  else
    echo -e "${RED}✗ FALHOU${NC} (Esperado: $expected_status, Recebido: $status_code)"
  fi
  
  echo -e "Response: $(echo $body | jq -C '.' 2>/dev/null || echo $body)"
  echo -e "\n---\n"
}

# ========================================
# 1. TESTES DE GET /api/transactions
# ========================================

echo -e "${YELLOW}=== 1. GET /api/transactions ===${NC}\n"

# Teste 1.1: Sem filtros de data (deve retornar todas)
test_endpoint \
  "Sem filtros de data" \
  "/transactions"

# Teste 1.2: Com start_date e end_date
test_endpoint \
  "Com start_date e end_date" \
  "/transactions?start_date=2025-11-01&end_date=2025-11-30"

# Teste 1.3: Apenas start_date
test_endpoint \
  "Apenas start_date" \
  "/transactions?start_date=2025-11-01"

# Teste 1.4: Apenas end_date
test_endpoint \
  "Apenas end_date" \
  "/transactions?end_date=2025-11-30"

# Teste 1.5: Formato de data inválido
test_endpoint \
  "Formato de data inválido" \
  "/transactions?start_date=2025/11/01" \
  400

# Teste 1.6: start_date > end_date
test_endpoint \
  "start_date maior que end_date" \
  "/transactions?start_date=2025-11-30&end_date=2025-11-01" \
  400

# Teste 1.7: Data inválida
test_endpoint \
  "Data inválida (31 de fevereiro)" \
  "/transactions?start_date=2025-02-31" \
  400

# Teste 1.8: Com filtro de tipo e datas
test_endpoint \
  "Com tipo=expense e intervalo de datas" \
  "/transactions?type=expense&start_date=2025-11-01&end_date=2025-11-30"

# ========================================
# 2. TESTES DE GET /api/dashboard/stats
# ========================================

echo -e "${YELLOW}=== 2. GET /api/dashboard/stats ===${NC}\n"

# Teste 2.1: Sem filtros (deve retornar mês atual)
test_endpoint \
  "Sem filtros (mês atual)" \
  "/dashboard/stats"

# Teste 2.2: Com start_date e end_date
test_endpoint \
  "Com start_date e end_date" \
  "/dashboard/stats?start_date=2025-11-01&end_date=2025-11-30"

# Teste 2.3: Apenas start_date
test_endpoint \
  "Apenas start_date" \
  "/dashboard/stats?start_date=2025-11-01"

# Teste 2.4: Apenas end_date
test_endpoint \
  "Apenas end_date" \
  "/dashboard/stats?end_date=2025-11-30"

# Teste 2.5: Formato inválido
test_endpoint \
  "Formato de data inválido" \
  "/dashboard/stats?start_date=01-11-2025" \
  400

# Teste 2.6: start_date > end_date
test_endpoint \
  "start_date maior que end_date" \
  "/dashboard/stats?start_date=2025-12-01&end_date=2025-11-01" \
  400

# ========================================
# 3. TESTES DE GET /api/dashboard/charts
# ========================================

echo -e "${YELLOW}=== 3. GET /api/dashboard/charts ===${NC}\n"

# Teste 3.1: Sem filtros (deve usar period padrão)
test_endpoint \
  "Sem filtros (padrão 6 meses)" \
  "/dashboard/charts"

# Teste 3.2: Com period (retrocompatibilidade)
test_endpoint \
  "Com period=1month" \
  "/dashboard/charts?period=1month"

# Teste 3.3: Com start_date e end_date (ignora period)
test_endpoint \
  "Com start_date e end_date" \
  "/dashboard/charts?start_date=2025-11-01&end_date=2025-11-30"

# Teste 3.4: Com period E datas (datas têm prioridade)
test_endpoint \
  "Com period e datas (datas têm prioridade)" \
  "/dashboard/charts?period=1year&start_date=2025-11-01&end_date=2025-11-30"

# Teste 3.5: Apenas start_date
test_endpoint \
  "Apenas start_date" \
  "/dashboard/charts?start_date=2025-10-01"

# Teste 3.6: Formato inválido
test_endpoint \
  "Formato de data inválido" \
  "/dashboard/charts?start_date=2025-13-01" \
  400

# Teste 3.7: start_date > end_date
test_endpoint \
  "start_date maior que end_date" \
  "/dashboard/charts?start_date=2025-11-30&end_date=2025-11-01" \
  400

# ========================================
# RESUMO
# ========================================

echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}Testes concluídos!${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "\nVerifique os resultados acima para confirmar que:"
echo -e "  ✓ Filtros de data funcionam corretamente"
echo -e "  ✓ Validações estão funcionando (formato, start <= end)"
echo -e "  ✓ Erros retornam status 400 com mensagem clara"
echo -e "  ✓ Sem filtros usa comportamento padrão correto"
