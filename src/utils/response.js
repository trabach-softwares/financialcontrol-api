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
