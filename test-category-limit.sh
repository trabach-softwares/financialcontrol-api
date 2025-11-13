#!/bin/bash

# Script para testar o limite de 3 categorias personalizadas no plano gratuito
# Requer: jq (brew install jq)

BASE_URL="${BASE_URL:-http://localhost:3000}"
echo "🧪 Testando limite de categorias no plano gratuito"
echo "📍 URL: $BASE_URL"
echo ""

# Credenciais de teste (ajuste conforme necessário)
read -p "Email do usuário (plano gratuito): " EMAIL
read -sp "Senha: " PASSWORD
echo ""

# 1. Login
echo ""
echo "1️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Erro no login:"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Login realizado com sucesso"

# 2. Verificar plano atual
echo ""
echo "2️⃣ Verificando plano do usuário..."
LIMITS_RESPONSE=$(curl -s -X GET "$BASE_URL/plan-limits" \
  -H "Authorization: Bearer $TOKEN")

echo $LIMITS_RESPONSE | jq '.'

PLAN_NAME=$(echo $LIMITS_RESPONSE | jq -r '.data.plan.name')
MAX_CATEGORIES=$(echo $LIMITS_RESPONSE | jq -r '.data.limits.categories.limit')
CURRENT_CATEGORIES=$(echo $LIMITS_RESPONSE | jq -r '.data.limits.categories.current')

echo ""
echo "📊 Plano: $PLAN_NAME"
echo "📁 Categorias: $CURRENT_CATEGORIES / $MAX_CATEGORIES"

# 3. Listar categorias atuais
echo ""
echo "3️⃣ Listando categorias personalizadas..."
CATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN")

CUSTOM_CATEGORIES=$(echo $CATEGORIES_RESPONSE | jq '[.data[] | select(.is_default == false)]')
CUSTOM_COUNT=$(echo $CUSTOM_CATEGORIES | jq 'length')

echo "📝 Categorias personalizadas existentes: $CUSTOM_COUNT"
echo $CUSTOM_CATEGORIES | jq -c '.[] | {id, name}'

# 4. Tentar criar categorias até atingir o limite
echo ""
echo "4️⃣ Testando criação de categorias..."

CATEGORIES_TO_CREATE=5
SUCCESS_COUNT=0
FAILED_COUNT=0

for i in $(seq 1 $CATEGORIES_TO_CREATE); do
  CATEGORY_NAME="Teste Categoria $i $(date +%s)"
  
  echo ""
  echo "Tentando criar categoria $i: $CATEGORY_NAME"
  
  CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/categories" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$CATEGORY_NAME\",\"icon\":\"test\",\"color\":\"blue-6\",\"type\":\"expense\"}")
  
  SUCCESS=$(echo $CREATE_RESPONSE | jq -r '.success')
  
  if [ "$SUCCESS" = "true" ]; then
    echo "✅ Categoria criada com sucesso"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "❌ Falha ao criar categoria"
    echo $CREATE_RESPONSE | jq '.error'
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
done

# 5. Verificar estado final
echo ""
echo "5️⃣ Verificando estado final..."
FINAL_LIMITS=$(curl -s -X GET "$BASE_URL/plan-limits" \
  -H "Authorization: Bearer $TOKEN")

FINAL_CURRENT=$(echo $FINAL_LIMITS | jq -r '.data.limits.categories.current')
FINAL_ALLOWED=$(echo $FINAL_LIMITS | jq -r '.data.limits.categories.allowed')

echo ""
echo "=========================================="
echo "📊 RESUMO DO TESTE"
echo "=========================================="
echo "Plano: $PLAN_NAME"
echo "Limite de categorias: $MAX_CATEGORIES"
echo "Categorias iniciais: $CUSTOM_COUNT"
echo "Tentativas de criação: $CATEGORIES_TO_CREATE"
echo "Criadas com sucesso: $SUCCESS_COUNT"
echo "Bloqueadas: $FAILED_COUNT"
echo "Total final: $FINAL_CURRENT"
echo "Pode criar mais: $FINAL_ALLOWED"
echo "=========================================="
echo ""

if [ "$MAX_CATEGORIES" = "3" ] && [ "$FINAL_CURRENT" -le "3" ] && [ "$FINAL_ALLOWED" = "false" ]; then
  echo "✅ TESTE PASSOU: Limite de 3 categorias funcionando corretamente!"
  exit 0
elif [ "$MAX_CATEGORIES" = "null" ]; then
  echo "ℹ️  PLANO ILIMITADO: Usuário não está no plano gratuito"
  exit 0
else
  echo "⚠️  Verificar resultado acima"
  exit 0
fi
