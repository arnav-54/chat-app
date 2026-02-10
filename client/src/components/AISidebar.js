import React, { useState } from 'react';
import api from '../services/api';

const AISidebar = ({ chat, messages, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('ai');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(chat.summary || '');
  const [tasks, setTasks] = useState(chat.tasks || []);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/chats/${chat.id || chat._id}/summarize`);
      setSummary(response.data.summary);
      if (response.data.tasks) {
        setTasks(response.data.tasks.map(t => typeof t === 'string' ? { text: t } : t));
      }
    } catch (error) {
      console.error('Summarization failed:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to generate summary.';
      const friendlyMsg = msg.includes('404') ? 'Model not found for this API key. Trying a standard model...' : msg;
      setSummary(`Error: ${friendlyMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const mediaMessages = messages?.filter(m => m.type === 'image' || m.type === 'video') || [];

  return (
    <div className={`ai-sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="ai-sidebar-header">
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => setActiveTab('ai')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'ai' ? 'var(--primary-accent)' : 'var(--text-secondary)',
              fontWeight: 700,
              padding: '10px 0',
              borderBottom: activeTab === 'ai' ? '2px solid var(--primary-accent)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            AI Insights
          </button>
          <button
            onClick={() => setActiveTab('media')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'media' ? 'var(--primary-accent)' : 'var(--text-secondary)',
              fontWeight: 700,
              padding: '10px 0',
              borderBottom: activeTab === 'media' ? '2px solid var(--primary-accent)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Media
          </button>
        </div>
        <button onClick={onClose} className="btn-icon mobile-only" style={{ padding: '5px', marginLeft: 'auto' }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
        </button>
      </div>

      <div className="ai-content">
        {activeTab === 'ai' ? (
          <>
            <div className="ai-card">
              <h4>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"></path></svg>
                Smart Summary
              </h4>
              <div className="ai-summary-text">
                {summary || 'Analyze your chat to get a smart summary of your conversation highlights.'}
              </div>
              <button
                onClick={handleSummarize}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Generate Summary'}
              </button>
            </div>

            <div className="ai-card">
              <h4>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>
                Action Items
              </h4>
              <div className="ai-summary-text">
                {tasks?.length > 0 ? (
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {tasks.map((task, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>{task.text}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontStyle: 'italic', color: 'var(--text-lighter)' }}>
                    No tasks detected yet.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '15px' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '15px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>
              Shared Media ({mediaMessages.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {mediaMessages.length > 0 ? (
                mediaMessages.map((msg, i) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border-default)' }} onClick={() => window.open(msg.fileUrl)}>
                    {msg.type === 'image' ? (
                      <img src={msg.fileUrl} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-sidebar-header)' }}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--text-secondary)"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"></path></svg>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-lighter)' }}>
                  No media shared yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISidebar;