import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = ({ switchToRegister }) => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', formData);
      login(response.data.token, response.data.user);
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
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
          <h1>Login</h1>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="identifier">Email or Phone</label>
            <input
              id="identifier"
              type="text"
              placeholder="Enter your email or phone"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-primary-whatsapp">
            LOG IN
          </button>

          <p className="auth-footer">
            Don't have an account?
            <button type="button" onClick={switchToRegister}>Register now</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;