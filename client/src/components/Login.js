import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = ({ switchToRegister }) => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', formData);
      login(response.data.token, response.data.user);
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card-container">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="var(--primary-accent)">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.76 4.19 2.04 5.76L3 22l4.24-1.04C8.81 21.24 10.33 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.47 0-2.84-.42-4.01-1.15l-.29-.18-2.5.61.61-2.5-.18-.29C4.92 14.84 4.5 13.47 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"></path>
          </svg>
          <span>ECHOCHAT</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Welcome Back</h1>
          <p className="subtitle">Please enter your credentials to log in.</p>

          {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

          <div className="form-group">
            <label htmlFor="identifier">EMAIL OR PHONE</label>
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
            <label htmlFor="password">PASSWORD</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--text-secondary)">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--text-secondary)">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 3.1 0 5.9-1.39 7.84-3.61l2.58 2.58 1.41-1.41L3.41 2.86 2 4.27zm3.1 3.1l2.55 2.55C7.24 10.35 7 11.13 7 12c0 2.76 2.24 5 5 5 1.16 0 2.22-.44 3.03-1.18l2.09 2.09c-1.45.69-3.04 1.09-4.72 1.09-4.35 0-8.23-2.67-10.14-6.43.91-1.85 2.16-3.41 3.74-4.5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="auth-footer">
            Don't have an account?
            <button type="button" onClick={switchToRegister}>Create account</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;