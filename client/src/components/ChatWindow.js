import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';
import api from '../services/api';

const ChatWindow = ({ chat, messages, setMessages, onBack, onlineUsers }) => {
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    socket.on('userTyping', ({ userId, username }) => {
      if (userId !== user.id) {
        setTyping(prev => [...prev.filter(u => u.id !== userId), { id: userId, username }]);
      }
    });

    socket.on('userStoppedTyping', (userId) => {
      setTyping(prev => prev.filter(u => u.id !== userId));
    });

    return () => {
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [user.id]);

  const handleSendMessage = (e, content = newMessage, type = 'text', fileData = null) => {
    if (e) e.preventDefault();
    if (!content.trim() && !fileData) return;

    const messageData = {
      senderId: user.id,
      chatId: chat.id || chat._id,
      content: content,
      type: type,
      fileUrl: fileData?.url,
      fileName: fileData?.name
    };

    const tempId = Date.now().toString();
    const tempMessage = {
      _id: tempId,
      content: content,
      type: type,
      fileUrl: fileData?.url,
      fileName: fileData?.name,
      sender: { id: user.id, username: user.username, avatar: user.avatar },
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);
    socket.emit('sendMessage', messageData);
    setNewMessage('');
    handleStopTyping();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData);
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      handleSendMessage(null, file.name, type, { url: response.data.url, name: file.name });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { chatId: chat.id || chat._id, userId: user.id, username: user.username });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socket.emit('stopTyping', { chatId: chat.id || chat._id, userId: user.id });
    }
  };

  const getOtherUser = () => {
    if (chat.isGroup) return null;
    const otherParticipant = chat.participants?.find(p => (p.user?.id || p.user?._id) !== user.id);
    return otherParticipant?.user;
  };

  const getChatName = () => {
    if (chat.isGroup) return chat.name;
    return getOtherUser()?.username || 'Unknown User';
  };

  const isOnline = () => {
    if (chat.isGroup) return false;
    const otherUser = getOtherUser();
    if (!otherUser) return false;
    return onlineUsers.includes(otherUser.id) || onlineUsers.includes(otherUser._id);
  };


  return (
    <div className="main-chat">
      <div className="chat-header">
        <button className="btn-icon" onClick={onBack} style={{ marginRight: '15px' }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
        </button>
        <div className="avatar">
          {chat.isGroup ? chat.name[0].toUpperCase() : (getOtherUser()?.avatar ? <img src={getOtherUser().avatar} alt="avatar" /> : getChatName()[0].toUpperCase())}
          {isOnline() && <div className="online-indicator"></div>}
        </div>
        <div className="chat-info">
          <div className="chat-name">{getChatName()}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {chat.isGroup
              ? `${chat.participants?.length} members`
              : (isOnline() ? <span style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>online</span> : 'last seen recently')}
          </div>
        </div>
      </div>

      <div className="messages-container" onClick={() => setShowEmojiPicker(false)}>
        {messages.map(message => (
          <div key={message._id || message.id} className={`message ${message.sender?.id === user.id ? 'own' : 'other'}`}>
            {message.sender?.id !== user.id && chat.isGroup && (
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-accent)', marginBottom: '4px' }}>
                {message.sender?.username}
              </div>
            )}

            <div className="message-content">
              {message.type === 'image' ? (
                <img src={message.fileUrl} alt="sent" style={{ maxWidth: '100%', borderRadius: '12px', cursor: 'pointer', display: 'block' }} onClick={() => window.open(message.fileUrl)} />
              ) : message.type === 'file' ? (
                <a href={message.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'inherit', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--primary-accent)"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"></path></svg>
                  <span>{message.fileName || 'Attachment'}</span>
                </a>
              ) : (
                <div>{message.content}</div>
              )}
            </div>

            <span className="message-time">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {typing.length > 0 && (
          <div className="typing-indicator" style={{ marginLeft: '10px' }}>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <span className="typing-text">{typing.map(t => t.username).join(', ')} is typing</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <button type="button" className="btn-icon-chat" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path></svg>
        </button>
        <button type="button" className="btn-icon-chat" onClick={() => fileInputRef.current.click()}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M21.58 13.91l-9.85 9.85c-.39.39-1.03.39-1.42 0L.46 13.91c-.39-.39-.39-1.03 0-1.42L10.31 2.64c.39-.39 1.03-.39 1.42 0l9.85 9.85c.39.39.39 1.03 0 1.42zM11 7v10l5-5-5-5z"></path></svg>
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

        <div className="input-wrapper">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            onBlur={handleStopTyping}
            onClick={() => setShowEmojiPicker(false)}
          />
        </div>

        <button type="submit" className="btn-icon-chat" disabled={uploading} style={{ background: 'var(--primary-accent)', color: 'white', padding: '12px' }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </form>

      {showEmojiPicker && (
        <div style={{ position: 'absolute', bottom: '80px', left: '25px', zIndex: 100 }}>
          <EmojiPicker theme="dark" onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;