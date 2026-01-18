const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const messages = await prisma.message.findMany({
      where: { chatId: req.params.id },
      include: { sender: { select: { username: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    if (messages.length === 0) {
      return res.json({ summary: "No messages to summarize." });
    }

    const conversation = messages.map(m => `${m.sender.username}: ${m.content}`).join('\n');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Summarize this conversation, extract key points, and identify any tasks or decisions made. 
    Format your response as a JSON object with strictly these keys:
    {
      "summary": "a concise paragraph summary",
      "keyPoints": ["point 1", "point 2"],
      "tasks": ["task 1", "task 2"]
    }
    Conversation:
    \n\n${conversation}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up potential markdown formatting from AI response
    const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();

    try {
      const parsed = JSON.parse(jsonStr);

      // Update chat with summary and key points
      await prisma.chat.update({
        where: { id: req.params.id },
        data: {
          summary: parsed.summary || responseText,
          keyPoints: parsed.keyPoints || []
        }
      });

      // Handle tasks
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        // Clear old tasks for this chat if needed, or just add new ones
        // For simplicity, let's just add new ones
        await Promise.all(
          parsed.tasks.map(taskText =>
            prisma.task.create({
              data: {
                text: taskText,
                chatId: req.params.id
              }
            })
          )
        );
      }

      res.json({
        summary: parsed.summary || responseText,
        tasks: parsed.tasks || []
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', responseText);
      // Fallback for non-JSON response
      await prisma.chat.update({
        where: { id: req.params.id },
        data: { summary: responseText }
      });
      res.json({ summary: responseText });
    }
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(400).json({
      message: 'AI processing failed.',
      error: error.message,
      details: error.response?.data || error.response || 'No additional details'
    });
  }
});

module.exports = router;