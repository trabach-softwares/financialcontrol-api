-- Query para verificar transações do mês atual por usuário
-- Execute isso no Supabase SQL Editor ou psql

-- Ver todas as transações de novembro/2025 do usuário
SELECT 
  id,
  date,
  type,
  amount,
  description,
  created_at
FROM transactions
WHERE user_id = '05c4cdbb-312a-4548-93f0-11923e9b3d00'
  AND date >= '2025-11-01'
  AND date <= '2025-11-30'
ORDER BY date DESC;

-- Contar transações de novembro/2025
SELECT 
  COUNT(*) as total_novembro,
  COUNT(CASE WHEN type = 'income' THEN 1 END) as receitas,
  COUNT(CASE WHEN type = 'expense' THEN 1 END) as despesas
FROM transactions
WHERE user_id = '05c4cdbb-312a-4548-93f0-11923e9b3d00'
  AND date >= '2025-11-01'
  AND date <= '2025-11-30';

-- Ver todas as transações do usuário (total)
SELECT 
  COUNT(*) as total_geral,
  MIN(date) as data_mais_antiga,
  MAX(date) as data_mais_recente
FROM transactions
WHERE user_id = '05c4cdbb-312a-4548-93f0-11923e9b3d00';

-- Ver distribuição por mês
SELECT 
  DATE_TRUNC('month', date::timestamp) as mes,
  COUNT(*) as total
FROM transactions
WHERE user_id = '05c4cdbb-312a-4548-93f0-11923e9b3d00'
GROUP BY DATE_TRUNC('month', date::timestamp)
ORDER BY mes DESC;
