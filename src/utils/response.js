/**
 * Standard JSON response format
 * @param {boolean} success - Indicates if the operation was successful
 * @param {*} data - The response data
 * @param {string} message - A message describing the result
 */
export const createResponse = (success, data = null, message = '') => {
  return {
    success,
    data,
    message,
  };
};

export const successResponse = (data, message = 'Success') => {
  return createResponse(true, data, message);
};

export const errorResponse = (message = 'Error', data = null) => {
  return createResponse(false, data, message);
};
