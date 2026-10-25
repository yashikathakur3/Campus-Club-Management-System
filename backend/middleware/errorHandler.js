const ApiError = require('../utils/ApiError');

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details;

  if (error instanceof ApiError) {
    status = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error?.name === 'ZodError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
  } else if (error?.name === 'ValidationError' && error?.errors) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
  } else if (error?.name === 'CastError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = `Invalid value for ${error.path}`;
    details = [{ field: error.path, message: 'Invalid value' }];
  } else if (error?.code === 11000) {
    status = 409;
    code = 'CONFLICT';
    message = 'A record with this value already exists';
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    if (fields.length) details = fields.map((field) => ({ field, message: 'Already exists' }));
  } else if (['JsonWebTokenError', 'TokenExpiredError'].includes(error?.name)) {
    status = 401;
    code = 'UNAUTHORIZED';
    message = 'Invalid or expired authentication token';
  }

  const body = { success: false, error: { code, message } };
  if (details !== undefined) body.error.details = details;
  if (status === 500 && process.env.NODE_ENV !== 'production' && error?.message) {
    body.error.details = { cause: error.message };
  }
  return res.status(status).json(body);
}

module.exports = errorHandler;
