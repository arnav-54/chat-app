const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all statuses from users except current user
router.get('/', auth, async (req, res) => {
    try {
        const now = new Date();
        const statuses = await prisma.status.findMany({
            where: {
                expiresAt: { gt: now },
                NOT: { userId: req.user.id }
            },
            include: {
                user: {
                    select: { id: true, username: true, avatar: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Group statuses by user
        const groupedStatuses = statuses.reduce((acc, status) => {
            const userId = status.user.id;
            if (!acc[userId]) {
                acc[userId] = {
                    user: status.user,
                    updates: []
                };
            }
            acc[userId].updates.push(status);
            return acc;
        }, {});

        res.json(Object.values(groupedStatuses));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Post a new status
router.post('/', auth, async (req, res) => {
    try {
        const { content, type, mediaUrl } = req.body;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const status = await prisma.status.create({
            data: {
                content,
                type: type || 'text',
                mediaUrl,
                expiresAt,
                userId: req.user.id
            },
            include: {
                user: {
                    select: { id: true, username: true, avatar: true }
                }
            }
        });

        res.status(201).json(status);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get my statuses
router.get('/my', auth, async (req, res) => {
    try {
        const now = new Date();
        const statuses = await prisma.status.findMany({
            where: {
                userId: req.user.id,
                expiresAt: { gt: now }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(statuses);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
