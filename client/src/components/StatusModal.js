import React, { useState, useRef } from 'react';
import api from '../services/api';

const StatusModal = ({ isOpen, onClose, onStatusPosted }) => {
    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMediaFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handlePost = async () => {
        setLoading(true);
        try {
            let mediaUrl = null;
            let type = 'text';

            if (mediaFile) {
                const formData = new FormData();
                formData.append('file', mediaFile);
                const uploadRes = await api.post('/upload', formData);
                mediaUrl = uploadRes.data.url;
                type = 'image';
            }

            const response = await api.post('/status', {
                content,
                type,
                mediaUrl
            });

            onStatusPosted(response.data);
            resetState();
            onClose();
        } catch (error) {
            console.error('Failed to post status:', error);
            alert('Failed to post status');
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setContent('');
        setMediaFile(null);
        setPreviewUrl(null);
    };

    return (
        <div className="modal-overlay" onClick={() => { resetState(); onClose(); }}>
            <div className="glass-card" style={{ borderRadius: '8px', width: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="glass-card-header" style={{ height: 'auto', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid var(--border-default)' }}>
                    <button onClick={() => { resetState(); onClose(); }} className="btn-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path></svg>
                    </button>
                    <h3 style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-main)' }}>Add Status Update</h3>
                </div>

                <div className="glass-card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {previewUrl && (
                        <div style={{ position: 'relative', width: '100%', height: '250px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                            <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            <button className="btn-icon" onClick={() => { setMediaFile(null); setPreviewUrl(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%' }}>
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
                            </button>
                        </div>
                    )}

                    <textarea
                        style={{ width: '100%', border: 'none', fontSize: '16px', padding: '5px', outline: 'none', resize: 'none' }}
                        rows="3"
                        placeholder="Type a status..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    ></textarea>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button className="btn-icon" onClick={() => fileInputRef.current.click()} style={{ color: 'var(--primary-accent)' }}>
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
                            <span style={{ fontSize: '14px', marginLeft: '5px', fontWeight: '500' }}>Add Photo</span>
                        </button>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />

                        <button
                            className="btn-primary-whatsapp"
                            onClick={handlePost}
                            disabled={loading || (!content.trim() && !mediaFile)}
                        >
                            {loading ? 'POSTING...' : 'POST'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusModal;
