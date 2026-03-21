-- ============================================================================
-- Migration 010: Planos com variantes por ciclo de cobrança
-- Descrição: Adiciona billing_cycle e parent_plan_id à tabela plans e
--            insere as variantes Pro (Mensal, Trimestral, Anual)
-- Data: 20 de Março de 2026
-- ============================================================================

-- Adicionar colunas de ciclo e vínculo com plano pai
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS parent_plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

COMMENT ON COLUMN plans.billing_cycle   IS 'Ciclo de cobrança: MONTHLY | QUARTERLY | YEARLY';
COMMENT ON COLUMN plans.parent_plan_id  IS 'Referência ao plano pai (ex: Pro Mensal → Pro base)';
COMMENT ON COLUMN plans.display_order   IS 'Ordem de exibição na tela de planos';

-- ============================================================================
-- Inserir planos Pro (variantes mensais, trimestrais e anuais)
-- UUIDs fixos para referenciar no código
-- ============================================================================

-- Pro Mensal — preço cheio
INSERT INTO plans (id, name, description, price, billing_cycle, display_order, max_transactions, is_active, features)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Pro',
  'Plano Pro Mensal — acesso completo às funcionalidades premium',
  29.90,
  'MONTHLY',
  1,
  NULL, -- ilimitado
  true,
  '{
    "advancedDashboard": true,
    "advancedCharts": true,
    "pdfExport": true,
    "excelExport": true,
    "financialGoals": true,
    "prioritySupport": true
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  description    = EXCLUDED.description,
  price          = EXCLUDED.price,
  billing_cycle  = EXCLUDED.billing_cycle,
  display_order  = EXCLUDED.display_order,
  is_active      = EXCLUDED.is_active;

-- Pro Trimestral — 10% desconto (3 × 29.90 × 0.90 = 80.73)
INSERT INTO plans (id, name, description, price, billing_cycle, parent_plan_id, display_order, max_transactions, is_active, features)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000002',
  'Pro',
  'Plano Pro Trimestral — 10% de desconto em relação ao mensal',
  80.73,
  'QUARTERLY',
  'a1b2c3d4-0001-4000-8000-000000000001',
  2,
  NULL,
  true,
  '{
    "advancedDashboard": true,
    "advancedCharts": true,
    "pdfExport": true,
    "excelExport": true,
    "financialGoals": true,
    "prioritySupport": true
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  description    = EXCLUDED.description,
  price          = EXCLUDED.price,
  billing_cycle  = EXCLUDED.billing_cycle,
  parent_plan_id = EXCLUDED.parent_plan_id,
  display_order  = EXCLUDED.display_order,
  is_active      = EXCLUDED.is_active;

-- Pro Anual — 17% desconto (12 × 29.90 × 0.83 = 297.48)
INSERT INTO plans (id, name, description, price, billing_cycle, parent_plan_id, display_order, max_transactions, is_active, features)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000003',
  'Pro',
  'Plano Pro Anual — 17% de desconto, melhor custo-benefício',
  297.48,
  'YEARLY',
  'a1b2c3d4-0001-4000-8000-000000000001',
  3,
  NULL,
  true,
  '{
    "advancedDashboard": true,
    "advancedCharts": true,
    "pdfExport": true,
    "excelExport": true,
    "financialGoals": true,
    "prioritySupport": true
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  description    = EXCLUDED.description,
  price          = EXCLUDED.price,
  billing_cycle  = EXCLUDED.billing_cycle,
  parent_plan_id = EXCLUDED.parent_plan_id,
  display_order  = EXCLUDED.display_order,
  is_active      = EXCLUDED.is_active;
