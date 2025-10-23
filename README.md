# Financial Control API

REST API para SaaS de Controle Financeiro desenvolvida com Node.js, Express e Supabase (PostgreSQL).

## 🚀 Recursos

- ✅ Autenticação JWT (Login e Register)
- ✅ CRUD completo de transações financeiras (receitas e despesas)
- ✅ Gerenciamento de usuários
- ✅ Sistema de planos de assinatura
- ✅ Painel administrativo
- ✅ Row Level Security (RLS) no Supabase
- ✅ Resposta JSON padronizada
- ✅ Rate limiting e segurança com Helmet
- ✅ Pronto para deploy (Vercel/Render)

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/trabach-softwares/financialcontrol-api.git
cd financialcontrol-api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

JWT_SECRET=sua_chave_secreta_jwt
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

4. Configure o banco de dados no Supabase:
   - Acesse o Supabase SQL Editor
   - Execute os scripts SQL do arquivo `DATABASE.md`
   - Isso criará todas as tabelas, políticas RLS e dados iniciais

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

A API estará disponível em `http://localhost:3000`

## 📚 Documentação

### Estrutura do Projeto

```
src/
├── config/          # Configurações (Supabase, JWT)
├── controllers/     # Controladores das rotas
├── services/        # Lógica de negócio
├── routes/          # Definição de rotas
├── middlewares/     # Middlewares (auth, error handler)
├── utils/           # Utilitários (response format)
├── app.js          # Configuração do Express
└── server.js       # Entry point
```

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário

#### Transações
- `POST /api/transactions` - Criar transação
- `GET /api/transactions` - Listar transações (com filtros)
- `GET /api/transactions/summary` - Resumo financeiro
- `GET /api/transactions/:id` - Obter transação
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Deletar transação

#### Usuários
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/:id` - Obter usuário
- `PUT /api/users/profile` - Atualizar perfil
- `PUT /api/users/password` - Alterar senha
- `DELETE /api/users/profile` - Deletar conta

#### Planos
- `GET /api/plans` - Listar planos (público)
- `GET /api/plans/:id` - Obter plano (público)
- `POST /api/plans/subscribe` - Assinar plano
- `POST /api/plans` - Criar plano (admin)
- `PUT /api/plans/:id` - Atualizar plano (admin)
- `DELETE /api/plans/:id` - Deletar plano (admin)

#### Admin
- `GET /api/admin/users` - Listar todos usuários
- `PUT /api/admin/users/:id/role` - Alterar role do usuário
- `DELETE /api/admin/users/:id` - Deletar usuário
- `GET /api/admin/stats` - Estatísticas do sistema
- `GET /api/admin/transactions` - Todas transações

### Formato de Resposta

Todas as respostas seguem o padrão:

```json
{
  "success": true,
  "data": { ... },
  "message": "Mensagem descritiva"
}
```

Documentação completa disponível em: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🗄️ Banco de Dados

O schema do banco está documentado em [DATABASE.md](./DATABASE.md).

Tabelas principais:
- `users` - Usuários do sistema
- `transactions` - Transações financeiras
- `plans` - Planos de assinatura

## 🔐 Segurança

- Senhas criptografadas com bcryptjs
- Autenticação JWT
- Row Level Security (RLS) no Supabase
- Rate limiting (100 req/15min por IP)
- Helmet.js para headers de segurança
- CORS configurável

## 🚀 Deploy

### Vercel

1. Instale o Vercel CLI: `npm i -g vercel`
2. Execute: `vercel`
3. Configure as variáveis de ambiente no dashboard da Vercel

### Render

1. Conecte seu repositório no Render
2. Configure as variáveis de ambiente
3. O `render.yaml` já está configurado

## 🚀 Quick Start

Para começar rapidamente, siga o guia: [QUICKSTART.md](./QUICKSTART.md)

## 🧪 Testando a API

### Postman Collection

Importe a collection `POSTMAN_COLLECTION.json` no Postman para testar todos os endpoints facilmente. Ideal para:
- Testar múltiplos endpoints rapidamente
- Salvar tokens automaticamente entre requests
- Organizar e compartilhar testes com a equipe

### cURL Examples

Utilize cURL para testes rápidos via linha de comando. Ideal para:
- Testes automatizados e scripts
- CI/CD pipelines
- Verificações rápidas de disponibilidade

```bash
# Health check
curl http://localhost:3000/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Supabase** - PostgreSQL + Auth + RLS
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Helmet** - Segurança
- **CORS** - Cross-Origin Resource Sharing
- **express-rate-limit** - Rate limiting

## 📝 Licença

ISC

## 👥 Autor

Trabach Softwares
