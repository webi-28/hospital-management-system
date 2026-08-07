import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Login = () => {
  const { login } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required.';
    if (!form.password) e.password = 'Password is required.';
    return e;
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Login failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-icon">🏥</span>
          <h1>Hospital Management System</h1>
          <p>Streamlining healthcare operations with technology</p>
        </div>
        <div className="auth-features">
          {['Manage patient records securely','Book & track appointments','Role-based access control','Real-time billing & reports'].map((f) => (
            <div key={f} className="auth-feature-item">
              <span className="auth-feature-check">✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <button className="btn-icon theme-toggle-auth" onClick={toggleTheme} title="Toggle theme">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          {errors.general && <div className="alert alert-danger">{errors.general}</div>}

          {/* Demo credentials */}
          <div className="demo-creds">
            <strong>Demo credentials:</strong>
            <div>Admin: admin@hospital.com / Admin@123</div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className={`input-wrapper ${errors.email ? 'input-error' : ''}`}>
                <FiMail className="input-icon" />
                <input
                  id="email" name="email" type="email"
                  value={form.email} onChange={handleChange}
                  placeholder="doctor@hospital.com"
                  autoComplete="email" autoFocus
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className={`input-wrapper ${errors.password ? 'input-error' : ''}`}>
                <FiLock className="input-icon" />
                <input
                  id="password" name="password"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" className="btn-icon input-suffix"
                  onClick={() => setShowPwd((p) => !p)} aria-label="Toggle password visibility">
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="link-primary">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
