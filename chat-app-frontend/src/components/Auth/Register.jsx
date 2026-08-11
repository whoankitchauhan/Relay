import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AuthThemeToggle from './AuthThemeToggle';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

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

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [formError, setFormError]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const username = formData.username.trim();
    const email = formData.email.trim();
    const { password, confirmPassword } = formData;
    if (!username) {
      setFormError('Please enter a username.');
      return;
    }
    if (username.length < 3) {
      setFormError('Username must be at least 3 characters long.');
      return;
    }
    if (!email) {
      setFormError('Please enter an email address.');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (!confirmPassword) {
      setFormError('Please confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      await register(username, email, password);
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
          Join your team on Relay.
        </h1>
        <p className="auth-brand-sub">
          Create an account and start collaborating in real-time with rooms, reactions, and live presence.
        </p>
        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-dot" />
            Free to use — no credit card required
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-dot" />
            Create public or private rooms
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-dot" />
            Persistent message history
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create an account</h2>
            <p className="auth-form-subtitle">Get started with Relay — it's free</p>
          </div>

          {formError && (
            <div className="error-banner" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                className="form-input"
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={onChange}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                className="form-input"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-password-wrap">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  required
                />
                <button type="button" className="input-password-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Hide' : 'Show'}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
              <div className="input-password-wrap">
                <input
                  className="form-input"
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={onChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />
                <button type="button" className="input-password-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? 'Hide' : 'Show'}>
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-block btn-lg"
              type="submit"
              disabled={isSubmitting}
              style={{ marginTop: '8px' }}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="auth-form-footer">
            Already have an account?
            <Link className="auth-link" to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
