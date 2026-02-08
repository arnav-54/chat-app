import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusModal from './StatusModal';
import StatusViewerModal from './StatusViewerModal';

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
  const [viewingStatus, setViewingStatus] = useState(null);
  const avatarInputRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [activePanel]);

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

  const handleRemoveAvatar = async (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);

    setLoading(true);
    try {
      const res = await api.put('/users/profile', { avatar: '' });
      login(token, res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            <div style={{ position: 'relative' }}>
              <div className="avatar avatar-large" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => avatarInputRef.current.click()}>
                {user?.avatar ? <img src={user.avatar} alt="Profile" /> : user?.username?.[0]?.toUpperCase()}
                {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>...</div>}
              </div>
              {user?.avatar && (
                <>
                  <button
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                    title="Remove Profile Photo"
                    style={{
                      position: 'absolute',
                      bottom: '5px',
                      right: '5px',
                      background: 'var(--danger)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid var(--bg-sidebar)',
                      color: 'white',
                      zIndex: 10,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                      cursor: 'pointer'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                  </button>
                  {showDeleteConfirm && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-50px',
                      right: '-10px',
                      zIndex: 20,
                      background: 'var(--bg-sidebar)',
                      padding: '12px',
                      boxShadow: '0 5px 20px rgba(0,0,0,0.4)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-default)',
                      minWidth: '160px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      animation: 'fadeIn 0.2s ease-out'
                    }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '600' }}>Remove photo?</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          style={{
                            flex: 1,
                            background: 'var(--danger)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                          onClick={handleRemoveAvatar}
                        >
                          Yes
                        </button>
                        <button
                          style={{
                            flex: 1,
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '6px',
                            padding: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <input type="file" ref={avatarInputRef} style={{ display: 'none' }} onChange={handleAvatarUpload} accept="image/*" />
          </div>

          <div className="profile-info-card">
            <div className="profile-label">Your Name</div>
            <div className="profile-value">
              <input value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <p style={{ marginTop: '15px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              This name will be visible to your contacts and inside group chats.
            </p>
          </div>

          <div className="profile-info-card">
            <div className="profile-label">About / Status</div>
            <div className="profile-value">
              <input value={statusText} onChange={e => setStatusText(e.target.value)} />
            </div>
          </div>

          <div style={{ padding: '0 30px' }}>
            <button
              className="btn-primary"
              onClick={handleUpdateProfile}
              disabled={loading}
              style={{ marginTop: '10px' }}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
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
          <div className="status-item" onClick={() => myStatuses.length > 0 ? setViewingStatus({ user, updates: myStatuses }) : setShowStatusModal(true)} style={{ marginBottom: '10px', position: 'relative' }}>
            <div className="status-circle" style={{ border: myStatuses.length > 0 ? '2px solid var(--primary-accent)' : 'none', padding: myStatuses.length > 0 ? '2px' : '0' }}>
              {user?.avatar ? <img src={user.avatar} alt="Me" style={{ borderRadius: '50%' }} /> : user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="chat-info">
              <div className="chat-name">My Status</div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {myStatuses.length > 0
                  ? new Date(myStatuses[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Click to share an update'}
              </p>
            </div>
            {myStatuses.length > 0 && (
              <button
                className="btn-icon"
                onClick={(e) => { e.stopPropagation(); setShowStatusModal(true); }}
                style={{ position: 'absolute', right: '10px', background: 'var(--bg-secondary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Add new status"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--primary-accent)"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
              </button>
            )}
          </div>

          <div className="status-section-title">RECENT UPDATES</div>
          {statuses.length > 0 ? statuses.map(group => (
            <div key={group.user.id} className="status-item" onClick={() => setViewingStatus(group)}>
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
                  <div className="chat-time" style={{ color: unreadCounts[chat._id || chat.id] > 0 ? 'var(--primary-accent)' : 'var(--text-lighter)' }}>
                    {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
                <div className="chat-bottom">
                  <div className="chat-preview">
                    {globalTyping[chat._id || chat.id]?.length > 0 ? (
                      <span style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>typing...</span>
                    ) : (
                      <span style={{ color: unreadCounts[chat._id || chat.id] > 0 ? 'var(--text-main)' : 'var(--text-secondary)', fontWeight: unreadCounts[chat._id || chat.id] > 0 ? '600' : '400' }}>
                        {chat.messages && chat.messages.length > 0 ? (chat.messages[0].type === 'image' ? '📷 Photo' : chat.messages[0].content) : 'Click to start chatting'}
                      </span>
                    )}
                  </div>
                  {unreadCounts[chat._id || chat.id] > 0 && (
                    <div className="unread-badge" style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)' }}>
                      {unreadCounts[chat._id || chat.id]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <StatusModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} onStatusPosted={() => { fetchStatuses(); setShowStatusModal(false); }} />
      <StatusViewerModal isOpen={!!viewingStatus} onClose={() => setViewingStatus(null)} statusGroup={viewingStatus} />
    </div>
  );
};

export default ChatList;