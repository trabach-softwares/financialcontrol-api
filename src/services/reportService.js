import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { supabaseAdmin } from '../config/supabase.js';
import { planLimitsService } from './planLimitsService.js';

const formatCurrency = (value = 0, currency = 'BRL') => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch (error) {
    return Number(value || 0).toFixed(2);
  }
};

const buildFilename = (account, filters, formatExt) => {
  const accountSlug = account?.name
    ? account.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')
    : 'account';

  const start = filters?.startDate ? filters.startDate : 'start';
  const end = filters?.endDate ? filters.endDate : 'end';
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');

  return `statement-${accountSlug}-${start}-${end}-${timestamp}.${formatExt}`;
};

const buildCsv = ({ account, filters, summary, transactions }) => {
  const lines = [];
  lines.push('Conta;Banco;Tipo;Moeda');
  lines.push(`${account?.name || ''};${account?.bankName || ''};${account?.accountType || ''};${account?.currency || 'BRL'}`);
  lines.push('');
  lines.push('Saldo inicial;Entradas;Saídas;Saldo final');
  lines.push(`${summary.openingBalance};${summary.inflows};${summary.outflows};${summary.closingBalance}`);
  lines.push('');
  lines.push('Data;Descrição;Categoria;Tipo;Valor;Saldo acumulado');

  let runningBalance = summary.openingBalance;
  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    runningBalance += tx.type === 'income' ? amount : -amount;
    lines.push([
      tx.date,
      tx.description || '',
      tx.category || '',
      tx.type,
      amount.toFixed(2),
      runningBalance.toFixed(2),
    ].join(';'));
  });

  return Buffer.from(lines.join('\n'), 'utf8');
};

const buildXlsx = async ({ account, summary, transactions }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Statement');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Description', key: 'description', width: 32 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Amount', key: 'amount', width: 14 },
    { header: 'Running Balance', key: 'balance', width: 18 },
  ];

  sheet.addRow(['Account', account?.name || '', 'Bank', account?.bankName || '']);
  sheet.addRow(['Currency', account?.currency || 'BRL', 'Status', account?.status || 'active']);
  sheet.addRow([]);
  sheet.addRow(['Opening Balance', summary.openingBalance, '', 'Closing Balance', summary.closingBalance]);
  sheet.addRow(['Inflows', summary.inflows, '', 'Outflows', summary.outflows]);
  sheet.addRow([]);

  sheet.addRow(sheet.columns.map((col) => col.header));

  let runningBalance = summary.openingBalance;
  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    runningBalance += tx.type === 'income' ? amount : -amount;
    sheet.addRow({
      date: tx.date,
      description: tx.description || '',
      category: tx.category || '',
      type: tx.type,
      amount,
      balance: runningBalance,
    });
  });

  sheet.getColumn('amount').numFmt = '#,##0.00';
  sheet.getColumn('balance').numFmt = '#,##0.00';

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const buildPdf = async ({ account, summary, transactions }) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const title = `Extrato - ${account?.name || 'Conta'}`;
  doc.fontSize(18).text(title, { align: 'left' });
  doc.moveDown();

  doc.fontSize(10);
  doc.text(`Banco: ${account?.bankName || '-'}`);
  doc.text(`Moeda: ${account?.currency || 'BRL'}`);
  doc.text(`Status: ${account?.status || 'active'}`);
  doc.moveDown();

  doc.text(`Saldo inicial: ${formatCurrency(summary.openingBalance, account?.currency)}`);
  doc.text(`Entradas: ${formatCurrency(summary.inflows, account?.currency)}`);
  doc.text(`Saídas: ${formatCurrency(summary.outflows, account?.currency)}`);
  doc.text(`Saldo final: ${formatCurrency(summary.closingBalance, account?.currency)}`);
  doc.moveDown();

  doc.fontSize(11).text('Transações', { underline: true });
  doc.moveDown(0.5);

  const tableHeaders = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Saldo'];
  const columnWidths = [80, 150, 90, 50, 80, 80];

  doc.font('Helvetica-Bold');
  tableHeaders.forEach((header, index) => {
    doc.text(header, { continued: index !== tableHeaders.length - 1, width: columnWidths[index] });
  });
  doc.font('Helvetica');
  doc.moveDown(0.5);

  let runningBalance = summary.openingBalance;
  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    runningBalance += tx.type === 'income' ? amount : -amount;
    const row = [
      tx.date || '-',
      tx.description || '-',
      tx.category || '-',
      tx.type || '-',
      formatCurrency(amount, account?.currency),
      formatCurrency(runningBalance, account?.currency),
    ];

    row.forEach((value, index) => {
      doc.text(value, { continued: index !== row.length - 1, width: columnWidths[index] });
    });
    doc.moveDown(0.3);
  });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
  });
};

