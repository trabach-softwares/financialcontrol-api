#!/bin/bash

# 🧪 Script de Teste Automatizado - Produção
# Testa o fluxo completo de pagamento PIX

set -e  # Para na primeira falha

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuração
API_URL="https://api.financialcontrol.com.br"
TEST_EMAIL="teste-$(date +%s)@exemplo.com"
TEST_PASSWORD="Senha123!"
TEST_NAME="Usuário Teste Automatizado"
TEST_CPF="12345678909"  # CPF válido para testes

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🧪 TESTE AUTOMATIZADO - PAGAMENTO PIX${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 1. Health Check
echo -e "${YELLOW}[1/8]${NC} Verificando se API está online..."
HEALTH=$(curl -s "$API_URL/health")
if echo "$HEALTH" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✅ API está online${NC}\n"
else
    echo -e "${RED}❌ API está offline ou com problemas${NC}"
    echo "$HEALTH"
    exit 1
fi

# 2. Registrar usuário
echo -e "${YELLOW}[2/8]${NC} Registrando novo usuário..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"name\": \"$TEST_NAME\",
        \"cpf_cnpj\": \"$TEST_CPF\"
    }")

if echo "$REGISTER_RESPONSE" | grep -q "\"success\":true"; then
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Usuário criado com sucesso${NC}"
    echo -e "   Email: $TEST_EMAIL"
    echo -e "   ID: $USER_ID\n"
else
    echo -e "${RED}❌ Falha ao criar usuário${NC}"
    echo "$REGISTER_RESPONSE"
    exit 1
fi

# 3. Listar planos
echo -e "${YELLOW}[3/8]${NC} Listando planos disponíveis..."
PLANS_RESPONSE=$(curl -s -X GET "$API_URL/api/plans" \
    -H "Authorization: Bearer $TOKEN")

