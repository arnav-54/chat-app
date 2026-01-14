import React, { useState } from 'react';
import api from '../services/api';

const AISidebar = ({ chat }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(chat.summary || '');

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/chats/${chat.id || chat._id}/summarize`);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-sidebar">
      <div className="ai-sidebar-header">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--primary-accent)"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"></path></svg>
        <span style={{ fontSize: '18px', fontWeight: '700', marginLeft: '12px' }}>AI Insights</span>
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
            {chat.tasks?.length > 0 ? (
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {chat.tasks.map((task, index) => (
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