export const generateAccountStatementReport = async ({
  account,
  filters = {},
  summary,
  transactions = [],
  format = 'csv',
}) => {
  const normalizedFormat = ['csv', 'xlsx', 'pdf'].includes(format) ? format : 'csv';
  const filename = buildFilename(account, filters, normalizedFormat);

  switch (normalizedFormat) {
    case 'xlsx': {
      const buffer = await buildXlsx({ account, summary, transactions });
      return {
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        data: buffer,
      };
    }
    case 'pdf': {
      const buffer = await buildPdf({ account, summary, transactions });
      return {
        filename,
        contentType: 'application/pdf',
        data: buffer,
      };
    }
    case 'csv':
    default: {
      const buffer = buildCsv({ account, filters, summary, transactions });
      return {
        filename,
        contentType: 'text/csv',
        data: buffer,
      };
    }
  }
};

/**
 * Gera relatório resumido com regras de plano
 * FREE: apenas 3 categorias
 * PRO/PREMIUM: todas as categorias
 */
export const getSummaryReport = async (userId, { startDate, endDate } = {}) => {
  try {
    // Buscar plano do usuário
    const plan = await planLimitsService.getUserPlan(userId);
    const isFree = plan.name === 'Gratuito';

    // Validar datas
    const start = startDate || format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
    const end = endDate || format(new Date(), 'yyyy-MM-dd');

    // 1. Buscar totais (receitas, despesas, saldo)
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('type, amount, category, date')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end);

    if (txError) throw txError;

    const totalIncome = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalExpense = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const balance = totalIncome - totalExpense;

    // 2. Agrupar por categoria
    const categoryMap = {};
    transactions.forEach(tx => {
      const cat = tx.category || 'Sem categoria';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { 
          name: cat, 
          income: 0, 
          expense: 0, 
          total: 0,
          count: 0 
        };
      }
      
      const amount = Number(tx.amount || 0);
      if (tx.type === 'income') {
        categoryMap[cat].income += amount;
      } else {
        categoryMap[cat].expense += amount;
      }
      categoryMap[cat].total = categoryMap[cat].income - categoryMap[cat].expense;
      categoryMap[cat].count++;
    });

    // Ordenar por maior gasto
    let categories = Object.values(categoryMap).sort((a, b) => b.expense - a.expense);

    // REGRA: Plano FREE vê apenas TOP 3 categorias
    const categoryLimit = isFree ? 3 : null;
    const hasMoreCategories = isFree && categories.length > 3;
    
    if (isFree && categories.length > 3) {
      categories = categories.slice(0, 3);
    }

    // 3. Evolução mensal (últimos 6 meses)
    const monthlyEvolution = [];
    const endMonth = new Date(end);
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(endMonth.getFullYear(), endMonth.getMonth() - i, 1);
      const monthStart = format(monthDate, 'yyyy-MM-dd');
      const monthEnd = format(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0), 'yyyy-MM-dd');
      
      const monthTxs = transactions.filter(tx => tx.date >= monthStart && tx.date <= monthEnd);
      
      const monthIncome = monthTxs
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      
      const monthExpense = monthTxs
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      
      monthlyEvolution.push({
        month: format(monthDate, 'yyyy-MM'),
        monthLabel: format(monthDate, 'MMM/yyyy', { locale: { code: 'pt-BR' } }),
        income: monthIncome,
        expense: monthExpense,
        balance: monthIncome - monthExpense
      });
    }

    return {
      period: {
        startDate: start,
        endDate: end
      },
      summary: {
        totalIncome,
        totalExpense,
        balance,
        transactionCount: transactions.length
      },
      categories: {
        data: categories,
        limit: categoryLimit,
        hasMore: hasMoreCategories,
        total: Object.keys(categoryMap).length,
        message: hasMoreCategories 
          ? `Exibindo top 3 de ${Object.keys(categoryMap).length} categorias. Faça upgrade para ver todas!`
          : null
      },
      monthlyEvolution,
      planInfo: {
        name: plan.name,
        canExport: plan.name !== 'Gratuito'
      }
    };
  } catch (error) {
    console.error('❌ Erro ao gerar relatório resumido:', error);
    throw error;
  }
};

