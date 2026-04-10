import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('Auth failed: No authorization header');
      return res.status(401).json({ message: 'No authorization header, access denied' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Auth failed: No token in authorization header');
      return res.status(401).json({ message: 'No token provided, access denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    console.log(`Auth success: User ${decoded.userId}`);
    next();
  } catch (error) {
    console.log('Auth failed:', error.message);
    res.status(401).json({ message: 'Invalid token, access denied' });
  }
};

export const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '24h' }
  );
};
