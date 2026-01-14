const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/search', auth, async (req, res) => {
  try {
    const searchTerm = req.query.q?.trim();
    console.log('Searching for users with query:', searchTerm);
    if (!searchTerm) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } }
        ],
        NOT: { id: req.user.id }
      },
      select: { id: true, username: true, email: true, phone: true, avatar: true, isOnline: true, status: true }
    });

    console.log(`Found ${users.length} users for query: ${searchTerm}`);
    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(400).json({ message: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { username, avatar, phone, status } = req.body;
    console.log(`[PROFILE UPDATE] User: ${req.user.id}, Body:`, req.body);

    const updateData = {};

    // Only update fields that are present in the request
    if (username !== undefined) {
      if (username.trim() === '') return res.status(400).json({ message: 'Username cannot be empty' });
      updateData.username = username.trim();
    }

    if (avatar !== undefined) updateData.avatar = avatar;
    if (status !== undefined) updateData.status = status;

    if (phone !== undefined) {
      const normalizedPhone = phone?.trim() || null;
      if (normalizedPhone) {
        const existingPhone = await prisma.user.findFirst({
          where: {
            phone: normalizedPhone,
            NOT: { id: req.user.id }
          }
        });
        if (existingPhone) return res.status(400).json({ message: 'Phone number already in use' });
      }
      updateData.phone = normalizedPhone;
    }

    console.log('[PROFILE UPDATE] updateData:', updateData);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, username: true, email: true, phone: true, avatar: true, isOnline: true, status: true }
    });

    res.json(user);
  } catch (error) {
    console.error('[PROFILE UPDATE] Error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Username or phone number already taken' });
    }
    res.status(400).json({ message: error.message || 'Failed to update profile' });
  }
});

module.exports = router;