/**
 * Verifica limite de exportações diárias
 */
const checkExportLimit = async (userId, planName) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Buscar exportações de hoje
  const { count, error } = await supabaseAdmin
    .from('report_exports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', `${today} 00:00:00`)
    .lte('created_at', `${today} 23:59:59`);

  if (error) throw error;

  const currentExports = count || 0;

  // Limites por plano
  const limits = {
    'Gratuito': 0, // Bloqueado
    'Pro': 5,
    'Premium': null // Ilimitado
  };

  const limit = limits[planName];

  // Premium é ilimitado
  if (limit === null) {
    return { allowed: true, current: currentExports, limit: null };
  }

  // Gratuito é bloqueado
  if (limit === 0) {
    return { 
      allowed: false, 
      current: currentExports, 
      limit: 0,
      message: 'Exportação de relatórios não disponível no plano Gratuito. Faça upgrade para o plano Pro!'
    };
  }

  // Pro tem limite diário
  const allowed = currentExports < limit;
  return { 
    allowed, 
    current: currentExports, 
    limit,
    remaining: limit - currentExports,
    message: allowed ? null : `Limite diário de ${limit} exportações atingido. Tente novamente amanhã ou faça upgrade para Premium!`
  };
};

/**
 * Registra uma exportação
 */
const recordExport = async (userId, format, filters) => {
  const { error } = await supabaseAdmin
    .from('report_exports')
    .insert([{
      user_id: userId,
      format,
      filters: filters || {},
      created_at: new Date().toISOString()
    }]);

  if (error) throw error;
};

/**
 * Exporta relatório completo (PDF/Excel/CSV)
 * FREE: bloqueado
 * PRO: máximo 5 por dia
 * PREMIUM: ilimitado
 */
export const exportReport = async (userId, { format = 'pdf', startDate, endDate } = {}) => {
  try {
    // Buscar plano do usuário
    const plan = await planLimitsService.getUserPlan(userId);

    // Verificar se tem acesso à feature
    const hasFeature = await planLimitsService.canAccessFeature(userId, 'pdfExport');
    if (!hasFeature.allowed) {
      const error = new Error('Exportação de relatórios não disponível no plano Gratuito. Faça upgrade para o plano Pro!');
      error.status = 403;
      error.data = {
        planName: plan.name,
        requiredPlan: 'Pro',
        feature: 'pdfExport',
        upgradeRequired: true
      };
      throw error;
    }

    // Verificar limite de exportações
    const exportLimit = await checkExportLimit(userId, plan.name);
    if (!exportLimit.allowed) {
      const error = new Error(exportLimit.message);
      error.status = 403;
      error.data = {
        current: exportLimit.current,
        limit: exportLimit.limit,
        planName: plan.name,
        upgradeRequired: plan.name !== 'Premium'
      };
      throw error;
    }

    // Buscar dados do relatório
    const reportData = await getSummaryReport(userId, { startDate, endDate });

    // Gerar arquivo baseado no formato
    const normalizedFormat = ['pdf', 'xlsx', 'csv'].includes(format) ? format : 'pdf';
    
    let buffer;
    let contentType;
    let filename;

    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');

    if (normalizedFormat === 'pdf') {
      buffer = await buildReportPdf(reportData);
      contentType = 'application/pdf';
      filename = `relatorio-financeiro-${timestamp}.pdf`;
    } else if (normalizedFormat === 'xlsx') {
      buffer = await buildReportXlsx(reportData);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `relatorio-financeiro-${timestamp}.xlsx`;
    } else {
      buffer = buildReportCsv(reportData);
      contentType = 'text/csv';
      filename = `relatorio-financeiro-${timestamp}.csv`;
    }

    // Registrar exportação
    await recordExport(userId, normalizedFormat, { startDate, endDate });

    return {
      filename,
      contentType,
      data: buffer,
      exportInfo: {
        current: exportLimit.current + 1,
        limit: exportLimit.limit,
        remaining: exportLimit.limit ? exportLimit.limit - exportLimit.current - 1 : null
      }
    };
  } catch (error) {
    console.error('❌ Erro ao exportar relatório:', error);
    throw error;
  }
};

