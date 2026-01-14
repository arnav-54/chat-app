import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Register = ({ switchToLogin }) => {
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/register', formData);
      login(response.data.token, response.data.user);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header-strip"></div>
      <div className="auth-card-container">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" width="42" height="42" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.76 4.19 2.04 5.76L3 22l4.24-1.04C8.81 21.24 10.33 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.47 0-2.84-.42-4.01-1.15l-.29-.18-2.5.61.61-2.5-.18-.29C4.92 14.84 4.5 13.47 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"></path>
          </svg>
          <span>ECHOCHAT WEB</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Register</h1>

          {error && (
            <div className="error-message" style={{
              color: 'var(--danger)',
              background: '#fff5f5',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '25px',
              fontSize: '14px',
              border: '1px solid #ffe3e3',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="e.g. john_doe"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="text"
              placeholder="+1 234 567 890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '10px', height: '48px', fontSize: '16px', letterSpacing: '0.5px' }}>
            CREATE ACCOUNT
          </button>

          <p className="auth-footer" style={{ marginTop: '30px', color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
            Already have an account?
            <span
              style={{ color: 'var(--primary-accent)', cursor: 'pointer', fontWeight: '600', marginLeft: '8px' }}
              onClick={switchToLogin}
            >
              Login here
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;