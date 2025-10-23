# Quick Start Guide

Este guia ajudará você a configurar e executar a API em poucos minutos.

## 1. Configurar Supabase

### Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Aguarde o projeto ser provisionado

### Obter Credenciais
1. No dashboard do projeto, vá em **Settings** → **API**
2. Copie:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)

### Configurar Banco de Dados
1. No dashboard, vá em **SQL Editor**
2. Abra o arquivo `DATABASE.md` deste repositório
3. Copie e execute cada bloco SQL no editor:
   - Criação das tabelas (users, transactions, plans)
   - Políticas RLS
   - Índices
   - Triggers
   - Dados iniciais (planos)

## 2. Configurar a API

### Instalar Dependências
```bash
npm install
```

### Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

JWT_SECRET=sua_chave_secreta_jwt_aqui
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 3. Executar a API

### Modo Desenvolvimento
```bash
npm run dev
```

### Modo Produção
```bash
npm start
```

A API estará rodando em `http://localhost:3000`

## 4. Testar a API

### Teste Rápido com cURL

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Registrar Usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha123",
    "name": "Usuário Teste"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha123"
  }'
```

Copie o token retornado para usar nos próximos comandos.

#### Criar Transação
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "type": "income",
    "amount": 1500.00,
    "category": "Salário",
    "description": "Salário mensal",
    "date": "2025-10-23"
  }'
```

#### Listar Transações
```bash
curl http://localhost:3000/api/transactions \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Obter Resumo Financeiro
```bash
curl http://localhost:3000/api/transactions/summary \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Teste com Postman

1. Importe o arquivo `POSTMAN_COLLECTION.json` no Postman
2. Configure a variável `baseUrl` se necessário
3. Execute os requests na ordem:
   - Register ou Login (o token será salvo automaticamente)
   - Demais endpoints já terão o token configurado

## 5. Deploy

### Vercel

1. Instale o Vercel CLI:
```bash
npm i -g vercel
```

2. Execute na pasta do projeto:
```bash
vercel
```

3. Adicione as variáveis de ambiente no dashboard da Vercel:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - JWT_SECRET
   - ALLOWED_ORIGINS

### Render

1. Conecte seu repositório no [render.com](https://render.com)
2. Crie um novo Web Service
3. Configure as variáveis de ambiente
4. O `render.yaml` já está configurado

## 6. Próximos Passos

- Leia a documentação completa em `API_DOCUMENTATION.md`
- Revise o schema do banco em `DATABASE.md`
- Configure CORS para seu frontend em produção
- Ajuste o rate limiting conforme necessário
- Configure backup automático no Supabase

## Troubleshooting

### Erro de conexão com Supabase
- Verifique se as credenciais estão corretas no `.env`
- Confirme que o projeto Supabase está ativo
- Teste a conexão diretamente no Supabase

### Token inválido
- Verifique se o JWT_SECRET está configurado
- Confirme que o token está sendo enviado no header Authorization
- Formato correto: `Bearer seu_token_aqui`

### Erro 403 (Forbidden)
- RLS policies podem estar bloqueando o acesso
- Verifique se as políticas foram criadas corretamente
- Use o service_role key para operações administrativas

### Rate limit atingido
- Aguarde 15 minutos ou ajuste o limite em `src/app.js`
- Linha: `max: 100` (requests por janela)

## Suporte

Para mais informações, consulte:
- README.md - Visão geral do projeto
- API_DOCUMENTATION.md - Documentação completa da API
- DATABASE.md - Schema e configuração do banco de dados
