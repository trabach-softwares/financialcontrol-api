# Quick Start Guide

Get the Financial Control API up and running in 5 minutes!

## 1. Prerequisites

```bash
# Verify you have Node.js 18+
node --version

# Verify npm
npm --version
```

## 2. Clone & Install

```bash
# Clone the repository
git clone https://github.com/trabach-softwares/financialcontrol-api.git
cd financialcontrol-api

# Install dependencies
npm install
```

## 3. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run these commands:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  plan_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  features JSONB,
  max_transactions INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
```

See `DATABASE.md` for complete RLS policies.

## 4. Environment Setup

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3000
NODE_ENV=development

# Get these from Supabase Dashboard > Settings > API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Generate a strong secret (use: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000
```

## 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
🚀 Server is running on port 3000
📍 Environment: development
🔗 API URL: http://localhost:3000
🏥 Health check: http://localhost:3000/health
```

## 6. Test the API

### Check Health
```bash
curl http://localhost:3000/health
```

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "senha123",
    "name": "João Silva"
  }'
```

Save the token from the response!

### Create a Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "type": "income",
    "amount": 1500.00,
    "description": "Salário",
    "category": "Trabalho"
  }'
```

### Get Transactions
```bash
curl http://localhost:3000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 7. Import API Collection

Import `api-collection.json` into Postman or Insomnia for easier testing!

## 8. Deploy (Optional)

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard
```

### Render
1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Add environment variables
5. Deploy!

See `DEPLOYMENT.md` for detailed instructions.

## Common Issues

### "Missing Supabase environment variables"
- Check that `.env` file exists
- Verify `SUPABASE_URL` and keys are set
- Restart the server after changing `.env`

### "Invalid credentials"
- Password must be at least 6 characters
- Check email format
- User might already exist (try login instead)

### CORS errors
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Use comma-separated list for multiple origins
- Restart server after changing

### Rate limit errors
- Wait 15 minutes and try again
- Or disable rate limiting in development (see `SECURITY.md`)

## Next Steps

- 📖 Read `API_DOCS.md` for complete API reference
- 🗄️ Read `DATABASE.md` for RLS policies
- 🔒 Read `SECURITY.md` for security best practices
- 🚀 Read `DEPLOYMENT.md` for production deployment
- 📮 Use `api-collection.json` for API testing

## Getting Help

- Check the documentation files
- Review example requests in `API_DOCS.md`
- Test with the Postman collection
- Open an issue on GitHub

## Project Structure

```
src/
├── config/          # Configuration (Supabase, JWT)
├── controllers/     # Request handlers
├── middleware/      # Auth, rate limiting
├── routes/          # Route definitions
├── services/        # Business logic
└── utils/           # Helpers (response format)
```

## Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm test           # Run tests (placeholder)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `JWT_EXPIRES_IN` | No | Token expiration (default: 7d) |
| `ALLOWED_ORIGINS` | No | CORS allowed origins |

## API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Current user | Yes |
| POST | `/api/transactions` | Create transaction | Yes |
| GET | `/api/transactions` | List transactions | Yes |
| GET | `/api/transactions/:id` | Get transaction | Yes |
| PUT | `/api/transactions/:id` | Update transaction | Yes |
| DELETE | `/api/transactions/:id` | Delete transaction | Yes |
| GET | `/api/transactions/stats` | Get statistics | Yes |
| GET | `/api/users/profile` | Get profile | Yes |
| PUT | `/api/users/profile` | Update profile | Yes |
| PUT | `/api/users/password` | Change password | Yes |
| GET | `/api/plans` | List plans | No |
| GET | `/api/admin/users` | List users | Admin |
| GET | `/api/admin/stats` | Statistics | Admin |

Happy coding! 🚀
