#!/bin/bash

echo "🚀 Preparando deploy para o Render..."

# Verificar se está em um repositório git
if [ ! -d ".git" ]; then
    echo "❌ Este não é um repositório git. Execute 'git init' primeiro."
    exit 1
fi

# Verificar se existem mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Existem mudanças não commitadas. Commitando automaticamente..."
    git add .
    git commit -m "Deploy: Prepare for Render deployment"
fi

# Push para o repositório
echo "📤 Fazendo push para o repositório..."
git push origin main

echo "✅ Código enviado para o GitHub!"
echo ""
echo "🔗 Próximos passos:"
echo "1. Acesse: https://render.com"
echo "2. Clique em 'New +' → 'Web Service'"
echo "3. Conecte seu repositório GitHub"
echo "4. Configure as variáveis de ambiente (ver .env.example)"
echo "5. Clique em 'Create Web Service'"
echo ""
echo "📚 Documentação completa: DEPLOYMENT_RENDER.md"