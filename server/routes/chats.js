const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
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

    if (!isGroup && participants.length === 1) {
      // Check if a 1-on-1 chat already exists
      const otherUserId = participants[0];
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: req.user.id } } },
            { participants: { some: { userId: otherUserId } } }
          ]
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
        }
      });

      if (existingChat) {
        return res.json(existingChat);
      }
    }

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
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing in server environment");
      return res.status(500).json({ message: "Server configuration error: Gemini API Key is missing." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const messages = await prisma.message.findMany({
      where: { chatId: req.params.id },
      include: { sender: { select: { username: true } } },
      orderBy: { createdAt: 'asc' },
      take: 300
    });

    if (messages.length === 0) {
      return res.json({ summary: "No messages to summarize yet." });
    }

    // Safely format conversation, handling potential null senders (e.g. deleted users)
    const conversation = messages.map(m => {
      const senderName = m.sender ? m.sender.username : 'Unknown User';
      return `${senderName}: ${m.content}`;
    }).join('\n');

    // Define the prompt first (Critical Fix: prompt was missing)
    const prompt = `Summarize this conversation, extract key points, and identify any tasks or decisions made. 
    Format your response as a JSON object with strictly these keys:
    {
      "summary": "a concise paragraph summary",
      "keyPoints": ["point 1", "point 2"],
      "tasks": ["task 1", "task 2"]
    }
    Conversation:
    ${conversation}`;

    // Simplified to use gemini-flash-latest as per API availability
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    console.log(`Generating summary with gemini-1.5-flash...`);

    let responseText;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      responseText = response.text();
    } catch (error) {
      console.error("Gemini 1.5 Flash failed:", error);
      throw error; // Let the main catch block handle it
    }

    if (!responseText) {
      const errorMsg = lastError ? lastError.message : "All AI models failed.";
      throw new Error(`Summarization failed on all models. Last error: ${errorMsg}`);
    }

    console.log("Gemini response generated successfully");

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
      console.warn('AI response was not valid JSON, using raw text:', responseText);
      // Fallback for non-JSON response
      await prisma.chat.update({
        where: { id: req.params.id },
        data: { summary: responseText }
      });
      res.json({ summary: responseText, tasks: [] });
    }
  } catch (error) {
    console.error('Gemini error:', error);
    // Return a clear error message to the client
    res.status(400).json({
      message: error.message || 'AI processing failed.',
      details: error.response?.data || 'No additional details'
    });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.id },
      include: { participants: true }
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.userId === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to delete this chat' });
    }

    // Delete related data first
    // 1. Find all messages to get IDs
    const messages = await prisma.message.findMany({ where: { chatId: req.params.id }, select: { id: true } });
    const messageIds = messages.map(m => m.id);

    // 2. Delete reactions associated with those messages
    if (messageIds.length > 0) {
      await prisma.reaction.deleteMany({ where: { messageId: { in: messageIds } } });
    }

    // 3. Delete tasks associated with the chat
    await prisma.task.deleteMany({ where: { chatId: req.params.id } });

    // 4. Delete messages
    await prisma.message.deleteMany({ where: { chatId: req.params.id } });

    // 5. Delete participants
    await prisma.chatParticipant.deleteMany({ where: { chatId: req.params.id } });

    // 6. Delete the chat
    await prisma.chat.delete({ where: { id: req.params.id } });

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Failed to delete chat' });
  }
});

module.exports = router;