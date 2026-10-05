import React, { useState } from 'react';
import { api, setAuthToken, setStoredHospital } from '../api';
import { Hospital, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function HospitalAuth({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [formData, setFormData] = useState({
    hospital_name: '',
    registration_number: '',
    contact_number: '',
    email: '',
    password: '',
    confirm_password: '',
    address: '',
    pincode: '',
    location: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.loginHospital({
        email: loginEmail.trim(),
        password: loginPassword
      });

      if (res.token && res.hospital) {
        setAuthToken(res.token);
        setStoredHospital(res.hospital);
        onAuthSuccess(res.hospital);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Client-side validations
    if (!formData.hospital_name.trim()) {
      setError('Hospital Name cannot be empty.');
      return;
    }
    if (!formData.registration_number.trim()) {
      setError('Hospital Registration Number cannot be empty.');
      return;
    }
    if (!formData.contact_number.trim()) {
      setError('Contact Number cannot be empty.');
      return;
    }
    const phoneDigits = formData.contact_number.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setError('Contact Number must be a valid phone number (7-15 digits).');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email cannot be empty.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Confirm Password does not match Password.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Hospital Address cannot be empty.');
      return;
    }
    if (!formData.pincode.trim()) {
      setError('Pincode cannot be empty.');
      return;
    }
    if (!formData.location.trim()) {
      setError('Location / City cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.registerHospital(formData);

      if (res.token && res.hospital) {
        setAuthToken(res.token);
        setStoredHospital(res.hospital);
        setSuccessMsg('Registration successful! Opening dashboard...');
        setTimeout(() => {
          onAuthSuccess(res.hospital);
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Toggle between Register and Login */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', background: 'var(--slate-100)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, boxShadow: 'none' }}
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            id="auth-toggle-login"
          >
            <LogIn size={16} />
            <span>Hospital Login</span>
          </button>
          <button
            type="button"
            className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, boxShadow: 'none' }}
            onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            id="auth-toggle-register"
          >
            <UserPlus size={16} />
            <span>Register Hospital</span>
          </button>
        </div>

        <div className="auth-header">
          <h2>{mode === 'login' ? 'Hospital Login' : 'Register New Hospital'}</h2>
          <p>
            {mode === 'login'
              ? 'Sign in to manage your verified blood stock and requirements.'
              : 'Register your authorized medical center to connect with seekers.'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert" id="auth-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" role="alert" id="auth-success-alert">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} id="hospital-login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Hospital Email <span className="req">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="hospital@domain.org"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password <span className="req">*</span>
              </label>
              <input
                id="login-password"
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem' }}
              disabled={loading}
              id="hospital-login-submit-btn"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} id="hospital-register-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Hospital Name <span className="req">*</span>
              </label>
              <input
                id="reg-name"
                name="hospital_name"
                type="text"
                className="form-control"
                placeholder="e.g. St. Jude Memorial Hospital"
                value={formData.hospital_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-regnumber">
                  Registration Number <span className="req">*</span>
                </label>
                <input
                  id="reg-regnumber"
                  name="registration_number"
                  type="text"
                  className="form-control"
                  placeholder="e.g. HOSP-AP-2026-90"
                  value={formData.registration_number}
                  onChange={handleInputChange}
                  required
                />
                <div className="form-helper">Must be unique to your facility</div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-contact">
                  Contact Number <span className="req">*</span>
                </label>
                <input
                  id="reg-contact"
                  name="contact_number"
                  type="tel"
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  required
                />
                <div className="form-helper">Users will call this number directly</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email Address <span className="req">*</span>
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                className="form-control"
                placeholder="official@hospital.org"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  Password <span className="req">*</span>
                </label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  className="form-control"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm-password">
                  Confirm Password <span className="req">*</span>
                </label>
                <input
                  id="reg-confirm-password"
                  name="confirm_password"
                  type="password"
                  className="form-control"
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-address">
                Hospital Address <span className="req">*</span>
              </label>
              <textarea
                id="reg-address"
                name="address"
                className="form-control"
                rows="2"
                placeholder="Street address, Medical district, Landmark"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-pincode">
                  Pincode <span className="req">*</span>
                </label>
                <input
                  id="reg-pincode"
                  name="pincode"
                  type="text"
                  className="form-control"
                  placeholder="e.g. 516001"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-location">
                  Location / City <span className="req">*</span>
                </label>
                <input
                  id="reg-location"
                  name="location"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Kadapa"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
              id="hospital-register-submit-btn"
            >
              {loading ? 'Registering Facility...' : 'Complete Hospital Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
