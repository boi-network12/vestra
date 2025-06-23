class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
      super(message);
  
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = isOperational; // Distinguish operational errors from programming errors
      
      // Capture stack trace (excluding constructor call from the stack trace)
      Error.captureStackTrace(this, this.constructor);
    }
  
    // Static factory methods for common error types
    static badRequest(message = 'Bad Request') {
      return new AppError(message, 400);
    }
  
    static unauthorized(message = 'Unauthorized') {
      return new AppError(message, 401);
    }
  
    static forbidden(message = 'Forbidden') {
      return new AppError(message, 403);
    }
  
    static notFound(message = 'Not Found') {
      return new AppError(message, 404);
    }
  
    static conflict(message = 'Conflict') {
      return new AppError(message, 409);
    }
  
    static internalError(message = 'Internal Server Error') {
      return new AppError(message, 500);
    }
  
    static validationError(message = 'Validation Error') {
      return new AppError(message, 422);
    }
  }
  
  module.exports = AppError;