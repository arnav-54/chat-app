# EchoChat - Real-Time Messaging App with Smart Context Memory

A full-stack real-time chat application with AI-powered conversation insights, built with React, Node.js, Socket.IO, and OpenAI.

## Features

### Core Messaging
- ✅ Real-time messaging with Socket.IO
- ✅ Individual and group chats
- ✅ Message reactions (👍, ❤️, 😂)
- ✅ Typing indicators
- ✅ Online/offline status
- ✅ Message timestamps
- 🔄 Media sharing (Cloudinary integration)
- 🔄 Read receipts

### Smart Context Memory (AI Features)
- ✅ Conversation summarization with OpenAI
- ✅ Key points extraction
- ✅ Task identification
- ✅ Chat statistics
- 🔄 Topic timeline analysis
- 🔄 Smart search through conversation history

### Authentication & Profile
- ✅ User registration/login
- ✅ JWT authentication
- ✅ Profile management
- 🔄 Avatar uploads

## Tech Stack

**Frontend:**
- React (JavaScript)
- Socket.IO Client
- Vanilla CSS
- Axios for API calls

**Backend:**
- Node.js with Express
- Socket.IO for real-time communication
- MongoDB with Mongoose
- JWT for authentication
- OpenAI API for Smart Context Memory

**Media & Storage:**
- Cloudinary for file uploads
- MongoDB for data persistence

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- OpenAI API key
- Cloudinary account

### Installation

1. **Clone and install dependencies:**
```bash
cd chat-app
npm run install-all
```

2. **Configure environment variables:**
Edit `server/.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/echochat
JWT_SECRET=your_jwt_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
OPENAI_API_KEY=your_openai_api_key
```

3. **Start the application:**
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

## Usage

1. **Register/Login:** Create an account or login with existing credentials
2. **Start Chatting:** Select or create chats to begin messaging
3. **Real-time Features:** Experience live messaging, typing indicators, and reactions
4. **AI Insights:** Use the Smart Context Memory sidebar to:
   - Generate conversation summaries
   - View extracted key points
   - Track identified tasks
   - See chat statistics

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/summarize` - Generate AI summary

### Upload
- `POST /api/upload` - Upload media files

## Socket Events

### Client to Server
- `join` - User joins the app
- `joinChat` - Join specific chat room
- `sendMessage` - Send new message
- `typing` - User is typing
- `stopTyping` - User stopped typing
- `addReaction` - Add reaction to message

### Server to Client
- `newMessage` - New message received
- `userTyping` - User is typing notification
- `userStoppedTyping` - User stopped typing
- `userOnline` - User came online
- `userOffline` - User went offline
- `reactionAdded` - Reaction added to message

## Project Structure

```
chat-app/
├── server/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   ├── config/          # Database & Cloudinary config
│   └── server.js        # Main server file
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # React context
│   │   ├── services/    # API & Socket services
│   │   └── pages/       # Page components
│   └── public/
└── package.json         # Root package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details