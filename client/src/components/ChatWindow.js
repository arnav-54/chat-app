import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';
import api from '../services/api';

const ChatWindow = ({ chat, messages, setMessages, onBack }) => {
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

    // Optimistic Update
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
    return chat.participants?.find(p => p.user?.id !== user.id)?.user;
  };

  const getChatName = () => {
    if (chat.isGroup) return chat.name;
    return getOtherUser()?.username || 'Unknown User';
  };

  const isOnline = () => {
    if (chat.isGroup) return false;
    return getOtherUser()?.isOnline;
  };

  return (
    <div className="main-chat" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="chat-header">
        <button className="btn-icon" onClick={onBack} style={{ marginRight: '10px' }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
        </button>
        <div className="avatar">
          {chat.isGroup ? chat.name[0].toUpperCase() : (getOtherUser()?.avatar ? <img src={getOtherUser().avatar} alt="avatar" /> : getChatName()[0].toUpperCase())}
        </div>
        <div className="chat-info" style={{ marginLeft: '15px' }}>
          <div className="chat-name">{getChatName()}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {chat.isGroup
              ? `${chat.participants?.length} members`
              : (isOnline() ? <span style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>online</span> : 'offline')}
          </div>
        </div>
      </div>

      <div className="messages-container" onClick={() => setShowEmojiPicker(false)}>
        {messages.map(message => (
          <div key={message._id || message.id} className={`message ${message.sender?.id === user.id ? 'own' : 'other'}`}>
            {message.sender?.id !== user.id && chat.isGroup && (
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-accent)', marginBottom: '4px' }}>
                {message.sender?.username}
              </div>
            )}

            <div className="message-content">
              {message.type === 'image' ? (
                <img src={message.fileUrl} alt="sent" style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(message.fileUrl)} />
              ) : message.type === 'file' ? (
                <a href={message.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"></path></svg>
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
          <div style={{ color: 'var(--primary-accent)', fontSize: '13px', fontStyle: 'italic', paddingLeft: '10px' }}>
            {typing.map(t => t.username).join(', ')} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <button type="button" className="btn-icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path></svg>
        </button>
        <button type="button" className="btn-icon" onClick={() => fileInputRef.current.click()}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.47 1.647 3.971 1.647a5.58 5.58 0 0 0 3.972-1.647l9.547-9.547a4.347 4.347 0 0 0-6.149-6.149l-9.547 9.547c-.521.521-.808 1.213-.808 1.948s.287 1.427.808 1.948c.521.521 1.214.807 1.948.807s1.427-.286 1.948-.807l7.424-7.424a.75.75 0 0 1 1.06 1.06l-7.424 7.424c-1.104 1.104-2.573 1.712-4.132 1.712s-3.028-.608-4.132-1.712c-1.104-1.104-1.712-2.573-1.712-4.132s.608-3.028 1.712-4.132l9.547-9.547a5.847 5.847 0 0 1 8.269 8.269l-9.547 9.547c-1.408 1.408-3.28 2.183-5.271 2.183s-3.863-.775-5.271-2.183l0-0.002z"></path></svg>
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

        <div className="input-wrapper">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Search or send a message"
            onBlur={handleStopTyping}
            onClick={() => setShowEmojiPicker(false)}
          />
        </div>

        <button type="submit" className="btn-send" disabled={uploading} style={{
          background: 'var(--primary-gradient)',
          color: 'white',
          border: 'none',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s',
          marginLeft: '4px'
        }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style={{ transform: 'translateX(2px)' }}>
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
          </svg>
        </button>
      </form>

      {showEmojiPicker && (
        <div style={{ position: 'absolute', bottom: '80px', left: '25px', zIndex: 100 }}>
          <EmojiPicker onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;