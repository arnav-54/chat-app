import React, { useState, useEffect } from 'react';

const StatusViewerModal = ({ isOpen, onClose, statusGroup }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
        }
    }, [isOpen, statusGroup]);

    if (!isOpen || !statusGroup) return null;

    const statuses = statusGroup.updates || [];
    const currentStatus = statuses[currentIndex];

    // Safety check
    if (!currentStatus) return null;

    const handleNext = (e) => {
        e.stopPropagation();
        if (currentIndex < statuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const isImage = currentStatus.type === 'image' || (currentStatus.mediaUrl && !currentStatus.mediaUrl.endsWith('.mp4')); // Simple check, better to rely on type
    const isVideo = currentStatus.type === 'video' || (currentStatus.mediaUrl && currentStatus.mediaUrl.endsWith('.mp4'));

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            backgroundColor: 'black',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="status-viewer-container" onClick={e => e.stopPropagation()} style={{
                width: '100%',
                height: '100%',
                maxWidth: '450px',
                position: 'relative',
                backgroundColor: '#000',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Progress Bars */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '0',
                    width: '100%',
                    padding: '0 10px',
                    display: 'flex',
                    gap: '5px',
                    zIndex: 10
                }}>
                    {statuses.map((_, idx) => (
                        <div key={idx} style={{
                            flex: 1,
                            height: '2px',
                            background: idx < currentIndex ? 'white' : (idx === currentIndex ? 'white' : 'rgba(255,255,255,0.3)'),
                            borderRadius: '2px'
                        }}></div>
                    ))}
                </div>

                {/* Header (User Info) */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    zIndex: 10,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                    <div className="avatar avatar-small" style={{ width: '40px', height: '40px', border: 'none' }}>
                        {statusGroup.user.avatar ?
                            <img src={statusGroup.user.avatar} alt="avatar" /> :
                            statusGroup.user.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div style={{ color: 'white', fontWeight: '600' }}>{statusGroup.user.username}</div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                            {new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <button className="btn-icon" onClick={onClose} style={{
                    position: 'absolute',
                    top: '20px',
                    right: '10px',
                    zIndex: 20,
                    color: 'white'
                }}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
                </button>

                {/* Content */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#000',
                    position: 'relative'
                }}>
                    {/* Navigation Click Areas using transparent divs */}
                    <div style={{ position: 'absolute', left: 0, top: 0, width: '30%', height: '100%', zIndex: 5 }} onClick={handlePrev}></div>
                    <div style={{ position: 'absolute', right: 0, top: 0, width: '30%', height: '100%', zIndex: 5 }} onClick={handleNext}></div>

                    {currentStatus.mediaUrl ? (
                        currentStatus.type === 'video' ? (
                            <video
                                src={currentStatus.mediaUrl}
                                autoPlay
                                controls={false}
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                            />
                        ) : (
                            <img
                                src={currentStatus.mediaUrl}
                                alt="status"
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                        )
                    ) : (
                        <div style={{
                            padding: '40px',
                            textAlign: 'center',
                            color: 'white',
                            fontSize: '24px',
                            fontWeight: '600',
                            maxWidth: '80%'
                        }}>
                            {currentStatus.content}
                        </div>
                    )}
                </div>

                {/* Caption if media has content text */}
                {currentStatus.mediaUrl && currentStatus.content && (
                    <div style={{
                        position: 'absolute',
                        bottom: '50px',
                        left: 0,
                        width: '100%',
                        textAlign: 'center',
                        color: 'white',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)'
                    }}>
                        {currentStatus.content}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusViewerModal;
