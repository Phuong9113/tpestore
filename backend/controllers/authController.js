import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/database.js';
import { handleError, validateRequired, isValidEmail, isValidPassword } from '../utils/helpers.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation
    const validation = validateRequired(req.body, ['email', 'password']);
    if (validation) return res.status(400).json(validation);
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ 
      data: { 
        name: name || email.split('@')[0], 
        email, 
        password: passwordHash 
      } 
    });
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    const validation = validateRequired(req.body, ['email', 'password']);
    if (validation) return res.status(400).json(validation);
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id }, 
      select: { id: true, name: true, email: true, role: true } 
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name } = req.body;
    
    const updated = await prisma.user.update({ 
      where: { id: req.user.id }, 
      data: { name }, 
      select: { id: true, name: true, email: true, role: true } 
    });
    
    res.json({ user: updated });
  } catch (error) {
    handleError(res, error);
  }
};
