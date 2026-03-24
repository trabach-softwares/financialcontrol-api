/**
 * Job: Expiração de Planos
 *
 * Roda a cada hora e:
 *  1. Planos que expiram em até 3 dias → plan_status = 'expiring_soon'
 *  2. Planos já expirados             → plan_status = 'expired', volta para plano Free
 *
 * O frontend lê plan_status e plan_expires_at no perfil do usuário e exibe
 * o aviso / bloqueio adequado solicitando novo pagamento.
 */

import { supabaseAdmin } from '../config/supabase.js';
import { PLAN_IDS } from '../utils/planFeatures.js';

const INTERVAL_MS = 60 * 60 * 1000;   // 1 hora
const WARNING_HOURS = 24;             // Avisar 24h antes de expirar

async function runExpirationCheck() {
    try {
        const now = new Date();
        const warningDate = new Date(now.getTime() + WARNING_HOURS * 60 * 60 * 1000);

        console.log(`🕐 [PlanJob] Verificando planos expirados em ${now.toISOString()}`);

        // ─── 1. Expirar planos vencidos ───────────────────────────────────────────
        const { data: expired, error: expiredError } = await supabaseAdmin
            .from('users')
            .select('id, email, plan_expires_at')
            .in('plan_status', ['active', 'expiring_soon'])
            .not('plan_expires_at', 'is', null)
            .lt('plan_expires_at', now.toISOString());

        if (expiredError) {
            console.error('❌ [PlanJob] Erro ao buscar planos vencidos:', expiredError.message);
        } else if (expired && expired.length > 0) {
            console.log(`⏰ [PlanJob] ${expired.length} plano(s) expirado(s) — voltando para Free`);

            for (const user of expired) {
                const { error } = await supabaseAdmin
                    .from('users')
                    .update({
                        plan_id: PLAN_IDS.FREE,
                        plan_status: 'expired',
                        plan_expires_at: null
                    })
                    .eq('id', user.id);

                if (error) {
                    console.error(`❌ [PlanJob] Falha ao expirar usuário ${user.id}:`, error.message);
                } else {
                    console.log(`✅ [PlanJob] Plano expirado: ${user.email} (era até ${user.plan_expires_at})`);
                }
            }
        }

        // ─── 2. Marcar planos prestes a expirar ──────────────────────────────────
        const { data: expiringSoon, error: soonError } = await supabaseAdmin
            .from('users')
            .select('id, email, plan_expires_at')
            .eq('plan_status', 'active')
            .not('plan_expires_at', 'is', null)
            .lt('plan_expires_at', warningDate.toISOString())
            .gte('plan_expires_at', now.toISOString());

        if (soonError) {
            console.error('❌ [PlanJob] Erro ao buscar planos a vencer:', soonError.message);
        } else if (expiringSoon && expiringSoon.length > 0) {
            console.log(`⚠️  [PlanJob] ${expiringSoon.length} plano(s) expirando nas próximas ${WARNING_HOURS}h`);

            for (const user of expiringSoon) {
                const { error } = await supabaseAdmin
                    .from('users')
                    .update({ plan_status: 'expiring_soon' })
                    .eq('id', user.id);

                if (error) {
                    console.error(`❌ [PlanJob] Falha ao marcar expirando: ${user.id}:`, error.message);
                } else {
                    console.log(`⚠️  [PlanJob] Expirando em breve: ${user.email} (até ${user.plan_expires_at})`);
                }
            }
        }

        if ((!expired || expired.length === 0) && (!expiringSoon || expiringSoon.length === 0)) {
            console.log('✅ [PlanJob] Nenhum plano expirado ou a vencer encontrado');
        }

    } catch (err) {
        console.error('❌ [PlanJob] Erro inesperado:', err.message);
    }
}

export function startPlanExpirationJob() {
    console.log(`🚀 [PlanJob] Iniciado — verificação a cada ${INTERVAL_MS / 60000} minutos`);

    // Rodar imediatamente ao iniciar
    runExpirationCheck();

    // Agendar execuções periódicas
    setInterval(runExpirationCheck, INTERVAL_MS);
}
