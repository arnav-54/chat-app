require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const prisma = require('./lib/prisma');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.set('io', io);

const activeUsers = new Map();
app.set('activeUsers', activeUsers);

// Serve uploads as static
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/status', require('./routes/status'));

// Serve static assets in production
// API-only mode for separate deployment
app.get('/', (req, res) => {
  res.send('API is running successfully. Please use the frontend URL to access the application.');
});

// Serve static assets in production - DISABLED for separate deployment
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../client/build')));
// 
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
//   });
// }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    activeUsers.set(userId, socket.id);
    // Send the list of current online users to the user who just joined
    socket.emit('onlineUsers', Array.from(activeUsers.keys()));
    // Notify others that this user is now online
    socket.broadcast.emit('userOnline', userId);
  });

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const message = await prisma.message.create({
        data: {
          content: data.content,
          type: data.type || 'text',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          senderId: data.senderId,
          chatId: data.chatId
        },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
          reactions: { include: { user: { select: { id: true, username: true } } } }
        }
      });

      await prisma.chat.update({
        where: { id: data.chatId },
        data: { updatedAt: new Date() }
      });

      io.to(data.chatId).emit('newMessage', message);
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('error', error.message);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('userTyping', { userId: data.userId, username: data.username });
  });

  socket.on('stopTyping', (data) => {
    socket.to(data.chatId).emit('userStoppedTyping', data.userId);
  });

  socket.on('addReaction', async (data) => {
    try {
      await prisma.reaction.upsert({
        where: {
          userId_messageId: {
            userId: data.userId,
            messageId: data.messageId
          }
        },
        update: { emoji: data.emoji },
        create: {
          userId: data.userId,
          messageId: data.messageId,
          emoji: data.emoji
        }
      });

      const reactions = await prisma.reaction.findMany({
        where: { messageId: data.messageId },
        include: { user: { select: { id: true, username: true } } }
      });

      io.to(data.chatId).emit('reactionAdded', { messageId: data.messageId, reactions });
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        socket.broadcast.emit('userOffline', userId);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));