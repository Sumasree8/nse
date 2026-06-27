const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Honor an explicit status set via res.status(); otherwise fall back to an
  // error-carried statusCode/status, then a generic 500.
  const statusCode = res.statusCode === 200 ? (err.statusCode || err.status || 500) : res.statusCode;

  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(statusCode).json({
    error: err.message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
