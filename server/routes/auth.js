const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { hashPassword, comparePassword } = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    if (phone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingPhone) return res.status(400).json({ message: 'Phone number already registered' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { username, email, phone, password: hashedPassword }
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.status(201).json({ token, user: { id: user.id, username, email, phone, avatar: user.avatar, status: user.status } });
  } catch (error) {
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      if (target.includes('username')) {
        return res.status(400).json({ message: 'Username is already taken. Please choose another one.' });
      }
      if (target.includes('email')) {
        return res.status(400).json({ message: 'Email is already registered. Please login instead.' });
      }
      if (target.includes('phone')) {
        return res.status(400).json({ message: 'Phone number is already registered.' });
      }
      return res.status(400).json({ message: 'User with these details already exists.' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Something went wrong during registration. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true }
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, phone: user.phone, avatar: user.avatar, status: user.status } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/logout', auth, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isOnline: false, lastSeen: new Date() }
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;