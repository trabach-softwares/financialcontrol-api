/**
 * Configuração do Gateway de Pagamento Asaas
 * Docs: https://docs.asaas.com
 */

export const asaasConfig = {
  // API Key (obter em: Dashboard → Integrações → API Key)
  apiKey: process.env.ASAAS_API_KEY,
  
  // Ambiente: sandbox ou production
  environment: process.env.ASAAS_ENVIRONMENT || 'sandbox',
  
  // Chave secreta do webhook (obter em: Dashboard → Webhooks)
  webhookSecret: process.env.ASAAS_WEBHOOK_SECRET,
  
  // URLs da API
  get apiUrl() {
    return this.environment === 'production'
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';
  },
  
  // Headers padrão para requisições
  get headers() {
    return {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'FinancialControl-API/1.0'
    };
  },
  
  // Validar configuração
  validate() {
    if (!this.apiKey) {
      throw new Error('ASAAS_API_KEY não configurada no .env');
    }
    
    if (!['sandbox', 'production'].includes(this.environment)) {
      throw new Error('ASAAS_ENVIRONMENT deve ser "sandbox" ou "production"');
    }
    
    if (!this.webhookSecret) {
      console.warn('⚠️  ASAAS_WEBHOOK_SECRET não configurada - webhooks não serão validados');
    }
    
    return true;
  },
  
  // Configurações de pagamento
  payment: {
    // Dias para vencimento padrão
    defaultDueDays: 3,
    
    // Métodos aceitos
    methods: {
      PIX: 'PIX',
      BOLETO: 'BOLETO',
      CREDIT_CARD: 'CREDIT_CARD'
    },
    
    // Status possíveis
    status: {
      PENDING: 'PENDING',           // Aguardando pagamento
      RECEIVED: 'RECEIVED',         // Pagamento recebido
      CONFIRMED: 'CONFIRMED',       // Pagamento confirmado
      OVERDUE: 'OVERDUE',          // Vencido
      REFUNDED: 'REFUNDED',        // Estornado
      REFUND_REQUESTED: 'REFUND_REQUESTED',
      CHARGEBACK_REQUESTED: 'CHARGEBACK_REQUESTED',
      CHARGEBACK_DISPUTE: 'CHARGEBACK_DISPUTE',
      AWAITING_CHARGEBACK_REVERSAL: 'AWAITING_CHARGEBACK_REVERSAL',
      DUNNING_REQUESTED: 'DUNNING_REQUESTED',
      DUNNING_RECEIVED: 'DUNNING_RECEIVED',
      AWAITING_RISK_ANALYSIS: 'AWAITING_RISK_ANALYSIS',
      CANCELLED: 'CANCELLED'        // Cancelado
    }
  },
  
  // Eventos de webhook
  webhookEvents: {
    PAYMENT_CREATED: 'PAYMENT_CREATED',
    PAYMENT_AWAITING_RISK_ANALYSIS: 'PAYMENT_AWAITING_RISK_ANALYSIS',
    PAYMENT_APPROVED_BY_RISK_ANALYSIS: 'PAYMENT_APPROVED_BY_RISK_ANALYSIS',
    PAYMENT_REPROVED_BY_RISK_ANALYSIS: 'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
    PAYMENT_UPDATED: 'PAYMENT_UPDATED',
    PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
    PAYMENT_ANTICIPATED: 'PAYMENT_ANTICIPATED',
    PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
    PAYMENT_DELETED: 'PAYMENT_DELETED',
    PAYMENT_RESTORED: 'PAYMENT_RESTORED',
    PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
    PAYMENT_REFUND_IN_PROGRESS: 'PAYMENT_REFUND_IN_PROGRESS',
    PAYMENT_RECEIVED_IN_CASH_DELETED: 'PAYMENT_RECEIVED_IN_CASH_DELETED',
    PAYMENT_CHARGEBACK_REQUESTED: 'PAYMENT_CHARGEBACK_REQUESTED',
    PAYMENT_CHARGEBACK_DISPUTE: 'PAYMENT_CHARGEBACK_DISPUTE',
    PAYMENT_AWAITING_CHARGEBACK_REVERSAL: 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
    PAYMENT_DUNNING_RECEIVED: 'PAYMENT_DUNNING_RECEIVED',
    PAYMENT_DUNNING_REQUESTED: 'PAYMENT_DUNNING_REQUESTED',
    PAYMENT_BANK_SLIP_VIEWED: 'PAYMENT_BANK_SLIP_VIEWED',
    PAYMENT_CHECKOUT_VIEWED: 'PAYMENT_CHECKOUT_VIEWED'
  }
};

// Validar configuração ao carregar o módulo
if (asaasConfig.apiKey) {
  try {
    asaasConfig.validate();
    console.log(`✅ Asaas configurado: ${asaasConfig.environment} (${asaasConfig.apiUrl})`);
  } catch (error) {
    console.error('❌ Erro na configuração do Asaas:', error.message);
  }
}
