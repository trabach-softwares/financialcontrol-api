-- =====================================================
-- Script para Deletar Views (se já existirem)
-- =====================================================

-- Deletar as views criadas no admin_queries.sql
DROP VIEW IF EXISTS vw_payments_full CASCADE;
DROP VIEW IF EXISTS vw_active_subscriptions CASCADE;

-- Confirmar
SELECT 'Views deletadas com sucesso!' as status;
