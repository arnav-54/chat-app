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
        <svg viewBox="0 0 24 24" width="22" height="22" fill="var(--primary)"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"></path></svg>
        <span style={{ fontSize: '16px', fontWeight: '500', marginLeft: '12px' }}>AI Context</span>
      </div>

      <div className="ai-content" style={{ overflowY: 'auto', flex: 1 }}>
        <div className="ai-card">
          <h4>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--primary-accent)"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"></path></svg>
            Smart Summary
          </h4>
          <div className="ai-summary-text">
            {summary || 'No summary available. Generate one to see chat insights.'}
          </div>
          <button
            onClick={handleSummarize}
            className="btn-primary"
            style={{ marginTop: '15px', width: '100%', fontSize: '12px', padding: '10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>

        <div className="ai-card">
          <h4>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--primary-accent)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>
            Key Actions
          </h4>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            {chat.tasks?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {chat.tasks.map((task, index) => (
                  <div key={index} style={{ padding: '8px 12px', background: 'white', borderRadius: '6px', border: '1px solid var(--border-default)', display: 'flex', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>•</span>
                    {task.text}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                AI will detect tasks automatically during analysis.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISidebar;