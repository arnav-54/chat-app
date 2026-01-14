import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SettingsModal = ({ isOpen, onClose }) => {
    const { user, token, login } = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [status, setStatus] = useState(user?.status || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setUsername(user.username || '');
            setStatus(user.status || '');
            setPhone(user.phone || '');
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload', formData);
            const profileRes = await api.put('/users/profile', { avatar: response.data.url });
            login(token, profileRes.data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Avatar upload failed:', error);
            alert('Failed to upload avatar');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!username.trim()) return alert('Username is required');
        setLoading(true);
        try {
            const response = await api.put('/users/profile', { username, status, phone });
            login(token, response.data);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Update profile failed:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update profile';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-card" onClick={e => e.stopPropagation()}>
                <div className="glass-card-header">
                    <button onClick={onClose} className="btn-icon" style={{ color: 'white' }}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path></svg>
                    </button>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '500' }}>Profile</h3>
                </div>

                <div className="glass-card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                        <input
                            type="file"
                            id="avatarInput"
                            style={{ display: 'none' }}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                        />
                        <div className="avatar" style={{ width: '150px', height: '150px', cursor: 'pointer', fontSize: '3rem' }} onClick={() => document.getElementById('avatarInput').click()}>
                            {user?.avatar ? <img src={user.avatar} alt="Profile" /> : user?.username?.[0]?.toUpperCase()}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '10px 0', fontSize: '10px', textAlign: 'center', fontWeight: '600' }}>
                                CHANGE PHOTO
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Your Name</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your name"
                        />
                        <p style={{ fontSize: '12px', color: 'var(--text-lighter)', marginTop: '8px' }}>
                            This name will be visible to your contacts.
                        </p>
                    </div>

                    <div className="form-group">
                        <label>About</label>
                        <input
                            type="text"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            placeholder="Available"
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 234 567 890"
                        />
                    </div>

                    {success && <div style={{ color: 'var(--primary)', textAlign: 'center', margin: '20px 0', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>
                        Profile Saved!
                    </div>}

                    <div style={{ marginTop: '40px' }}>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', height: '45px' }}
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'SAVING...' : 'SAVE SETTINGS'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
