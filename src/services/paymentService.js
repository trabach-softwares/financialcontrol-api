/**
 * Serviço de Pagamentos - Integração com Asaas
 * Métodos: PIX, Boleto Bancário, Cartão de Crédito
 */

import axios from 'axios';
import crypto from 'crypto';
import { asaasConfig } from '../config/asaas.js';
import { supabaseAdmin as supabase } from '../config/supabase.js';

class PaymentService {
  /**
   * Obter ou criar cliente no Asaas
   */
  async getOrCreateAsaasCustomer(user) {
    try {
      // Verificar se já existe
      if (user.asaas_customer_id) {
        return user.asaas_customer_id;
      }

      console.log(`📝 Criando cliente Asaas para usuário: ${user.email}`);

      // Criar novo cliente no Asaas
      const response = await axios.post(
        `${asaasConfig.apiUrl}/customers`,
        {
          name: user.name,
          email: user.email,
          cpfCnpj: user.cpf?.replace(/\D/g, ''), // Remover pontos/traços
          phone: user.phone?.replace(/\D/g, ''),
          mobilePhone: user.phone?.replace(/\D/g, ''),
          postalCode: user.postal_code?.replace(/\D/g, ''),
          address: user.address,
          addressNumber: user.address_number,
          complement: user.complement,
          province: user.province, // Bairro
          notificationDisabled: false,
          externalReference: user.id // Para facilitar busca reversa
        },
        { headers: asaasConfig.headers }
      );

      const customerId = response.data.id;

      // Salvar no banco
      const { error } = await supabase
        .from('users')
        .update({ asaas_customer_id: customerId })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Erro ao salvar asaas_customer_id:', error);
        throw new Error('Erro ao vincular cliente ao Asaas');
      }

      console.log(`✅ Cliente Asaas criado: ${customerId}`);
      return customerId;

    } catch (error) {
      console.error('❌ Erro ao criar cliente Asaas:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.errors?.[0]?.description || 
        'Erro ao criar cliente no gateway de pagamento'
      );
    }
  }

  /**
   * Criar pagamento (PIX, Boleto ou Cartão)
   */
  async createPayment(userId, planId, paymentMethod, creditCardData = null) {
    try {
      // 1. Buscar plano
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        throw new Error('Plano não encontrado ou inativo');
      }

      // 2. Buscar usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('Usuário não encontrado');
      }

      // 3. Obter/Criar cliente Asaas
      const customerId = await this.getOrCreateAsaasCustomer(user);

      // 4. Preparar payload da cobrança
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + asaasConfig.payment.defaultDueDays);

      const paymentPayload = {
        customer: customerId,
        billingType: paymentMethod,
        value: parseFloat(plan.price),
        dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
        description: `Assinatura ${plan.name} - ${plan.description}`,
        externalReference: userId, // IMPORTANTE: Para identificar no webhook
        postalService: false
      };

      // Se cartão de crédito, adicionar dados
      if (paymentMethod === 'CREDIT_CARD' && creditCardData) {
        const [expiryMonth, expiryYear] = creditCardData.expiryDate.split('/');
        
        paymentPayload.creditCard = {
          holderName: creditCardData.holderName,
          number: creditCardData.number.replace(/\s/g, ''),
          expiryMonth: expiryMonth.trim(),
          expiryYear: expiryYear.trim(),
          ccv: creditCardData.cvv
        };

        paymentPayload.creditCardHolderInfo = {
          name: user.name,
          email: user.email,
          cpfCnpj: user.cpf?.replace(/\D/g, ''),
          postalCode: user.postal_code?.replace(/\D/g, ''),
          addressNumber: user.address_number,
          phone: user.phone?.replace(/\D/g, '')
        };
      }

      console.log(`💳 Criando cobrança Asaas (${paymentMethod}) - R$ ${plan.price}`);

      // 5. Criar cobrança no Asaas
      const asaasResponse = await axios.post(
        `${asaasConfig.apiUrl}/payments`,
        paymentPayload,
        { headers: asaasConfig.headers }
      );

      const payment = asaasResponse.data;

      console.log(`✅ Cobrança criada no Asaas: ${payment.id}`);

      // 6. Salvar no banco local
      const { data: savedPayment, error: saveError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          plan_id: planId,
          asaas_payment_id: payment.id,
          asaas_customer_id: customerId,
          value: payment.value,
          payment_method: paymentMethod,
          status: payment.status,
          due_date: payment.dueDate,
          invoice_url: payment.invoiceUrl,
          transaction_receipt_url: payment.transactionReceiptUrl
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ Erro ao salvar pagamento no banco:', saveError);
        throw new Error('Erro ao salvar registro do pagamento');
      }

      // 7. Buscar dados específicos por método
      let methodData = null;

      if (paymentMethod === 'PIX') {
        methodData = await this.getPixQrCode(payment.id);
        
        // Atualizar com dados do PIX
        await supabase
          .from('payments')
          .update({
            pix_payload: methodData.payload,
            pix_qr_code_image: methodData.qrCodeImage,
            pix_expires_at: methodData.expiresAt
          })
          .eq('asaas_payment_id', payment.id);
      }

      if (paymentMethod === 'BOLETO') {
        methodData = {
          pdfUrl: payment.bankSlipUrl,
          barcode: payment.identificationField,
          bankSlipUrl: payment.bankSlipUrl
        };

        // Atualizar com dados do Boleto
        await supabase
          .from('payments')
          .update({
            boleto_barcode: methodData.barcode,
            boleto_pdf_url: methodData.pdfUrl,
            boleto_bank_slip_url: methodData.bankSlipUrl
          })
          .eq('asaas_payment_id', payment.id);
      }

      // 8. Montar resposta
      const response = {
        payment: {
          id: payment.id,
          status: payment.status,
          value: payment.value,
          dueDate: payment.dueDate,
          invoiceUrl: payment.invoiceUrl
        }
      };

      if (paymentMethod === 'PIX' && methodData) {
        response.pix = methodData;
      }

      if (paymentMethod === 'BOLETO' && methodData) {
        response.boleto = methodData;
      }

      if (paymentMethod === 'CREDIT_CARD' && payment.status === 'RECEIVED') {
        response.payment.confirmedDate = payment.confirmedDate;
        response.payment.transactionReceiptUrl = payment.transactionReceiptUrl;
      }

      return response;

    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.errors?.[0]?.description || 
        error.message ||
        'Erro ao processar pagamento'
      );
    }
  }

  /**
   * Buscar QR Code PIX do pagamento
   */
  async getPixQrCode(asaasPaymentId) {
    try {
      const response = await axios.get(
        `${asaasConfig.apiUrl}/payments/${asaasPaymentId}/pixQrCode`,
        { headers: asaasConfig.headers }
      );

      return {
        qrCodeImage: `data:image/png;base64,${response.data.encodedImage}`,
        payload: response.data.payload,
        expiresAt: response.data.expirationDate
      };
    } catch (error) {
      console.error('❌ Erro ao buscar QR Code PIX:', error.response?.data || error.message);
      throw new Error('Erro ao buscar dados do PIX');
    }
  }

  /**
   * Consultar status do pagamento
   */
  async getPaymentStatus(asaasPaymentId, userId) {
    try {
      // Buscar no banco local
      const { data: payment, error } = await supabase
        .from('payments')
        .select(`
          *,
          plans (
            id,
            name,
            description,
            price
          )
        `)
        .eq('asaas_payment_id', asaasPaymentId)
        .eq('user_id', userId)
        .single();

      if (error || !payment) {
        throw new Error('Pagamento não encontrado');
      }

      // Sincronizar com Asaas se ainda estiver pendente
      if (payment.status === 'PENDING') {
        const asaasResponse = await axios.get(
          `${asaasConfig.apiUrl}/payments/${asaasPaymentId}`,
          { headers: asaasConfig.headers }
        );

        const asaasPayment = asaasResponse.data;

        // Atualizar se o status mudou
        if (asaasPayment.status !== payment.status) {
          await supabase
            .from('payments')
            .update({
              status: asaasPayment.status,
              paid_at: asaasPayment.paymentDate,
              confirmed_at: asaasPayment.confirmedDate,
              net_value: asaasPayment.netValue
            })
            .eq('asaas_payment_id', asaasPaymentId);

          payment.status = asaasPayment.status;
          payment.paid_at = asaasPayment.paymentDate;
          payment.confirmed_at = asaasPayment.confirmedDate;
        }
      }

      return payment;

    } catch (error) {
      console.error('❌ Erro ao consultar pagamento:', error.response?.data || error.message);
      throw new Error(error.message || 'Erro ao consultar pagamento');
    }
  }

  /**
   * Listar pagamentos do usuário
   */
  async listPayments(userId, filters = {}) {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          plans (
            id,
            name,
            description,
            price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.limit) {
        query = query.limit(parseInt(filters.limit));
      }

      if (filters.offset) {
        query = query.range(
          parseInt(filters.offset), 
          parseInt(filters.offset) + parseInt(filters.limit || 20) - 1
        );
      }

      const { data: payments, error } = await query;

      if (error) {
        throw new Error('Erro ao buscar pagamentos');
      }

      // Formatar resposta
      return payments.map(p => ({
        id: p.asaas_payment_id,
        planName: p.plans?.name,
        planDescription: p.plans?.description,
        value: parseFloat(p.value),
        status: p.status,
        paymentMethod: p.payment_method,
        createdAt: p.created_at,
        paidAt: p.paid_at,
        dueDate: p.due_date,
        invoiceUrl: p.invoice_url
      }));

    } catch (error) {
      console.error('❌ Erro ao listar pagamentos:', error.message);
      throw new Error(error.message || 'Erro ao listar pagamentos');
    }
  }

  /**
   * Cancelar pagamento pendente
   */
  async cancelPayment(asaasPaymentId, userId) {
    try {
      // Verificar se o pagamento pertence ao usuário
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('asaas_payment_id', asaasPaymentId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !payment) {
        throw new Error('Pagamento não encontrado');
      }

      if (payment.status !== 'PENDING') {
        throw new Error('Apenas pagamentos pendentes podem ser cancelados');
      }

      // Cancelar no Asaas
      await axios.delete(
        `${asaasConfig.apiUrl}/payments/${asaasPaymentId}`,
        { headers: asaasConfig.headers }
      );

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('payments')
        .update({ status: 'CANCELLED' })
        .eq('asaas_payment_id', asaasPaymentId);

      if (updateError) {
        throw new Error('Erro ao atualizar status do pagamento');
      }

      console.log(`✅ Pagamento cancelado: ${asaasPaymentId}`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao cancelar pagamento:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.errors?.[0]?.description || 
        error.message ||
        'Erro ao cancelar pagamento'
      );
    }
  }

  /**
   * Validar assinatura do webhook
   */
  validateWebhookSignature(payload, signature) {
    if (!asaasConfig.webhookSecret) {
      console.warn('⚠️  ASAAS_WEBHOOK_SECRET não configurada - validação ignorada');
      return true;
    }

    const hash = crypto
      .createHmac('sha256', asaasConfig.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Processar webhook do Asaas
   */
  async processWebhook(event, paymentData) {
    try {
      console.log(`🔔 Processando webhook: ${event} - Payment: ${paymentData.id}`);

      const userId = paymentData.externalReference;

      if (!userId) {
        console.error('❌ externalReference não encontrado no webhook');
        return false;
      }

      switch (event) {
        case asaasConfig.webhookEvents.PAYMENT_RECEIVED:
        case asaasConfig.webhookEvents.PAYMENT_CONFIRMED:
          // Pagamento confirmado!
          await this.handlePaymentConfirmed(paymentData, userId);
          break;

        case asaasConfig.webhookEvents.PAYMENT_OVERDUE:
          // Pagamento vencido
          await supabase
            .from('payments')
            .update({ status: 'OVERDUE' })
            .eq('asaas_payment_id', paymentData.id);
          
          console.log(`⏰ Pagamento vencido: ${paymentData.id}`);
          break;

        case asaasConfig.webhookEvents.PAYMENT_DELETED:
          // Pagamento cancelado
          await supabase
            .from('payments')
            .update({ status: 'CANCELLED' })
            .eq('asaas_payment_id', paymentData.id);
          
          console.log(`🗑️  Pagamento cancelado: ${paymentData.id}`);
          break;

        case asaasConfig.webhookEvents.PAYMENT_REFUNDED:
          // Pagamento estornado
          await supabase
            .from('payments')
            .update({ status: 'REFUNDED' })
            .eq('asaas_payment_id', paymentData.id);
          
          console.log(`↩️  Pagamento estornado: ${paymentData.id}`);
          break;

        default:
          console.log(`ℹ️  Evento não tratado: ${event}`);
      }

      return true;

    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      return false;
    }
  }

  /**
   * Tratar pagamento confirmado
   */
  async handlePaymentConfirmed(paymentData, userId) {
    try {
      // Atualizar tabela payments
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: paymentData.status,
          net_value: paymentData.netValue,
          paid_at: paymentData.paymentDate,
          confirmed_at: paymentData.confirmedDate
        })
        .eq('asaas_payment_id', paymentData.id);

      if (paymentError) {
        throw new Error('Erro ao atualizar pagamento');
      }

      // Buscar plan_id do pagamento
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('plan_id')
        .eq('asaas_payment_id', paymentData.id)
        .single();

      if (fetchError || !payment) {
        throw new Error('Pagamento não encontrado no banco local');
      }

      // Atualizar plano do usuário
      const { error: userError } = await supabase
        .from('users')
        .update({
          plan_id: payment.plan_id,
          plan_status: 'active',
          plan_activated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userError) {
        throw new Error('Erro ao ativar plano do usuário');
      }

      console.log(`✅ Plano ativado para usuário ${userId} - Pagamento: ${paymentData.id}`);

      // TODO: Enviar email de confirmação
      // await this.sendConfirmationEmail(userId, paymentData);

      return true;

    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
