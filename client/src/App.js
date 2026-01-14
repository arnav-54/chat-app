import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import AISidebar from './components/AISidebar';
import NewChatModal from './components/NewChatModal';
import SettingsModal from './components/SettingsModal';
import socket from './services/socket';
import api from './services/api';

const ChatApp = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (user) {
      socket.emit('join', user.id);
      loadChats();
    }
  }, [user]);

  useEffect(() => {
    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    socket.on('userOnline', (userId) => {
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });

    socket.on('userOffline', (userId) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    socket.on('newMessage', (message) => {
      const chatID = activeChat?.id || activeChat?._id;
      if (chatID === message.chatId) {
        setMessages(prev => {
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev.filter(m => m._id !== message.tempId), message];
        });
      }

      setChats(prev => {
        const chatIndex = prev.findIndex(c => (c.id || c._id) === message.chatId);
        if (chatIndex > -1) {
          const updatedChat = {
            ...prev[chatIndex],
            messages: [message],
            updatedAt: new Date().toISOString()
          };
          const otherChats = prev.filter((_, i) => i !== chatIndex);
          return [updatedChat, ...otherChats];
        }
        return prev;
      });
    });

    socket.on('newChat', (chat) => {
      setChats(prev => {
        if (prev.find(c => (c.id || c._id) === (chat.id || chat._id))) return prev;
        socket.emit('joinChat', chat.id || chat._id);
        return [chat, ...prev];
      });
    });

    return () => {
      socket.off('onlineUsers');
      socket.off('userOnline');
      socket.off('userOffline');
      socket.off('newMessage');
      socket.off('newChat');
    };
  }, [activeChat]);

  const loadChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    const chatId = chat.id || chat._id;
    socket.emit('joinChat', chatId);
    loadMessages(chatId);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
    }
  };

  const handleNewChat = () => {
    setShowNewChatModal(true);
  };

  const handleBack = () => {
    setActiveChat(null);
  };

  const handleChatCreated = (newChat) => {
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat);
    setMessages([]);
  };

  return (
    <div className="app">
      <ChatList
        chats={chats}
        activeChat={activeChat}
        onChatSelect={handleChatSelect}
        onLogout={handleLogout}
        onNewChat={handleNewChat}
        onlineUsers={onlineUsers}
      />

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleChatCreated}
      />

      {activeChat ? (
        <>
          <ChatWindow
            chat={activeChat}
            messages={messages}
            setMessages={setMessages}
            onBack={handleBack}
            onlineUsers={onlineUsers}
          />
          <AISidebar chat={activeChat} />
        </>
      ) : (
        <div className="empty-state-container">
          <div className="empty-state-content">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" width="80" height="80" fill="#8696a0">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.76 4.19 2.04 5.76L3 22l4.24-1.04C8.81 21.24 10.33 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.47 0-2.84-.42-4.01-1.15l-.29-.18-2.5.61.61-2.5-.18-.29C4.92 14.84 4.5 13.47 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z" />
              </svg>
            </div>
            <h1>EchoChat for Web</h1>
            <p>
              Send and receive messages without keeping your phone online.<br />
              Use EchoChat on up to 4 linked devices and 1 phone at the same time.
            </p>
          </div>
          <div className="empty-state-footer">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
            </svg>
            End-to-end encrypted
          </div>
        </div>
      )}
    </div>
  );
};

const AuthWrapper = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return isLogin
      ? <Login switchToRegister={() => setIsLogin(false)} />
      : <Register switchToLogin={() => setIsLogin(true)} />;
  }

  return <ChatApp />;
};

const App = () => {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
};

export default App;