/**
 * Subscription Service - Assinaturas Recorrentes
 * Gerencia pagamentos trimestral e anual com cartão de crédito via Asaas
 * 
 * @module services/subscriptionService
 */

import axios from 'axios';
import { asaasConfig } from '../config/asaas.js';
import { supabaseAdmin } from '../config/supabase.js';
import { PLAN_IDS } from '../utils/planFeatures.js';
import { nowBR } from '../utils/response.js';

/**
 * Service de Assinaturas Recorrentes
 * Implementa pagamentos trimestral (QUARTERLY) e anual (YEARLY)
 */
export const subscriptionService = {

  /**
   * Ciclos de assinatura disponíveis no Asaas
   * @enum {string}
   */
  CYCLES: {
    MONTHLY: 'MONTHLY',           // Mensal (a cada 30 dias)
    QUARTERLY: 'QUARTERLY',       // Trimestral (a cada 3 meses)
    SEMIANNUALLY: 'SEMIANNUALLY', // Semestral (a cada 6 meses)
    YEARLY: 'YEARLY'              // Anual (a cada 12 meses)
  },

  /**
   * Status de assinatura possíveis
   * @enum {string}
   */
  STATUS: {
    ACTIVE: 'ACTIVE',         // Assinatura ativa
    EXPIRED: 'EXPIRED',       // Assinatura expirada
    CANCELLED: 'CANCELLED',   // Assinatura cancelada pelo usuário
    SUSPENDED: 'SUSPENDED'    // Assinatura suspensa (falha de pagamento)
  },

  /**
   * Descontos por ciclo de pagamento
   * @enum {number}
   */
  DISCOUNTS: {
    MONTHLY: 0,        // 0% desconto
    QUARTERLY: 0.10,   // 10% desconto (economiza 1 mês a cada ano)
    SEMIANNUALLY: 0.15, // 15% desconto
    YEARLY: 0.17       // 17% desconto (economiza 2 meses a cada ano)
  },

  /**
   * Criar assinatura recorrente (trimestral ou anual)
   * 
   * @param {string} userId - UUID do usuário
   * @param {string} planId - UUID do plano
   * @param {string} cycle - Ciclo de cobrança (QUARTERLY ou YEARLY)
   * @param {object} creditCardData - Dados do cartão de crédito
   * @param {string} creditCardData.holderName - Nome impresso no cartão
   * @param {string} creditCardData.number - Número do cartão (16 dígitos)
   * @param {string} creditCardData.expiryMonth - Mês de validade (MM)
   * @param {string} creditCardData.expiryYear - Ano de validade (YYYY)
   * @param {string} creditCardData.cvv - Código de segurança (CVV)
   * @returns {Promise<object>} Dados da assinatura criada
   * @throws {Error} Se houver erro na criação
   */
  async createSubscription(userId, planId, cycle, creditCardData, remoteIp) {
    try {
      console.log(`📝 Criando assinatura ${cycle} para usuário ${userId}`);

      // 1. Validar ciclo
      if (!Object.values(this.CYCLES).includes(cycle)) {
        throw new Error(`Ciclo inválido: ${cycle}. Use MONTHLY, QUARTERLY ou YEARLY`);
      }

      // 2. Buscar plano no banco
      const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        console.error('❌ Plano não encontrado:', planError);
        throw new Error('Plano não encontrado ou inativo');
      }

      console.log(`✅ Plano encontrado: ${plan.name} - R$ ${plan.price}/mês`);

      // 3. Calcular valor baseado no ciclo
      const value = this._calculatePrice(plan, cycle);
      console.log(`💰 Valor calculado para ${cycle}: R$ ${value}`);

      // 4. Buscar usuário
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('❌ Usuário não encontrado:', userError);
        throw new Error('Usuário não encontrado');
      }

      console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);

      // 5. Buscar endereço do usuário
      const { data: address, error: addressError } = await supabaseAdmin
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (addressError) {
        console.warn(`⚠️  Erro ao buscar user_addresses (tabela pode não existir ainda): ${addressError.message}`);
      }

      console.log(`📍 Endereço encontrado:`, address ? `CEP ${address.postal_code}` : 'nenhum');

      // CEP: prioriza user_addresses, fallback para campo legado users.postal_code
      const postalCode = address?.postal_code || user.postal_code;

      // 5a. Validar campos obrigatórios do cadastro para pagamento com cartão
      const missingFields = [];
      if (!user.cpf) missingFields.push('CPF');
      if (!postalCode) missingFields.push('CEP');

      if (missingFields.length > 0) {
        console.warn(`⚠️  Cadastro incompleto para usuário ${userId}: ${missingFields.join(', ')}`);
        const err = new Error(
          'Cadastro incompleto. Por favor, preencha seu CPF e CEP antes de assinar.'
        );
        err.status = 422;
        err.data = { missingFields, action: 'complete_profile' };
        throw err;
      }

      // 6. Obter/Criar customer Asaas (reusar do paymentService)
      const { paymentService } = await import('./paymentService.js');
      const customerId = await paymentService.getOrCreateAsaasCustomer(user);

      console.log(`✅ Customer Asaas: ${customerId}`);

      // 7. Calcular próxima data de vencimento (3 dias úteis)
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 3);
      const formattedDueDate = nextDueDate.toISOString().split('T')[0];

      // 7. Preparar payload da assinatura
      const subscriptionPayload = {
        customer: customerId,
        billingType: 'CREDIT_CARD',
        cycle: cycle,
        value: value,
        nextDueDate: formattedDueDate,
        description: `Assinatura ${plan.name} - ${this._getCycleLabel(cycle)}`,
        externalReference: userId, // Para facilitar busca reversa

        // Dados do cartão
        creditCard: {
          holderName: String(creditCardData.holderName).trim(),
          number: String(creditCardData.number).replace(/[\s-]/g, ''),
          expiryMonth: String(creditCardData.expiryMonth).padStart(2, '0'),
          expiryYear: (() => {
            let y = parseInt(creditCardData.expiryYear, 10);
            if (y < 100) y += 2000;
            return String(y);
          })(),
          ccv: String(creditCardData.cvv)
        },

        // Informações do titular do cartão
        creditCardHolderInfo: {
          name: String(creditCardData.holderName).trim(),
          email: user.email,
          cpfCnpj: user.cpf.replace(/\D/g, ''),
          postalCode: postalCode.replace(/\D/g, ''),
          addressNumber: address?.number || user.address_number || 'S/N',
          // Asaas aceita phone com DDD (10-11 dígitos) ou sem (8-9 dígitos)
          // Enviar apenas mobilePhone para evitar conflito
          mobilePhone: user.phone?.replace(/\D/g, '') || undefined,
          // IP do usuário final — obrigatório pelo Asaas para antifraude
          remoteIp: remoteIp || '127.0.0.1'
        }
      };

      console.log(`💳 Criando assinatura no Asaas (${cycle}) - R$ ${value}`);
      console.log(`💳 [DEBUG] creditCard enviado:`, {
        holderName: subscriptionPayload.creditCard.holderName,
        number: subscriptionPayload.creditCard.number.replace(/.(?=.{4})/g, '*'), // mascara tudo exceto últimos 4
        expiryMonth: subscriptionPayload.creditCard.expiryMonth,
        expiryYear: subscriptionPayload.creditCard.expiryYear,
        ccv: '***'
      });
      console.log(`💳 [DEBUG] creditCardHolderInfo enviado:`, {
        ...subscriptionPayload.creditCardHolderInfo,
        cpfCnpj: subscriptionPayload.creditCardHolderInfo.cpfCnpj?.replace(/.(?=.{3})/g, '*')
      });

      // 8. Criar assinatura no Asaas
      const asaasResponse = await axios.post(
        `${asaasConfig.apiUrl}/subscriptions`,
        subscriptionPayload,
        { headers: asaasConfig.headers }
      );

      const subscription = asaasResponse.data;

      console.log(`✅ Assinatura criada no Asaas: ${subscription.id}`);
      console.log(`📅 Próxima cobrança: ${subscription.nextDueDate}`);
      console.log(`📊 Status: ${subscription.status}`);

      // 9. Salvar no banco local
      const { data: savedSubscription, error: saveError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          asaas_subscription_id: subscription.id,
          asaas_customer_id: customerId,
          cycle: cycle,
          value: value,
          status: subscription.status,
          next_due_date: subscription.nextDueDate,
          card_brand: subscription.creditCard?.creditCardBrand,
          card_last4: subscription.creditCard?.creditCardNumber?.slice(-4)
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ Erro ao salvar assinatura:', saveError);
        // Tentar cancelar assinatura no Asaas
        try {
          await axios.delete(
            `${asaasConfig.apiUrl}/subscriptions/${subscription.id}`,
            { headers: asaasConfig.headers }
          );
          console.log('⚠️  Assinatura cancelada no Asaas devido a erro local');
        } catch (cancelError) {
          console.error('❌ Erro ao cancelar assinatura no Asaas:', cancelError);
        }
        throw new Error('Erro ao salvar assinatura no banco de dados');
      }

      console.log(`✅ Assinatura salva no banco: ${savedSubscription.id}`);

      // 10. Ativar plano do usuário
      const { error: updateUserError } = await supabaseAdmin
        .from('users')
        .update({
          plan_id: planId,
          plan_status: 'active',
          plan_activated_at: nowBR(),
          subscription_id: savedSubscription.id,
          subscription_cycle: cycle,
          subscription_status: 'active'
        })
        .eq('id', userId);

      if (updateUserError) {
        console.error('❌ Erro ao ativar plano do usuário:', updateUserError);
        throw new Error('Erro ao ativar plano do usuário');
      }

      console.log(`✅ Plano ${plan.name} ativado para usuário ${user.name}`);

      // 11. Retornar dados da assinatura
      return {
        subscription: {
          id: subscription.id,
          localId: savedSubscription.id,
          status: subscription.status,
          cycle: cycle,
          cycleLabel: this._getCycleLabel(cycle),
          value: value,
          nextDueDate: subscription.nextDueDate,
          creditCard: {
            brand: subscription.creditCard?.creditCardBrand,
            last4: subscription.creditCard?.creditCardNumber?.slice(-4)
          },
          savings: this._calculateSavings(plan, cycle)
        },
        plan: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          monthlyPrice: parseFloat(plan.price)
        },
        message: `Assinatura ${this._getCycleLabel(cycle)} criada com sucesso!`
      };

    } catch (error) {
      // Log completo da resposta do Asaas para diagnóstico
      if (error.response) {
        console.error('❌ Erro Asaas — status HTTP:', error.response.status);
        console.error('❌ Erro Asaas — body completo:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('❌ Erro ao criar assinatura:', error.message);
      }

      const errorMessage = error.response?.data?.errors?.[0]?.description ||
        error.message ||
        'Erro ao criar assinatura';

      throw new Error(errorMessage);
    }
  },

  /**
   * Cancelar assinatura
   * Mantém acesso até a próxima data de renovação
   * 
   * @param {string} userId - UUID do usuário
   * @param {string} subscriptionId - UUID da assinatura local
   * @returns {Promise<object>} Resultado do cancelamento
   */
  async cancelSubscription(userId, subscriptionId) {
    try {
      console.log(`🗑️  Cancelando assinatura ${subscriptionId}`);

      // 1. Buscar assinatura
      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !subscription) {
        console.error('❌ Assinatura não encontrada:', fetchError);
        throw new Error('Assinatura não encontrada');
      }

      if (subscription.status !== 'ACTIVE') {
        throw new Error('Apenas assinaturas ativas podem ser canceladas');
      }

      console.log(`📋 Assinatura encontrada: ${subscription.asaas_subscription_id}`);

      // 2. Cancelar no Asaas
      await axios.delete(
        `${asaasConfig.apiUrl}/subscriptions/${subscription.asaas_subscription_id}`,
        { headers: asaasConfig.headers }
      );

      console.log(`✅ Assinatura cancelada no Asaas`);

      // 3. Atualizar no banco
      const now = nowBR();

      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'CANCELLED',
          cancelled_at: now
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('❌ Erro ao atualizar assinatura:', updateError);
        throw new Error('Erro ao atualizar status da assinatura');
      }

      // 4. Atualizar usuário (manter plano ativo até próxima renovação)
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({
          subscription_status: 'cancelled'
        })
        .eq('id', userId);

      if (userUpdateError) {
        console.error('❌ Erro ao atualizar usuário:', userUpdateError);
      }

      console.log(`✅ Assinatura cancelada: ${subscriptionId}`);
      console.log(`ℹ️  Acesso mantido até: ${subscription.next_due_date}`);

      return {
        success: true,
        message: 'Assinatura cancelada com sucesso',
        subscription: {
          id: subscription.id,
          status: 'CANCELLED',
          cancelledAt: now,
          accessUntil: subscription.next_due_date // Mantém acesso até próxima renovação
        }
      };

    } catch (error) {
      console.error('❌ Erro ao cancelar assinatura:', error.response?.data || error.message);

      const errorMessage = error.response?.data?.errors?.[0]?.description ||
        error.message ||
        'Erro ao cancelar assinatura';

      throw new Error(errorMessage);
    }
  },

  /**
   * Buscar assinatura ativa do usuário
   * 
   * @param {string} userId - UUID do usuário
   * @returns {Promise<object|null>} Dados da assinatura ou null
   */
  async getActiveSubscription(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          plans (
            id,
            name,
            description,
            price,
            features
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('❌ Erro ao buscar assinatura:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      // Enriquecer dados
      return {
        ...data,
        cycleLabel: this._getCycleLabel(data.cycle),
        daysUntilRenewal: this._calculateDaysUntilRenewal(data.next_due_date)
      };

    } catch (error) {
      console.error('❌ Erro ao buscar assinatura:', error);
      return null;
    }
  },

  /**
   * Atualizar cartão da assinatura
   * 
   * @param {string} userId - UUID do usuário
   * @param {string} subscriptionId - UUID da assinatura local
   * @param {object} newCardData - Novos dados do cartão
   * @returns {Promise<object>} Resultado da atualização
   */
  async updateSubscriptionCard(userId, subscriptionId, newCardData) {
    try {
      console.log(`💳 Atualizando cartão da assinatura ${subscriptionId}`);

      // 1. Buscar assinatura
      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !subscription) {
        console.error('❌ Assinatura não encontrada:', fetchError);
        throw new Error('Assinatura não encontrada');
      }

      // 2. Buscar dados do usuário
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // 3. Atualizar no Asaas
      const updatePayload = {
        creditCard: {
          holderName: newCardData.holderName.trim(),
          number: newCardData.number.replace(/\s/g, ''),
          expiryMonth: newCardData.expiryMonth.padStart(2, '0'),
          expiryYear: newCardData.expiryYear,
          ccv: newCardData.cvv
        },
        creditCardHolderInfo: {
          name: user.name,
          email: user.email,
          cpfCnpj: user.cpf?.replace(/\D/g, '') || '12345678909',
          postalCode: user.postal_code?.replace(/\D/g, '') || '88000000',
          addressNumber: user.address_number || 'S/N',
          phone: user.phone?.replace(/\D/g, '') || '48999999999'
        }
      };

      const asaasResponse = await axios.put(
        `${asaasConfig.apiUrl}/subscriptions/${subscription.asaas_subscription_id}`,
        updatePayload,
        { headers: asaasConfig.headers }
      );

      console.log(`✅ Cartão atualizado no Asaas`);

      // 4. Atualizar dados do cartão no banco
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          card_brand: asaasResponse.data.creditCard?.creditCardBrand,
          card_last4: asaasResponse.data.creditCard?.creditCardNumber?.slice(-4)
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('❌ Erro ao atualizar cartão no banco:', updateError);
      }

      console.log(`✅ Cartão atualizado com sucesso`);

      return {
        success: true,
        message: 'Cartão atualizado com sucesso',
        card: {
          brand: asaasResponse.data.creditCard?.creditCardBrand,
          last4: asaasResponse.data.creditCard?.creditCardNumber?.slice(-4)
        }
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar cartão:', error.response?.data || error.message);

      const errorMessage = error.response?.data?.errors?.[0]?.description ||
        error.message ||
        'Erro ao atualizar cartão';

      throw new Error(errorMessage);
    }
  },

  /**
   * Processar webhook de eventos de assinatura
   * 
   * @param {string} event - Tipo de evento
   * @param {object} subscriptionData - Dados da assinatura do webhook
   * @returns {Promise<boolean>} true se processado com sucesso
   */
  async handleSubscriptionWebhook(event, subscriptionData) {
    try {
      console.log(`🔔 Webhook assinatura: ${event} - ${subscriptionData.id}`);

      const userId = subscriptionData.externalReference;

      switch (event) {
        case 'SUBSCRIPTION_CREATED':
          // Nova assinatura criada
          console.log(`✅ Assinatura criada: ${subscriptionData.id}`);
          break;

        case 'SUBSCRIPTION_UPDATED':
          // Assinatura atualizada (pode incluir renovação/pagamento)
          await this._handleSubscriptionUpdated(subscriptionData, userId);
          break;

        case 'SUBSCRIPTION_INACTIVATED':
          // Assinatura inativada (equivale a cancelamento)
          await this._handleSubscriptionInactivated(subscriptionData, userId);
          break;

        case 'SUBSCRIPTION_DELETED':
          // Assinatura deletada
          await this._handleSubscriptionDeleted(subscriptionData, userId);
          break;

        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          // Pagamento de assinatura confirmado
          await this._handleSubscriptionPayment(subscriptionData, userId);
          break;

        default:
          console.log(`ℹ️  Evento de assinatura não tratado: ${event}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao processar webhook de assinatura:', error);
      return false;
    }
  },

  // ============================================================================
  // Métodos Privados (Helpers)
  // ============================================================================

  /**
   * Calcular preço baseado no ciclo com desconto
   * @private
   */
  _calculatePrice(plan, cycle) {
    const monthlyPrice = parseFloat(plan.price);

    switch (cycle) {
      case this.CYCLES.MONTHLY:
        return monthlyPrice;

      case this.CYCLES.QUARTERLY:
        // Trimestral: 10% desconto (3 meses pagando 2.7)
        return Math.round(monthlyPrice * 3 * (1 - this.DISCOUNTS.QUARTERLY) * 100) / 100;

      case this.CYCLES.SEMIANNUALLY:
        // Semestral: 15% desconto
        return Math.round(monthlyPrice * 6 * (1 - this.DISCOUNTS.SEMIANNUALLY) * 100) / 100;

      case this.CYCLES.YEARLY:
        // Anual: 17% desconto (12 meses pagando 10)
        return Math.round(monthlyPrice * 12 * (1 - this.DISCOUNTS.YEARLY) * 100) / 100;

      default:
        return monthlyPrice;
    }
  },

  /**
   * Calcular economia em relação ao plano mensal
   * @private
   */
  _calculateSavings(plan, cycle) {
    const monthlyPrice = parseFloat(plan.price);
    const totalMonthly = cycle === 'QUARTERLY' ? monthlyPrice * 3 : monthlyPrice * 12;
    const totalWithDiscount = this._calculatePrice(plan, cycle);
    const savings = totalMonthly - totalWithDiscount;
    const percentage = Math.round((savings / totalMonthly) * 100);

    return {
      amount: savings,
      percentage: percentage,
      message: `Economize R$ ${savings.toFixed(2)} (${percentage}%)`
    };
  },

  /**
   * Obter label legível do ciclo
   * @private
   */
  _getCycleLabel(cycle) {
    const labels = {
      MONTHLY: 'Mensal',
      QUARTERLY: 'Trimestral',
      SEMIANNUALLY: 'Semestral',
      YEARLY: 'Anual'
    };
    return labels[cycle] || cycle;
  },

  /**
   * Calcular dias até renovação
   * @private
   */
  _calculateDaysUntilRenewal(nextDueDate) {
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  /**
   * Tratar atualização de assinatura (webhook SUBSCRIPTION_UPDATED)
   * Pode incluir renovação automática ou alterações
   * @private
   */
  async _handleSubscriptionUpdated(subscriptionData, userId) {
    console.log(`🔄 Assinatura atualizada para usuário ${userId}`);

    // Atualizar dados da assinatura
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: subscriptionData.status || 'ACTIVE',
        next_due_date: subscriptionData.nextDueDate,
        last_payment_date: nowBR(),
        value: subscriptionData.value
      })
      .eq('asaas_subscription_id', subscriptionData.id);

    // Garantir que plano continua ativo se status é ACTIVE
    if (subscriptionData.status === 'ACTIVE') {
      await supabaseAdmin
        .from('users')
        .update({
          plan_status: 'active',
          subscription_status: 'active'
        })
        .eq('id', userId);
    }
  },

  /**
   * Tratar pagamento de assinatura (webhook PAYMENT_RECEIVED/CONFIRMED)
   * @private
   */
  async _handleSubscriptionPayment(subscriptionData, userId) {
    console.log(`💳 Pagamento de assinatura recebido para usuário ${userId}`);

    // Atualizar próxima data de cobrança
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'ACTIVE',
        last_payment_date: nowBR()
      })
      .eq('asaas_subscription_id', subscriptionData.subscription || subscriptionData.id);

    // Garantir que plano está ativo
    await supabaseAdmin
      .from('users')
      .update({
        plan_status: 'active',
        subscription_status: 'active'
      })
      .eq('id', userId);
  },

  /**
   * Tratar inativação de assinatura (webhook SUBSCRIPTION_INACTIVATED)
   * @private
   */
  async _handleSubscriptionInactivated(subscriptionData, userId) {
    console.log(`⏸️  Assinatura inativada para usuário ${userId}`);

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancelled_at: nowBR()
      })
      .eq('asaas_subscription_id', subscriptionData.id);

    // Usuário mantém acesso até next_due_date, não desativar imediatamente
    console.log(`ℹ️  Usuário mantém acesso até a próxima data de cobrança`);
  },

  /**
   * Tratar deleção de assinatura (webhook SUBSCRIPTION_DELETED)
   * @private
   */
  async _handleSubscriptionDeleted(subscriptionData, userId) {
    console.log(`🗑️  Assinatura deletada para usuário ${userId}`);

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancelled_at: nowBR()
      })
      .eq('asaas_subscription_id', subscriptionData.id);

    // Desativar plano e voltar para Free
    await supabaseAdmin
      .from('users')
      .update({
        plan_id: PLAN_IDS.FREE,
        plan_status: 'inactive',
        subscription_status: 'inactive'
      })
      .eq('id', userId);
  },

  /**
   * Tratar renovação de assinatura (legacy - manter por compatibilidade)
   * @private
   */
  async _handleSubscriptionRenewal(subscriptionData, userId) {
    console.log(`✅ Renovando assinatura para usuário ${userId}`);

    // Atualizar próxima data de cobrança
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'ACTIVE',
        next_due_date: subscriptionData.nextDueDate,
        last_payment_date: nowBR()
      })
      .eq('asaas_subscription_id', subscriptionData.subscription);

    // Garantir que plano continua ativo
    await supabaseAdmin
      .from('users')
      .update({
        plan_status: 'active',
        subscription_status: 'active'
      })
      .eq('id', userId);
  },

  /**
   * Tratar expiração de assinatura (legacy - manter por compatibilidade)
   * @private
   */
  async _handleSubscriptionExpired(subscriptionData, userId) {
    console.log(`⏰ Assinatura expirada para usuário ${userId}`);

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'EXPIRED',
        expires_at: nowBR()
      })
      .eq('asaas_subscription_id', subscriptionData.id);

    // Desativar plano e voltar para Free
    await supabaseAdmin
      .from('users')
      .update({
        plan_id: PLAN_IDS.FREE,
        plan_status: 'expired',
        subscription_status: 'expired'
      })
      .eq('id', userId);
  },

  /**
   * Tratar cancelamento de assinatura (legacy - manter por compatibilidade)
   * @private
   */
  async _handleSubscriptionCancelled(subscriptionData, userId) {
    console.log(`🗑️  Assinatura cancelada para usuário ${userId}`);

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancelled_at: nowBR()
      })
      .eq('asaas_subscription_id', subscriptionData.id);

    await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'cancelled'
      })
      .eq('id', userId);
  }
};