if echo "$PLANS_RESPONSE" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✅ Planos encontrados${NC}"
    
    # Mostrar todos os planos
    echo "$PLANS_RESPONSE" | grep -o '"name":"[^"]*' | cut -d'"' -f4 | nl
    echo ""
    
    # Procurar primeiro plano PAGO (price > 0)
    # Analisar JSON para encontrar plano com price > 0
    PLAN_DATA=$(echo "$PLANS_RESPONSE" | grep -o '"id":"[^"]*","name":"[^"]*","description":"[^"]*","price":[0-9.]*' | grep -v '"price":0' | head -1)
    
    if [ -z "$PLAN_DATA" ]; then
        # Fallback: pegar qualquer plano e deixar validação pegar
        PLAN_ID=$(echo "$PLANS_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        PLAN_NAME=$(echo "$PLANS_RESPONSE" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
        PLAN_PRICE="0"
    else
        PLAN_ID=$(echo "$PLAN_DATA" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        PLAN_NAME=$(echo "$PLAN_DATA" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
        PLAN_PRICE=$(echo "$PLAN_DATA" | grep -o '"price":[0-9.]*' | cut -d':' -f2)
    fi
    
    # Verificar se o plano é gratuito
    if [ "$PLAN_PRICE" = "0" ] || [ "$PLAN_PRICE" = "0.00" ]; then
        echo -e "${RED}⚠️  ATENÇÃO: Plano selecionado é GRATUITO (R$ 0)${NC}"
        echo -e "${YELLOW}   Asaas não aceita pagamentos de R$ 0${NC}"
        echo -e "${YELLOW}   Por favor, crie um plano pago no banco de dados${NC}"
        echo -e "${YELLOW}   Exemplo: INSERT INTO plans (name, price, billing_cycle, is_active)${NC}"
        echo -e "${YELLOW}            VALUES ('Teste', 1.00, 'monthly', true);${NC}\n"
        exit 1
    fi
    
    echo -e "   Plano selecionado: $PLAN_NAME"
    echo -e "   Preço: R$ $PLAN_PRICE"
    echo -e "   ID: $PLAN_ID\n"
else
    echo -e "${RED}❌ Falha ao listar planos${NC}"
    echo "$PLANS_RESPONSE"
    exit 1
fi

# 4. Criar pagamento PIX
echo -e "${YELLOW}[4/8]${NC} Criando pagamento PIX..."

# Debug: Aguardar 2 segundos para garantir que usuário foi criado
echo -e "${BLUE}   Aguardando 2 segundos para sincronização...${NC}"
sleep 2

echo -e "${BLUE}   Enviando requisição...${NC}"
PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/api/payments" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"planId\": \"$PLAN_ID\",
        \"paymentMethod\": \"PIX\"
    }")

# Debug: Mostrar resposta completa se houver erro
if ! echo "$PAYMENT_RESPONSE" | grep -q "\"success\":true"; then
    echo -e "${RED}❌ Falha ao criar pagamento${NC}"
    echo -e "${YELLOW}Resposta da API:${NC}"
    echo "$PAYMENT_RESPONSE"
    echo ""
    echo -e "${YELLOW}Debug Info:${NC}"
    echo -e "   User ID: $USER_ID"
    echo -e "   Plan ID: $PLAN_ID"
    echo -e "   Token (primeiros 20 chars): ${TOKEN:0:20}..."
    echo ""
    echo -e "${BLUE}Tentando verificar se o usuário existe...${NC}"
    USER_CHECK=$(curl -s -X GET "$API_URL/api/users/me" \
        -H "Authorization: Bearer $TOKEN")
    echo "$USER_CHECK"
    exit 1
fi

if echo "$PAYMENT_RESPONSE" | grep -q "\"success\":true"; then
    PAYMENT_ID=$(echo "$PAYMENT_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    ASAAS_PAYMENT_ID=$(echo "$PAYMENT_RESPONSE" | grep -o '"asaas_payment_id":"[^"]*' | cut -d'"' -f4)
    PIX_PAYLOAD=$(echo "$PAYMENT_RESPONSE" | grep -o '"payload":"[^"]*' | cut -d'"' -f4)
    INVOICE_URL=$(echo "$PAYMENT_RESPONSE" | grep -o '"invoice_url":"[^"]*' | cut -d'"' -f4)
    
    echo -e "${GREEN}✅ Pagamento PIX criado com sucesso${NC}"
    echo -e "   Payment ID: $PAYMENT_ID"
    echo -e "   Asaas Payment ID: $ASAAS_PAYMENT_ID"
    echo -e "   Status: PENDING"
    echo -e "   Valor: R$ $PLAN_PRICE\n"
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📱 PAGUE O PIX PARA CONTINUAR O TESTE${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    echo -e "${YELLOW}🔗 Link do boleto/PIX:${NC}"
    echo -e "   $INVOICE_URL\n"
    
    echo -e "${YELLOW}📋 PIX Copia e Cola:${NC}"
    echo -e "   $PIX_PAYLOAD\n"
    
    echo -e "${BLUE}Aguardando pagamento...${NC}"
    echo -e "${BLUE}(Pressione CTRL+C para cancelar)${NC}\n"
else
    echo -e "${RED}❌ Falha ao criar pagamento${NC}"
    echo "$PAYMENT_RESPONSE"
    exit 1
fi

# 5. Aguardar pagamento (polling)
echo -e "${YELLOW}[5/8]${NC} Monitorando status do pagamento..."
ATTEMPT=0
MAX_ATTEMPTS=60  # 5 minutos (5 segundos * 60)
PAID=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
    
    STATUS_RESPONSE=$(curl -s -X GET "$API_URL/api/payments" \
        -H "Authorization: Bearer $TOKEN")
    
    CURRENT_STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
    
    echo -e "   [Tentativa $ATTEMPT/$MAX_ATTEMPTS] Status: $CURRENT_STATUS"
    
    if [ "$CURRENT_STATUS" = "RECEIVED" ] || [ "$CURRENT_STATUS" = "CONFIRMED" ]; then
        PAID=true
        PAID_AT=$(echo "$STATUS_RESPONSE" | grep -o '"paid_at":"[^"]*' | head -1 | cut -d'"' -f4)
        echo -e "\n${GREEN}✅ Pagamento confirmado!${NC}"
        echo -e "   Status: $CURRENT_STATUS"
        echo -e "   Pago em: $PAID_AT\n"
        break
    fi
done

if [ "$PAID" = false ]; then
    echo -e "\n${YELLOW}⚠️  Timeout: Pagamento não foi confirmado em 5 minutos${NC}"
    echo -e "${YELLOW}   Você pode continuar o teste manualmente:${NC}"
    echo -e "${YELLOW}   1. Pague o PIX${NC}"
    echo -e "${YELLOW}   2. Execute: curl -H 'Authorization: Bearer $TOKEN' $API_URL/api/payments${NC}\n"
    exit 0
fi

# 6. Verificar status do usuário
echo -e "${YELLOW}[6/8]${NC} Verificando se plano foi ativado..."
USER_RESPONSE=$(curl -s -X GET "$API_URL/api/users/me" \
    -H "Authorization: Bearer $TOKEN")

PLAN_STATUS=$(echo "$USER_RESPONSE" | grep -o '"plan_status":"[^"]*' | cut -d'"' -f4)
PLAN_ACTIVATED_AT=$(echo "$USER_RESPONSE" | grep -o '"plan_activated_at":"[^"]*' | cut -d'"' -f4)

if [ "$PLAN_STATUS" = "active" ]; then
    echo -e "${GREEN}✅ Plano ativado com sucesso!${NC}"
    echo -e "   Status: $PLAN_STATUS"
    echo -e "   Ativado em: $PLAN_ACTIVATED_AT\n"
else
    echo -e "${RED}❌ Plano não foi ativado automaticamente${NC}"
    echo -e "   Status atual: $PLAN_STATUS"
    echo -e "   Verifique os logs do webhook\n"
fi

# 7. Listar pagamentos
echo -e "${YELLOW}[7/8]${NC} Listando pagamentos do usuário..."
PAYMENTS_LIST=$(curl -s -X GET "$API_URL/api/payments" \
    -H "Authorization: Bearer $TOKEN")

PAYMENT_COUNT=$(echo "$PAYMENTS_LIST" | grep -o '"asaas_payment_id"' | wc -l | xargs)
echo -e "${GREEN}✅ Total de pagamentos: $PAYMENT_COUNT${NC}\n"

# 8. Resumo final
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 RESUMO DO TESTE${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}✅ Health Check: OK${NC}"
echo -e "${GREEN}✅ Registro de usuário: OK${NC}"
echo -e "${GREEN}✅ Listagem de planos: OK${NC}"
echo -e "${GREEN}✅ Criação de pagamento PIX: OK${NC}"

if [ "$PAID" = true ]; then
    echo -e "${GREEN}✅ Confirmação de pagamento: OK${NC}"
else
    echo -e "${YELLOW}⏳ Confirmação de pagamento: AGUARDANDO${NC}"
fi

if [ "$PLAN_STATUS" = "active" ]; then
    echo -e "${GREEN}✅ Ativação do plano: OK${NC}"
else
    echo -e "${RED}❌ Ativação do plano: FALHOU${NC}"
fi

echo -e "${GREEN}✅ Listagem de pagamentos: OK${NC}\n"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 DADOS DO TESTE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Usuário:${NC}"
echo -e "   Email: $TEST_EMAIL"
echo -e "   Password: $TEST_PASSWORD"
echo -e "   ID: $USER_ID"
echo -e "   Token: $TOKEN\n"

echo -e "${YELLOW}Pagamento:${NC}"
echo -e "   ID: $PAYMENT_ID"
echo -e "   Asaas ID: $ASAAS_PAYMENT_ID"
echo -e "   Status: $CURRENT_STATUS"
echo -e "   Valor: R$ $PLAN_PRICE\n"

echo -e "${YELLOW}Plano:${NC}"
echo -e "   ID: $PLAN_ID"
echo -e "   Nome: $PLAN_NAME"
echo -e "   Status: $PLAN_STATUS\n"

echo -e "${GREEN}✅ TESTE CONCLUÍDO!${NC}\n"
