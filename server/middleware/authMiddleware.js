import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to protect routes by verifying JWT token.
 * It checks for a 'Bearer' token in the Authorization header,
 * verifies it, and attaches the user to the request object.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token's ID and attach to request object
      // Exclude the password hash from being attached
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

/**
 * Middleware for role-based authorization.
 * @param {...string} roles - The roles allowed to access the route.
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Forbidden: Role '${req.user.role}' is not authorized` });
        }
        next();
    }
}

export { protect, authorize };
