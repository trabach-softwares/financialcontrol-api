# Financial Control API 💰

REST API para SaaS de controle financeiro com Node.js, Express e Supabase (PostgreSQL).

## 🚀 Características

- **Autenticação JWT** - Login e registro seguros
- **CRUD Completo de Transações** - Gerenciamento de receitas e despesas
- **Sistema de Planos** - Suporte para diferentes níveis de assinatura
- **Painel Administrativo** - Gestão de usuários e estatísticas
- **RLS do Supabase** - Segurança em nível de banco de dados
- **Estrutura Modular** - Routes/Controllers/Services
- **Resposta JSON Padrão** - `{success, data, message}`
- **Deploy Ready** - Configurado para Vercel ou Render

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

Edite o arquivo `.env` com suas credenciais:
```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:3000
```

4. Configure o banco de dados Supabase:
   - Acesse o Supabase Dashboard
   - Execute os comandos SQL em `DATABASE.md`
   - Isso criará as tabelas e políticas RLS necessárias

5. Inicie o servidor:
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 Estrutura do Projeto

```
src/
├── config/          # Configurações (Supabase, JWT)
├── controllers/     # Controladores das rotas
├── middleware/      # Middlewares (autenticação, etc)
├── routes/          # Definição de rotas
├── services/        # Lógica de negócio
├── utils/           # Utilitários (resposta padrão)
├── app.js          # Configuração do Express
└── server.js       # Ponto de entrada
```

## 🔐 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter dados do usuário autenticado

### Transações
- `POST /api/transactions` - Criar transação
- `GET /api/transactions` - Listar transações (com filtros)
- `GET /api/transactions/:id` - Obter transação específica
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Deletar transação
- `GET /api/transactions/stats` - Estatísticas financeiras

### Usuários
- `GET /api/users/profile` - Obter perfil
- `PUT /api/users/profile` - Atualizar perfil
- `PUT /api/users/password` - Alterar senha
- `PUT /api/users/plan` - Atualizar plano

### Planos
- `GET /api/plans` - Listar planos (público)
- `GET /api/plans/:id` - Obter plano específico
- `POST /api/plans` - Criar plano (admin)
- `PUT /api/plans/:id` - Atualizar plano (admin)
- `DELETE /api/plans/:id` - Deletar plano (admin)

### Admin
- `GET /api/admin/users` - Listar todos usuários
- `GET /api/admin/users/:id` - Obter usuário específico
- `PUT /api/admin/users/:id/role` - Atualizar role do usuário
- `DELETE /api/admin/users/:id` - Deletar usuário
- `GET /api/admin/stats` - Estatísticas gerais

## 📝 Exemplos de Uso

### Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ss123!",
    "name": "João Silva"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ss123!"
  }'
```

### Criar Transação
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "income",
    "amount": 1500.00,
    "description": "Salário",
    "category": "Trabalho",
    "date": "2024-01-15"
  }'
```

### Listar Transações
```bash
curl -X GET "http://localhost:3000/api/transactions?type=income" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔒 Segurança

- **JWT Authentication** - Tokens seguros para autenticação
- **Password Hashing** - Senhas criptografadas com bcrypt
- **RLS Policies** - Políticas de segurança no banco de dados
- **CORS** - Configuração de origens permitidas
- **Helmet** - Headers de segurança HTTP
- **Input Validation** - Validação de dados de entrada

## 🌐 Deploy

### Vercel

1. Instale a CLI do Vercel:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configure as variáveis de ambiente no dashboard da Vercel

### Render

1. Conecte seu repositório ao Render
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Modo desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

## 📦 Dependências Principais

- **express** - Framework web
- **@supabase/supabase-js** - Cliente Supabase
- **jsonwebtoken** - Autenticação JWT
- **bcryptjs** - Hash de senhas
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Segurança HTTP
- **morgan** - Logging HTTP
- **dotenv** - Variáveis de ambiente

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

ISC

## 👨‍💻 Autor

Trabach Softwares
