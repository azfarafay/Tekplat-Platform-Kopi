const jwt = require('jsonwebtoken');

/**
 * Middleware untuk validasi JWT token
 * Mengekstrak token dari Authorization header (Bearer token)
 * Jika valid, simpan user data ke req.user dan lanjut ke next()
 * Jika tidak valid/tidak ada, return error 401/403
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is missing',
      });
    }

    // Extract Bearer token
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is missing',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Attach user data to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token',
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Token verification failed',
      error: error.message,
    });
  }
};

/**
 * Middleware untuk membatasi akses berdasarkan peran pengguna
 * Gunakan: app.use('/protected-route', authorizeRole('roastery', 'admin'))
 * @param {...string} roles - Peran yang diizinkan
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    try {
      // Check if user exists in request
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Check if user has required role
      const userRole = req.user.role;

      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${userRole || 'unknown'}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message,
      });
    }
  };
};

module.exports = {
  verifyToken,
  authorizeRole,
};
