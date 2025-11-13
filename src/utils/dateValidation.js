/**
 * Date Validation Utilities
 * Funções para validar e processar parâmetros de data
 */

/**
 * Valida se uma string está no formato YYYY-MM-DD e é uma data válida
 * @param {string} dateString - String da data
 * @returns {boolean}
 */
export function isValidDateFormat(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  // Verifica formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Verifica se é uma data válida
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Valida parâmetros de data (start_date e end_date)
 * @param {string} startDate - Data inicial (opcional)
 * @param {string} endDate - Data final (opcional)
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateDateParams(startDate, endDate) {
  // Se nenhuma data foi fornecida, é válido
  if (!startDate && !endDate) {
    return { valid: true };
  }

  // Valida formato de start_date
  if (startDate && !isValidDateFormat(startDate)) {
    return {
      valid: false,
      error: 'start_date deve estar no formato YYYY-MM-DD (ex: 2025-11-01)'
    };
  }

  // Valida formato de end_date
  if (endDate && !isValidDateFormat(endDate)) {
    return {
      valid: false,
      error: 'end_date deve estar no formato YYYY-MM-DD (ex: 2025-11-30)'
    };
  }

  // Se ambas foram fornecidas, valida se start_date <= end_date
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return {
        valid: false,
        error: 'start_date deve ser menor ou igual a end_date'
      };
    }
  }

  return { valid: true };
}

/**
 * Normaliza uma data para o formato YYYY-MM-DD
 * @param {string|Date} date - Data a ser normalizada
 * @returns {string|null}
 */
export function normalizeDateToString(date) {
  if (!date) return null;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

/**
 * Obtém o primeiro dia do mês atual
 * @returns {string} Data no formato YYYY-MM-DD
 */
export function getFirstDayOfCurrentMonth() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return firstDay.toISOString().slice(0, 10);
}

/**
 * Obtém o último dia do mês atual
 * @returns {string} Data no formato YYYY-MM-DD
 */
export function getLastDayOfCurrentMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.toISOString().slice(0, 10);
}

/**
 * Obtém intervalo de datas baseado em um período
 * @param {string} period - Período (1month, 3months, 6months, 1year)
 * @returns {Object} { startDate: string, endDate: string }
 */
export function getDateRangeFromPeriod(period = '6months') {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '1month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 6);
  }

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10)
  };
}
