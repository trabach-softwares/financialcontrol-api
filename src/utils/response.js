/**
 * Standard JSON response format
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

export const sendError = (res, message = 'Error', statusCode = 400, data = null) => {
  return res.status(statusCode).json({
    success: false,
    data,
    message
  });
};

/**
 * Retorna o horário atual ajustado para Brasília (UTC-3) em formato ISO string.
 * Usar sempre que for salvar datas no banco vindas do servidor.
 */
export const nowBR = () => new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
