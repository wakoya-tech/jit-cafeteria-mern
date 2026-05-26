import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }
    
    const user = await User.findOne({ username: username.trim().toLowerCase() });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      studentId: user.studentId,
      token: signToken(user._id),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.password) user.password = req.body.password;
    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;