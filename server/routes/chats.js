const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const OpenAI = require('openai');
const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.get('/', auth, async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { userId: req.user.id }
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, avatar: true, isOnline: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(chats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, participants, isGroup } = req.body;

    const chat = await prisma.chat.create({
      data: {
        name,
        isGroup,
        adminId: isGroup ? req.user.id : null
      }
    });

    const participantIds = [...(participants || []), req.user.id];
    await Promise.all(
      participantIds.map(userId =>
        prisma.chatParticipant.create({
          data: { userId, chatId: chat.id }
        })
      )
    );

    const chatWithParticipants = await prisma.chat.findUnique({
      where: { id: chat.id },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, avatar: true, isOnline: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const io = req.app.get('io');
    const activeUsers = req.app.get('activeUsers');

    chatWithParticipants.participants.forEach(p => {
      const socketId = activeUsers.get(p.userId);
      if (socketId) {
        io.to(socketId).emit('newChat', chatWithParticipants);
      }
    });

    res.status(201).json(chatWithParticipants);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id/messages', auth, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { chatId: req.params.id },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        reactions: { include: { user: { select: { id: true, username: true } } } }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/summarize', auth, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { chatId: req.params.id },
      include: { sender: { select: { username: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    const conversation = messages.map(m => `${m.sender.username}: ${m.content}`).join('\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "Summarize this conversation, extract key points, and identify any tasks or decisions made."
      }, {
        role: "user",
        content: conversation
      }],
      max_tokens: 500
    });

    const summary = completion.choices[0].message.content;

    await prisma.chat.update({
      where: { id: req.params.id },
      data: { summary }
    });
    res.json({ summary });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;