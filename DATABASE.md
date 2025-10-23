# Database Schema

This document describes the database schema for the Financial Control API using Supabase (PostgreSQL).

## Tables

### users

Stores user account information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan_id UUID REFERENCES plans(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### transactions

Stores financial transactions (income and expenses).

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transactions
CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own transactions
CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own transactions
CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
```

### plans

Stores subscription plans.

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read plans
CREATE POLICY "Anyone can read plans" ON plans
  FOR SELECT TO authenticated, anon USING (true);

-- Only admins can manage plans
CREATE POLICY "Admins can manage plans" ON plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
```

## Indexes

Additional indexes for performance:

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_transactions_category ON transactions(category);
```

## Triggers

Update timestamps automatically:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Initial Data

Insert some default plans:

```sql
INSERT INTO plans (name, description, price, features) VALUES
  ('Free', 'Basic financial control', 0, '["Up to 50 transactions/month", "Basic reports"]'),
  ('Premium', 'Advanced features', 9.99, '["Unlimited transactions", "Advanced reports", "Export data", "Priority support"]'),
  ('Business', 'For businesses', 29.99, '["Everything in Premium", "Multi-user support", "API access", "Custom categories"]');
```

## Setup Instructions

1. Create a new Supabase project
2. Run the SQL commands above in the Supabase SQL Editor
3. Enable authentication in Supabase settings
4. Copy your Supabase URL and keys to `.env` file
5. Ensure Row Level Security (RLS) is enabled for all tables

## Notes

- All tables use UUID for primary keys
- Row Level Security (RLS) is enabled to protect user data
- Indexes are created for commonly queried fields
- Timestamps are automatically updated using triggers
