const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.message, err.stack);

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return error(res, 'A record with this value already exists', 409);
    }
    if (err.code === 'P2025') {
      return error(res, 'Record not found', 404);
    }
  }

  if (err.name === 'ValidationError') {
    return error(res, err.message, 400);
  }

  return error(res, err.message || 'Internal Server Error', err.statusCode || 500);
};

const notFound = (req, res, next) => {
  return error(res, `Route ${req.originalUrl} not found`, 404);
};

module.exports = { errorHandler, notFound };
