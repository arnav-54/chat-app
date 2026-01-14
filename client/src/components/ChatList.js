import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusModal from './StatusModal';

const ChatList = ({ chats, activeChat, onChatSelect, onLogout, onNewChat }) => {
  const { user, token, login } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activePanel, setActivePanel] = useState(null); // 'profile' or 'status'
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
    const otherParticipant = chat.participants?.find(p => p.user?.id !== user.id);
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
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path></svg>
          </button>
          <h3>Profile</h3>
        </div>
        <div className="panel-content">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0' }}>
            <div className="avatar avatar-large" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => avatarInputRef.current.click()}>
              {user?.avatar ? <img src={user.avatar} alt="Profile" /> : user?.username?.[0]?.toUpperCase()}
              {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>...</div>}
            </div>
            <input type="file" ref={avatarInputRef} style={{ display: 'none' }} onChange={handleAvatarUpload} accept="image/*" />
          </div>

          <div className="profile-info-card">
            <div className="profile-label">Your name</div>
            <div className="profile-value">
              <input value={username} onChange={e => setUsername(e.target.value)} onBlur={handleUpdateProfile} />
            </div>
            <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              This is not your username or pin. This name will be visible to your EchoChat contacts.
            </p>
          </div>

          <div className="profile-info-card">
            <div className="profile-label">About</div>
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
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path></svg>
          </button>
          <h3>Status</h3>
        </div>
        <div className="panel-content" style={{ background: 'white' }}>
          <div className="status-item" onClick={() => setShowStatusModal(true)}>
            <div className="status-circle" style={{ border: 'none' }}>
              <div className="avatar">
                {user?.avatar ? <img src={user.avatar} alt="Me" /> : user?.username?.[0]?.toUpperCase()}
              </div>
            </div>
            <div className="chat-info">
              <div className="chat-name">My Status</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Click to add status update</p>
            </div>
          </div>

          <div className="status-section-title">RECENT UPDATES</div>
          {statuses.map(group => (
            <div key={group.user.id} className="status-item" onClick={() => alert(group.updates[0].content)}>
              <div className="status-circle">
                <img src={group.user.avatar || 'https://via.placeholder.com/150'} alt="avatar" />
              </div>
              <div className="chat-info">
                <div className="chat-name">{group.user.username}</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Today at {new Date(group.updates[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-header">
        <div className="avatar avatar-small" onClick={() => setActivePanel('profile')} style={{ cursor: 'pointer' }}>
          {user?.avatar ? <img src={user.avatar} alt="Me" /> : user?.username?.[0]?.toUpperCase()}
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn-icon" onClick={() => setActivePanel('status')}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 5a7 7 0 1 0 7 7 7 7 0 0 0-7-7zm0 12.5a5.5 5.5 0 1 1 5.5-5.5 5.5 5.5 0 0 1-5.5 5.5z"></path></svg>
          </button>
          <button className="btn-icon" onClick={onNewChat}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.005 3.17a.75.75 0 0 1 .77.724l.005.111v1.907h1.907a.75.75 0 0 1 .111 1.49l-.111.01h-1.907v1.907a.75.75 0 0 1-1.49.111l-.01-.111V7.411h-1.907a.75.75 0 0 1-.111-1.49l.111-.01h1.907V4.004a.75.75 0 0 1 .75-.75z"></path></svg>
          </button>
          <button className="btn-icon" onClick={onLogout}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16 13v-2H7V9l-5 4 5 4v-2h9zM20 3h-9c-1.1 0-2 .9-2 2v4h2V5h9v14h-9v-4H9v4c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>
          </button>
        </div>
      </div>

      <div className="search-wrapper">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#54656f"><path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.2 5.2 0 1 0-5.2 5.2 5.184 5.184 0 0 0 3.386-1.256l.22.219v.636l4.005 3.997 1.192-1.192-3.997-4.005zm-5.212 0c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"></path></svg>
        <input placeholder="Search or start new chat" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="chat-list">
        {filteredChats.map(chat => {
          const chatName = getChatName(chat);
          return (
            <div key={chat._id || chat.id} className={`chat-item ${activeChat?._id === chat._id || activeChat?.id === chat.id ? 'active' : ''}`} onClick={() => onChatSelect(chat)}>
              <div className="avatar">
                {!chat.isGroup ? (
                  chat.participants?.find(p => p.user?.id !== user.id)?.user?.avatar ?
                    <img src={chat.participants.find(p => p.user.id !== user.id).user.avatar} alt="avatar" /> :
                    chatName[0].toUpperCase()
                ) : chat.name[0].toUpperCase()}
              </div>
              <div className="chat-info">
                <div className="chat-header-row">
                  <div className="chat-name">{chatName}</div>
                  {/* Mock Unread Badge ("1 pointing") for non-active chats */}
                  {activeChat?._id !== chat._id && activeChat?.id !== chat.id && (
                    <div className="unread-badge">1</div>
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