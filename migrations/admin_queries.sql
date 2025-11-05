-- =====================================================
-- Scripts SQL Úteis - Administração de Pagamentos
-- =====================================================

-- =====================================================
-- CONSULTAS BÁSICAS
-- =====================================================

-- Ver todos os pagamentos recentes
SELECT 
  p.id,
  p.asaas_payment_id,
  u.name as usuario,
  u.email,
  pl.name as plano,
  p.value,
  p.payment_method,
  p.status,
  p.created_at,
  p.paid_at
FROM payments p
JOIN users u ON p.user_id = u.id
JOIN plans pl ON p.plan_id = pl.id
ORDER BY p.created_at DESC
LIMIT 50;

-- Ver pagamentos pendentes
SELECT 
  p.asaas_payment_id,
  u.name,
  u.email,
  p.value,
  p.payment_method,
  p.due_date,
  DATE_PART('day', p.due_date - NOW()) as dias_restantes
FROM payments p
JOIN users u ON p.user_id = u.id
WHERE p.status = 'PENDING'
ORDER BY p.due_date;

-- Ver pagamentos confirmados hoje
SELECT 
  COUNT(*) as total,
  SUM(value) as valor_total,
  SUM(net_value) as valor_liquido
FROM payments
WHERE status IN ('RECEIVED', 'CONFIRMED')
  AND DATE(confirmed_at) = CURRENT_DATE;

-- =====================================================
-- RELATÓRIOS
-- =====================================================

-- Resumo por método de pagamento
SELECT 
  payment_method,
  COUNT(*) as quantidade,
  SUM(value) as valor_total,
  SUM(net_value) as valor_liquido,
  ROUND(AVG(value), 2) as ticket_medio
FROM payments
WHERE status IN ('RECEIVED', 'CONFIRMED')
GROUP BY payment_method
ORDER BY valor_total DESC;

-- Resumo por status
SELECT 
  status,
  COUNT(*) as quantidade,
  SUM(value) as valor_total
FROM payments
GROUP BY status
ORDER BY quantidade DESC;

-- Receita mensal
SELECT 
  DATE_TRUNC('month', confirmed_at) as mes,
  COUNT(*) as pagamentos,
  SUM(value) as valor_bruto,
  SUM(net_value) as valor_liquido
FROM payments
WHERE status IN ('RECEIVED', 'CONFIRMED')
  AND confirmed_at >= DATE_TRUNC('year', NOW())
GROUP BY mes
ORDER BY mes DESC;

-- Top 10 usuários que mais pagaram
SELECT 
  u.name,
  u.email,
  COUNT(p.id) as total_pagamentos,
  SUM(p.value) as valor_total
FROM users u
JOIN payments p ON u.id = p.user_id
WHERE p.status IN ('RECEIVED', 'CONFIRMED')
GROUP BY u.id, u.name, u.email
ORDER BY valor_total DESC
LIMIT 10;

-- =====================================================
-- USUÁRIOS E PLANOS
-- =====================================================

-- Usuários com plano ativo
SELECT 
  u.id,
  u.name,
  u.email,
  pl.name as plano,
  u.plan_status,
  u.plan_activated_at,
  DATE_PART('day', NOW() - u.plan_activated_at) as dias_ativo
FROM users u
JOIN plans pl ON u.plan_id = pl.id
WHERE u.plan_status = 'active'
ORDER BY u.plan_activated_at DESC;

-- Usuários sem plano ativo
SELECT 
  u.id,
  u.name,
  u.email,
  u.plan_status,
  u.created_at,
  DATE_PART('day', NOW() - u.created_at) as dias_cadastrado
FROM users u
WHERE u.plan_status != 'active' OR u.plan_status IS NULL
ORDER BY u.created_at DESC;

-- Distribuição de usuários por plano
SELECT 
  COALESCE(pl.name, 'Sem Plano') as plano,
  COUNT(*) as usuarios,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM users u
LEFT JOIN plans pl ON u.plan_id = pl.id
GROUP BY pl.name
ORDER BY usuarios DESC;

-- =====================================================
-- ANÁLISE DE CONVERSÃO
-- =====================================================

-- Taxa de conversão (pagamentos criados vs confirmados)
SELECT 
  DATE_TRUNC('day', created_at) as dia,
  COUNT(*) as criados,
  COUNT(*) FILTER (WHERE status IN ('RECEIVED', 'CONFIRMED')) as confirmados,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('RECEIVED', 'CONFIRMED')) * 100.0 / COUNT(*), 
    2
  ) as taxa_conversao
FROM payments
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY dia
ORDER BY dia DESC;

-- Pagamentos vencidos
SELECT 
  u.name,
  u.email,
  p.asaas_payment_id,
  p.value,
  p.payment_method,
  p.due_date,
  DATE_PART('day', NOW() - p.due_date) as dias_vencido
FROM payments p
JOIN users u ON p.user_id = u.id
WHERE p.status = 'OVERDUE'
ORDER BY p.due_date;

-- =====================================================
-- MANUTENÇÃO
-- =====================================================

-- Encontrar pagamentos duplicados (mesmo usuário, plano e valor)
SELECT 
  user_id,
  plan_id,
  value,
  COUNT(*) as duplicatas
