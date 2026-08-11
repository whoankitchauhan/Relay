const jwt = require('jsonwebtoken');
const GENERIC_AUTH_ERROR = 'Please sign in to continue.';

// Fail fast if JWT_SECRET is not configured
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7, authHeader.length);
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: GENERIC_AUTH_ERROR });
  }

  try {
    // Verify token — uses JWT_SECRET from environment only
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
};
