import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AuthThemeToggle from './AuthThemeToggle';

// Eye icons (inline SVG — no dependency)
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const Login = () => {
  const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const usernameOrEmail = formData.usernameOrEmail.trim();
    if (!usernameOrEmail) {
      setFormError('Please enter your username or email address.');
      return;
    }
    if (!formData.password) {
      setFormError('Please enter your password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(usernameOrEmail, formData.password);
      navigate('/chat');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthThemeToggle />
      {/* Left — brand panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <div className="auth-brand-icon-wrap">⚡</div>
          <span className="auth-brand-wordmark">Relay</span>
        </div>
        <h1 className="auth-brand-headline">
          Real-time conversations,<br />built for your team.
        </h1>
        <p className="auth-brand-sub">
          Relay brings your conversations together in rooms — with live presence, reactions, and message history.
        </p>
        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-dot" />
            Real-time messaging with Socket.io
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-dot" />
            Public and private chat rooms
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-dot" />
            Live presence and typing indicators
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-dot" />
            Message reactions and history
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">Sign in to your Relay account</p>
          </div>

          {formError && (
            <div className="error-banner" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="usernameOrEmail">
                Username or Email
              </label>
              <input
                className="form-input"
                type="text"
                id="usernameOrEmail"
                name="usernameOrEmail"
                value={formData.usernameOrEmail}
                onChange={onChange}
                placeholder="Enter your username or email"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-password-wrap">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-password-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-block btn-lg"
              type="submit"
              disabled={isSubmitting}
              style={{ marginTop: '8px' }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-form-footer">
            Don't have an account?
            <Link className="auth-link" to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
