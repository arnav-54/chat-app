import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const NewChatModal = ({ isOpen, onClose, onChatCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isGroupCreation, setIsGroupCreation] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  const handleSearch = (query) => {
    setSearchQuery(query);


    setLoading(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/users/search', { params: { q: query } });
        setSearchResults(response.data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const toggleUserSelection = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleStartChat = async () => {
    if (isGroupCreation && !groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const response = await api.post('/chats', {
        name: isGroupCreation ? groupName : selectedUsers[0].username,
        participants: selectedUsers.map(u => u.id),
        isGroup: isGroupCreation
      });

      onChatCreated(response.data);
      resetModal();
      onClose();
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setIsGroupCreation(false);
    setGroupName('');
  };

  useEffect(() => {
    if (isOpen) {
      if (!isGroupCreation) {

        handleSearch('');
      } else {
        if (searchResults.length === 0) handleSearch('');
      }
    }
  }, [isOpen, isGroupCreation]);

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => { resetModal(); onClose(); }}>
      <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '450px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-card-header" style={{ height: '70px', minHeight: '70px', padding: '0 25px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-default)' }}>
          <button onClick={() => { resetModal(); onClose(); }} className="btn-icon" style={{ marginRight: '15px' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.1 17.2l-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.3-5.3-5.3-1.8 1.8 5.3 5.3-5.3 5.3 1.8 1.8 5.3-5.3 5.3 5.3 1.8-1.8z"></path></svg>
          </button>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)' }}>{isGroupCreation ? 'New Group' : 'New Chat'}</h3>
        </div>

        <div className="glass-card-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {!isGroupCreation && (
            <button
              className="btn-primary"
              style={{ marginBottom: '20px', background: 'var(--bg-input)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'flex-start', border: '1px solid var(--border-default)', boxShadow: 'none' }}
              onClick={() => setIsGroupCreation(true)}
            >
              <div className="avatar" style={{ width: '35px', height: '35px', background: 'var(--primary)' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
              </div>
              New Group Chat
            </button>
          )}

          {isGroupCreation && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Group Name
              </label>
              <input
                type="text"
                className="modern-input"
                placeholder="Ex. Marketing Team"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-main)', outline: 'none' }}
              />
            </div>
          )}

          {isGroupCreation && selectedUsers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
              {selectedUsers.map(u => (
                <div key={u.id} style={{ background: 'var(--primary-accent)', color: 'white', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {u.username}
                  <span onClick={() => handleRemoveUser(u.id)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>×</span>
                </div>
              ))}
            </div>
          )}

          <div className="search-wrapper" style={{ marginBottom: '15px', background: 'var(--bg-input)', padding: '0 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', height: '45px', border: '1px solid var(--border-default)' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--text-secondary)"><path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.2 5.2 0 1 0-5.2 5.2 5.184 5.184 0 0 0 3.386-1.256l.22.219v.636l4.005 3.997 1.192-1.192-3.997-4.005zm-5.212 0c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"></path></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={isGroupCreation ? "Search people to add..." : "Search people..."}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', marginLeft: '10px', width: '100%', outline: 'none' }}
            />
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--primary)', fontSize: '14px' }}>Loading...</div>
            )}

            {!loading && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>No users found.</div>
            )}

            {!loading && searchResults.map(userResult => {
              const isSelected = selectedUsers.find(u => u.id === userResult.id);
              return (
                <div key={userResult.id} className="chat-item" style={{ height: '60px', padding: '10px', borderRadius: '10px', background: isSelected ? 'var(--active-list-item)' : 'transparent' }} onClick={() => {
                  if (isGroupCreation) {
                    toggleUserSelection(userResult);
                  } else {
                    setLoading(true);
                    api.post('/chats', { name: userResult.username, participants: [userResult.id], isGroup: false })
                      .then(res => {
                        onChatCreated(res.data);
                        onClose();
                      })
                      .catch(e => {
                        console.error('Failed to create chat:', e);
                        setLoading(false);
                      });
                  }
                }}>
                  <div className="avatar avatar-small">
                    {userResult.avatar ? <img src={userResult.avatar} alt="avatar" /> : (userResult.username && userResult.username[0] ? userResult.username[0].toUpperCase() : '?')}
                    {isSelected && (
                      <div className="online-dot" style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--bg-sidebar)' }}>
                        <svg viewBox="0 0 24 24" width="8" height="8" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>
                      </div>
                    )}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name" style={{ fontSize: '15px' }}>{userResult.username || 'Unknown'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{userResult.email || userResult.status || 'Available'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {isGroupCreation && (
          <div style={{ padding: '20px', background: 'var(--bg-panel)', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-default)' }}>
            <button
              className="btn-primary"
              style={{ width: '100%', height: '45px', opacity: (groupName && selectedUsers.length > 0) ? 1 : 0.5, cursor: (groupName && selectedUsers.length > 0) ? 'pointer' : 'not-allowed' }}
              onClick={handleStartChat}
              disabled={loading || !groupName || selectedUsers.length === 0}
            >
              {loading ? 'Creating...' : `Create Group (${selectedUsers.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewChatModal;