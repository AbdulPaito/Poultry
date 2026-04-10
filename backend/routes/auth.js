import express from 'express';
import User from '../models/User.js';
import { authMiddleware, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        farmName: user.farmName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register (for initial setup)
router.post('/register', async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    const { username, password, email, fullName, farmName } = req.body;
    
    // Validate required fields
    if (!username || !password || !email || !fullName) {
      return res.status(400).json({ message: 'All fields are required except farm name' });
    }
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    const user = new User({
      username,
      password,
      email,
      fullName,
      farmName: farmName || '',
      role: 'admin'
    });
    
    await user.save();
    console.log('User created successfully:', username);
    
    const token = generateToken(user);
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        farmName: user.farmName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
