import React, { useState } from 'react';
import api from '../services/api';

const AISidebar = ({ chat, isOpen, onClose }) => {
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

  return (
    <div className={`ai-sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="ai-sidebar-header">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--primary-accent)"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"></path></svg>
        <span style={{ fontSize: '18px', fontWeight: '700', marginLeft: '12px', flex: 1 }}>AI Insights</span>
        <button onClick={onClose} className="btn-icon mobile-only" style={{ padding: '5px' }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
        </button>
      </div>

      <div className="ai-content">
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
      </div>
    </div>
  );
};

export default AISidebar;