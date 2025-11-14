import { getSummaryReport, exportReport } from '../services/reportService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { validateDateParams } from '../utils/dateValidation.js';

export const reportController = {
  /**
   * GET /api/reports/summary
   * Retorna relatório resumido com totais, categorias e evolução mensal
   * FREE: apenas 3 categorias, PRO/PREMIUM: todas
   */
  async getSummary(req, res) {
    try {
      const userId = req.user.id;
      const { start_date, end_date, startDate, endDate } = req.query;

      // Suporta tanto snake_case quanto camelCase
      const finalStartDate = start_date || startDate;
      const finalEndDate = end_date || endDate;

      // Valida parâmetros de data (opcional)
      if (finalStartDate || finalEndDate) {
        const dateValidation = validateDateParams(finalStartDate, finalEndDate);
        if (!dateValidation.valid) {
          return sendError(res, dateValidation.error, 400);
        }
      }

      const report = await getSummaryReport(userId, {
        startDate: finalStartDate,
        endDate: finalEndDate
      });

      return sendSuccess(res, report, 'Report summary retrieved successfully');
    } catch (error) {
      console.error('❌ Error getting report summary:', error);
      return sendError(res, error.message || 'Failed to get report summary', error.status || 500);
    }
  },

  /**
   * POST /api/reports/export
   * Exporta relatório completo em PDF/Excel/CSV
   * FREE: bloqueado (403)
   * PRO: máximo 5 exportações por dia
   * PREMIUM: ilimitado
   */
  async export(req, res) {
    try {
      const userId = req.user.id;
      const { format = 'pdf', start_date, end_date, startDate, endDate } = req.body;

      // Suporta tanto snake_case quanto camelCase
      const finalStartDate = start_date || startDate;
      const finalEndDate = end_date || endDate;

      // Valida formato
      if (!['pdf', 'xlsx', 'csv'].includes(format)) {
        return sendError(res, 'Invalid format. Use: pdf, xlsx, or csv', 400);
      }

      // Valida parâmetros de data (opcional)
      if (finalStartDate || finalEndDate) {
        const dateValidation = validateDateParams(finalStartDate, finalEndDate);
        if (!dateValidation.valid) {
          return sendError(res, dateValidation.error, 400);
        }
      }

      const result = await exportReport(userId, {
        format,
        startDate: finalStartDate,
        endDate: finalEndDate
      });

      // Define headers para download
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      
      // Adiciona informações de limite no header
      if (result.exportInfo) {
        res.setHeader('X-Export-Current', result.exportInfo.current);
        if (result.exportInfo.limit) {
          res.setHeader('X-Export-Limit', result.exportInfo.limit);
          res.setHeader('X-Export-Remaining', result.exportInfo.remaining);
        }
      }

      return res.send(result.data);
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      
      // Se for erro de permissão/limite, retorna JSON com erro
      if (error.status === 403) {
        return res.status(403).json({
          success: false,
          error: error.message,
          data: error.data
        });
      }

      return sendError(res, error.message || 'Failed to export report', error.status || 500);
    }
  }
};