FROM payments
WHERE status = 'PENDING'
GROUP BY user_id, plan_id, value
HAVING COUNT(*) > 1;

-- Limpar pagamentos cancelados antigos (mais de 90 dias)
-- CUIDADO: Revise antes de executar!
-- DELETE FROM payments 
-- WHERE status = 'CANCELLED' 
--   AND created_at < NOW() - INTERVAL '90 days';

-- Sincronizar status de planos (reprocessar)
UPDATE users u
SET 
  plan_status = 'active',
  plan_activated_at = p.confirmed_at
FROM (
  SELECT DISTINCT ON (user_id) 
    user_id,
    plan_id,
    confirmed_at
  FROM payments
  WHERE status IN ('RECEIVED', 'CONFIRMED')
  ORDER BY user_id, confirmed_at DESC
) p
WHERE u.id = p.user_id
  AND (u.plan_status != 'active' OR u.plan_id != p.plan_id);

-- =====================================================
-- AUDITORIA
-- =====================================================

-- Ver logs de alterações recentes na tabela payments
SELECT 
  p.asaas_payment_id,
  u.email,
  p.status,
  p.created_at,
  p.updated_at,
  EXTRACT(EPOCH FROM (p.updated_at - p.created_at)) / 60 as minutos_ate_atualizacao
FROM payments p
JOIN users u ON p.user_id = u.id
WHERE p.updated_at > p.created_at
ORDER BY p.updated_at DESC
LIMIT 50;

-- Verificar integridade (pagamentos sem usuário ou plano)
SELECT 
  p.id,
  p.asaas_payment_id,
  p.user_id,
  p.plan_id,
  CASE
    WHEN u.id IS NULL THEN 'Usuário não existe'
    WHEN pl.id IS NULL THEN 'Plano não existe'
    ELSE 'OK'
  END as problema
FROM payments p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN plans pl ON p.plan_id = pl.id
WHERE u.id IS NULL OR pl.id IS NULL;

-- =====================================================
-- ESTATÍSTICAS AVANÇADAS
-- =====================================================

-- Tempo médio para pagamento (criação até confirmação)
SELECT 
  payment_method,
  COUNT(*) as pagamentos,
  ROUND(AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at)) / 60), 2) as tempo_medio_minutos,
  MIN(confirmed_at - created_at) as tempo_minimo,
  MAX(confirmed_at - created_at) as tempo_maximo
FROM payments
WHERE status IN ('RECEIVED', 'CONFIRMED')
  AND confirmed_at IS NOT NULL
GROUP BY payment_method;

-- Churn (usuários que cancelaram/expiraram nos últimos 30 dias)
SELECT 
  DATE_TRUNC('day', updated_at) as dia,
  COUNT(*) as churns
FROM users
WHERE plan_status IN ('cancelled', 'expired', 'inactive')
  AND updated_at >= NOW() - INTERVAL '30 days'
GROUP BY dia
ORDER BY dia DESC;

-- MRR (Monthly Recurring Revenue) - aproximado
SELECT 
  DATE_TRUNC('month', confirmed_at) as mes,
  COUNT(DISTINCT user_id) as usuarios_pagantes,
  SUM(net_value) as receita_mes
FROM payments
WHERE status IN ('RECEIVED', 'CONFIRMED')
  AND confirmed_at >= DATE_TRUNC('year', NOW())
GROUP BY mes
ORDER BY mes DESC;

-- =====================================================
-- ÍNDICES RECOMENDADOS (se ainda não existem)
-- =====================================================

-- Melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_payments_status_confirmed ON payments(status) 
  WHERE status IN ('RECEIVED', 'CONFIRMED');

CREATE INDEX IF NOT EXISTS idx_payments_created_at_desc ON payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_users_plan_status_active ON users(plan_status) 
  WHERE plan_status = 'active';

-- =====================================================
-- VIEWS ÚTEIS (opcional)
-- =====================================================

-- View com informações completas de pagamentos
CREATE OR REPLACE VIEW vw_payments_full AS
SELECT 
  p.id,
  p.asaas_payment_id,
  p.status,
  p.payment_method,
  p.value,
  p.net_value,
  p.created_at,
  p.paid_at,
  p.confirmed_at,
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  pl.id as plan_id,
  pl.name as plan_name,
  pl.price as plan_price,
  p.invoice_url,
  CASE 
    WHEN p.status = 'PENDING' AND p.due_date < NOW() THEN 'OVERDUE'
    ELSE p.status
  END as status_atual
FROM payments p
JOIN users u ON p.user_id = u.id
JOIN plans pl ON p.plan_id = pl.id;

-- View de usuários ativos com detalhes do plano
CREATE OR REPLACE VIEW vw_active_subscriptions AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  pl.name as plan_name,
  pl.price as plan_price,
  u.plan_activated_at,
  DATE_PART('day', NOW() - u.plan_activated_at) as dias_ativo,
  (
    SELECT COUNT(*) 
    FROM payments p 
    WHERE p.user_id = u.id 
      AND p.status IN ('RECEIVED', 'CONFIRMED')
  ) as total_pagamentos
FROM users u
JOIN plans pl ON u.plan_id = pl.id
WHERE u.plan_status = 'active';

-- =====================================================
-- FIM
-- =====================================================
