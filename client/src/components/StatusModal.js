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
        if (!content.trim() && !mediaFile) return;
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
            <div className="glass-card" onClick={e => e.stopPropagation()}>
                <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>Update Status</h3>
                        <button onClick={() => { resetState(); onClose(); }} className="btn-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
                        </button>
                    </div>

                    {previewUrl ? (
                        <div style={{ position: 'relative', width: '100%', borderRadius: '15px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                            <img src={previewUrl} alt="preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
                            <button className="btn-icon" onClick={() => { setMediaFile(null); setPreviewUrl(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
                            </button>
                        </div>
                    ) : (
                        <div onClick={() => fileInputRef.current.click()} style={{ width: '100%', height: '120px', borderRadius: '15px', border: '2px dashed var(--border-default)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', gap: '10px' }}>
                            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>Add Photo/Video</span>
                        </div>
                    )}

                    <textarea
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-default)', borderRadius: '12px', color: 'white', fontSize: '15px', padding: '15px', outline: 'none', resize: 'none' }}
                        rows="4"
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    ></textarea>

                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*,video/*" />

                    <button
                        className="btn-primary"
                        onClick={handlePost}
                        disabled={loading || (!content.trim() && !mediaFile)}
                        style={{ marginTop: '0' }}
                    >
                        {loading ? 'Posting...' : 'Share Status'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusModal;