// Funções auxiliares de geração de relatório
const buildReportPdf = async (data) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Título
  doc.fontSize(20).text('Relatório Financeiro', { align: 'center' });
  doc.moveDown();

  // Período
  doc.fontSize(12).text(`Período: ${data.period.startDate} a ${data.period.endDate}`, { align: 'center' });
  doc.moveDown(2);

  // Resumo
  doc.fontSize(16).text('Resumo', { underline: true });
  doc.moveDown();
  doc.fontSize(12);
  doc.text(`Total de Receitas: ${formatCurrency(data.summary.totalIncome)}`);
  doc.text(`Total de Despesas: ${formatCurrency(data.summary.totalExpense)}`);
  doc.text(`Saldo: ${formatCurrency(data.summary.balance)}`);
  doc.text(`Transações: ${data.summary.transactionCount}`);
  doc.moveDown(2);

  // Categorias
  doc.fontSize(16).text('Por Categoria', { underline: true });
  doc.moveDown();
  if (data.categories.message) {
    doc.fontSize(10).fillColor('orange').text(data.categories.message);
    doc.fillColor('black');
    doc.moveDown();
  }
  
  data.categories.data.forEach(cat => {
    doc.fontSize(12).text(`${cat.name}:`, { continued: true });
    doc.text(` ${formatCurrency(cat.expense)} (${cat.count} transações)`);
  });
  doc.moveDown(2);

  // Evolução Mensal
  doc.fontSize(16).text('Evolução Mensal', { underline: true });
  doc.moveDown();
  data.monthlyEvolution.forEach(month => {
    doc.fontSize(11).text(`${month.monthLabel}:`, { continued: true });
    doc.text(` Receitas ${formatCurrency(month.income)} | Despesas ${formatCurrency(month.expense)} | Saldo ${formatCurrency(month.balance)}`);
  });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
};

const buildReportXlsx = async (data) => {
  const workbook = new ExcelJS.Workbook();
  
  // Aba 1: Resumo
  const summarySheet = workbook.addWorksheet('Resumo');
  summarySheet.addRow(['Relatório Financeiro']);
  summarySheet.addRow([]);
  summarySheet.addRow(['Período', data.period.startDate, 'a', data.period.endDate]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Total de Receitas', data.summary.totalIncome]);
  summarySheet.addRow(['Total de Despesas', data.summary.totalExpense]);
  summarySheet.addRow(['Saldo', data.summary.balance]);
  summarySheet.addRow(['Transações', data.summary.transactionCount]);

  // Aba 2: Categorias
  const categorySheet = workbook.addWorksheet('Categorias');
  categorySheet.columns = [
    { header: 'Categoria', key: 'name', width: 25 },
    { header: 'Receitas', key: 'income', width: 15 },
    { header: 'Despesas', key: 'expense', width: 15 },
    { header: 'Saldo', key: 'total', width: 15 },
    { header: 'Transações', key: 'count', width: 15 }
  ];
  
  data.categories.data.forEach(cat => {
    categorySheet.addRow(cat);
  });

  // Aba 3: Evolução Mensal
  const evolutionSheet = workbook.addWorksheet('Evolução Mensal');
  evolutionSheet.columns = [
    { header: 'Mês', key: 'monthLabel', width: 15 },
    { header: 'Receitas', key: 'income', width: 15 },
    { header: 'Despesas', key: 'expense', width: 15 },
    { header: 'Saldo', key: 'balance', width: 15 }
  ];
  
  data.monthlyEvolution.forEach(month => {
    evolutionSheet.addRow(month);
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const buildReportCsv = (data) => {
  const lines = [];
  lines.push('Relatório Financeiro');
  lines.push('');
  lines.push(`Período;${data.period.startDate};a;${data.period.endDate}`);
  lines.push('');
  lines.push('RESUMO');
  lines.push(`Total de Receitas;${data.summary.totalIncome}`);
  lines.push(`Total de Despesas;${data.summary.totalExpense}`);
  lines.push(`Saldo;${data.summary.balance}`);
  lines.push(`Transações;${data.summary.transactionCount}`);
  lines.push('');
  lines.push('CATEGORIAS');
  lines.push('Categoria;Receitas;Despesas;Saldo;Transações');
  data.categories.data.forEach(cat => {
    lines.push(`${cat.name};${cat.income};${cat.expense};${cat.total};${cat.count}`);
  });
  lines.push('');
  lines.push('EVOLUÇÃO MENSAL');
  lines.push('Mês;Receitas;Despesas;Saldo');
  data.monthlyEvolution.forEach(month => {
    lines.push(`${month.monthLabel};${month.income};${month.expense};${month.balance}`);
  });

  return Buffer.from(lines.join('\n'), 'utf8');
};

