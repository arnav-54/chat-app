import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusModal from './StatusModal';

const ChatList = ({ chats, activeChat, onChatSelect, onLogout, onNewChat, onlineUsers, unreadCounts, globalTyping, theme, toggleTheme }) => {
  const { user, token, login } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activePanel, setActivePanel] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  const [username, setUsername] = useState(user?.username || '');
  const [statusText, setStatusText] = useState(user?.status || '');
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (activePanel === 'status') {
      fetchStatuses();
    }
  }, [activePanel]);

  const fetchStatuses = async () => {
    try {
      const [othersRes, myRes] = await Promise.all([
        api.get('/status'),
        api.get('/status/my')
      ]);
      setStatuses(othersRes.data);
      setMyStatuses(myRes.data);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const res = await api.put('/users/profile', { username, status: statusText });
      login(token, res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      const uploadRes = await api.post('/upload', formData);
      const profileRes = await api.put('/users/profile', { avatar: uploadRes.data.url });
      login(token, profileRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getChatName = (chat) => {
    if (chat.isGroup) return chat.name;
    const otherParticipant = chat.participants?.find(p => (p.user?.id || p.user?._id) !== user.id);
    return otherParticipant?.user?.username || 'Unknown User';
  };

  const filteredChats = chats.filter(chat =>
    getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sidebar">
      {/* Profile Panel */}
      <div className={`sidebar-panel ${activePanel === 'profile' ? 'active' : ''}`}>
        <div className="panel-header">
          <button className="btn-icon" onClick={() => setActivePanel(null)} style={{ color: 'white' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
          </button>
          <h3>Profile</h3>
        </div>
        <div className="panel-content">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0' }}>
            <div className="avatar avatar-large" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => avatarInputRef.current.click()}>
              {user?.avatar ? <img src={user.avatar} alt="Profile" /> : user?.username?.[0]?.toUpperCase()}
              {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>...</div>}
            </div>
            <input type="file" ref={avatarInputRef} style={{ display: 'none' }} onChange={handleAvatarUpload} accept="image/*" />
          </div>

          <div className="profile-info-card">
            <div className="profile-label">Your Name</div>
            <div className="profile-value">
              <input value={username} onChange={e => setUsername(e.target.value)} onBlur={handleUpdateProfile} />
            </div>
            <p style={{ marginTop: '15px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              This name will be visible to your contacts and inside group chats.
            </p>
          </div>

          <div className="profile-info-card">
            <div className="profile-label">About / Status</div>
            <div className="profile-value">
              <input value={statusText} onChange={e => setStatusText(e.target.value)} onBlur={handleUpdateProfile} />
            </div>
          </div>
        </div>
      </div>

      {/* Status Panel */}
      <div className={`sidebar-panel ${activePanel === 'status' ? 'active' : ''}`}>
        <div className="panel-header">
          <button className="btn-icon" onClick={() => setActivePanel(null)} style={{ color: 'white' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
          </button>
          <h3>Updates</h3>
        </div>
        <div className="panel-content">
          <div className="status-item" onClick={() => setShowStatusModal(true)} style={{ marginBottom: '10px' }}>
            <div className="status-circle">
              {user?.avatar ? <img src={user.avatar} alt="Me" /> : user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="chat-info">
              <div className="chat-name">My Status</div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Click to share an update</p>
            </div>
          </div>

          <div className="status-section-title">RECENT UPDATES</div>
          {statuses.length > 0 ? statuses.map(group => (
            <div key={group.user.id} className="status-item" onClick={() => alert(group.updates[0].content)}>
              <div className="status-circle">
                <img src={group.user.avatar || 'https://via.placeholder.com/150'} alt="avatar" />
              </div>
              <div className="chat-info">
                <div className="chat-name" style={{ color: 'white' }}>{group.user.username}</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {new Date(group.updates[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-lighter)', fontSize: '14px' }}>
              No recent updates from contacts.
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-header">
        <div className="avatar avatar-small" onClick={() => setActivePanel('profile')} style={{ cursor: 'pointer' }}>
          {user?.avatar ? <img src={user.avatar} alt="Me" /> : user?.username?.[0]?.toUpperCase()}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-icon" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"></path></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"></path></svg>
            )}
          </button>
          <button className="btn-icon" onClick={() => setActivePanel('status')} title="Status">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path><path d="M12.5 7h-1v6l5.25 3.15.75-1.23-4.5-2.67z"></path></svg>
          </button>
          <button className="btn-icon" onClick={onNewChat} title="New Chat">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
          </button>
          <button className="btn-icon" onClick={onLogout} title="Logout">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>
          </button>
        </div>
      </div>

      <div className="search-wrapper">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--text-lighter)"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
        <input placeholder="Search or start new chat" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="chats-list">
        {filteredChats.map(chat => {
          const chatName = getChatName(chat);
          const otherUser = chat.isGroup ? null : chat.participants?.find(p => (p.user?.id || p.user?._id) !== user.id)?.user;
          const isUserOnline = otherUser && (onlineUsers.includes(otherUser.id) || onlineUsers.includes(otherUser._id));

          return (
            <div key={chat._id || chat.id} className={`chat-item ${(activeChat?._id || activeChat?.id) === (chat.id || chat._id) ? 'active' : ''}`} onClick={() => onChatSelect(chat)}>
              <div className="avatar">
                {!chat.isGroup ? (
                  otherUser?.avatar ?
                    <img src={otherUser.avatar} alt="avatar" /> :
                    chatName[0].toUpperCase()
                ) : chat.name[0].toUpperCase()}
                {isUserOnline && <div className="online-indicator"></div>}
              </div>
              <div className="chat-details">
                <div className="chat-top">
                  <div className="chat-name">{chatName}</div>
                  <div className="chat-time">
                    {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
                <div className="chat-bottom">
                  <div className="chat-preview">
                    {globalTyping[chat._id || chat.id]?.length > 0 ? (
                      <span style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>typing...</span>
                    ) : (
                      chat.messages && chat.messages.length > 0 ? chat.messages[0].content : 'Click to start chatting'
                    )}
                  </div>
                  {unreadCounts[chat._id || chat.id] > 0 && (
                    <div className="unread-badge">{unreadCounts[chat._id || chat.id]}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <StatusModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} onStatusPosted={() => { fetchStatuses(); setShowStatusModal(false); }} />
    </div>
  );
};

export default ChatList;