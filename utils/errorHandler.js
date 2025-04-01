/**
 * Centralized error handler for API responses
 * Logs errors and sends appropriate HTTP responses
 */
exports.handleError = (res, error) => {
    // Log the error with stack trace for debugging
    console.error('❌ Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Handle specific error types
    switch (error.name) {
      case 'ValidationError':
        return res.status(400).json({
          message: 'Validation error',
          details: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        });
        
      case 'CastError':
        return res.status(400).json({
          message: 'Invalid ID format',
          details: {
            field: error.path,
            value: error.value
          }
        });
        
      case 'MongoError':
      case 'MongoServerError':
        // Handle duplicate key errors
        if (error.code === 11000) {
          return res.status(409).json({
            message: 'Duplicate key error',
            details: error.keyValue
          });
        }
        // Fall through to default for other Mongo errors
        
      default:
        return res.status(500).json({
          message: 'Internal server error',
          error: error.message
        });
    }
  }; 