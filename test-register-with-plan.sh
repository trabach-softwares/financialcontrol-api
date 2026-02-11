#!/bin/bash

# Script para testar registro de novo usuário com plano Free
# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"
TEST_EMAIL="teste_plan_$(date +%s)@example.com"
TEST_PASSWORD="Teste@123"
TEST_NAME="Usuário Teste Plan"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Teste de Registro com Plano Free${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# 1. Registrar novo usuário
echo -e "${YELLOW}1. Registrando novo usuário...${NC}"
echo "Email: $TEST_EMAIL"

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"$TEST_NAME\"
  }")

echo "Resposta do registro:"
echo "$REGISTER_RESPONSE" | jq '.'

# Extrair token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.user.id')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Erro ao registrar usuário${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Usuário registrado com sucesso${NC}"
echo "User ID: $USER_ID"
echo ""

# 2. Buscar dados do usuário para verificar plan_id
echo -e "${YELLOW}2. Verificando plan_id do usuário...${NC}"

USER_RESPONSE=$(curl -s -X GET "$API_URL/api/users/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "Dados do usuário:"
echo "$USER_RESPONSE" | jq '.'

PLAN_ID=$(echo "$USER_RESPONSE" | jq -r '.data.plan_id')
EXPECTED_PLAN_ID="3c25d559-fb8a-436c-a414-e4991e6e6f4c"

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Resultado do Teste${NC}"
echo -e "${YELLOW}========================================${NC}"

if [ "$PLAN_ID" = "$EXPECTED_PLAN_ID" ]; then
  echo -e "${GREEN}✅ SUCESSO: Usuário criado com plano Free!${NC}"
  echo -e "Plan ID encontrado: ${GREEN}$PLAN_ID${NC}"
  echo -e "Plan ID esperado:   ${GREEN}$EXPECTED_PLAN_ID${NC}"
  exit 0
else
  echo -e "${RED}❌ FALHA: Usuário NÃO foi criado com plano Free${NC}"
  echo -e "Plan ID encontrado: ${RED}$PLAN_ID${NC}"
  echo -e "Plan ID esperado:   ${YELLOW}$EXPECTED_PLAN_ID${NC}"
  exit 1
fi
