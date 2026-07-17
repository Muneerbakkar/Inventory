import AppError from '../utils/appError.js';

const handleJWTError = () => new AppError('Session invalid. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Session expired. Please log in again.', 401);

export default (err, req, res, next) => {
  let error = { ...err };
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';
  error.message = err.message;
  error.name = err.name;
  error.stack = err.stack; // keep stack for dev

  // Important: If JWT is expired or invalid, transform the error into our custom AppError with a 401 statusCode
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack
    });
  } else {
    // Operational, trusted error: send message to client
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message
      });
    } else {
      // Programming or other unknown error: don't leak error details
      console.error('ERROR 💥', error);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
      });
    }
  }
};
