import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

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
