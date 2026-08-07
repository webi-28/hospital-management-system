import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import doctorService from '../../services/doctorService';

const ROLES = [
  { value: 'patient', label: '🧑 Patient' },
  { value: 'doctor',  label: '👨‍⚕️ Doctor'  },
];

const Register = () => {
  const { register } = useAuth();
  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    role: 'patient', phone: '',
    // Patient fields
    date_of_birth: '', gender: '', blood_group: '', address: '',
    // Doctor fields
    specialization: '', qualification: '', experience_years: '',
    consultation_fee: '', department_id: '',
  });
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [departments, setDepts] = useState([]);

  useEffect(() => {
    doctorService.getDepartments()
      .then(({ data }) => setDepts(data.data || []))
      .catch(() => {});
  }, []);

  const set = (field, val) => {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.full_name.trim())   e.full_name = 'Full name is required.';
    if (!form.email)               e.email     = 'Email is required.';
    if (form.password.length < 8)  e.password  = 'Min 8 characters.';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.';
    return e;
  };

  const handleNext = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        full_name: form.full_name, email: form.email,
        password: form.password, role: form.role, phone: form.phone,
      };
      if (form.role === 'patient') {
        Object.assign(payload, {
          date_of_birth: form.date_of_birth || undefined,
          gender: form.gender || undefined,
          blood_group: form.blood_group || undefined,
          address: form.address || undefined,
        });
      }
      if (form.role === 'doctor') {
        Object.assign(payload, {
          specialization: form.specialization,
          qualification: form.qualification,
          experience_years: Number(form.experience_years) || 0,
          consultation_fee: Number(form.consultation_fee) || 0,
          department_id: form.department_id || undefined,
        });
      }
      await register(payload);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Registration failed.' });
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-icon">🏥</span>
          <h1>Join HMS</h1>
          <p>Create your account and start managing healthcare efficiently</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create Account</h2>
            <p>Step {step} of 2</p>
            <div className="step-bar">
              <div className={`step-fill`} style={{ width: `${step * 50}%` }} />
            </div>
          </div>

          {errors.general && <div className="alert alert-danger">{errors.general}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {step === 1 && (
              <>
                {/* Role selector */}
                <div className="form-group">
                  <label>Register as</label>
                  <div className="role-selector">
                    {ROLES.map((r) => (
                      <button key={r.value} type="button"
                        className={`role-btn ${form.role === r.value ? 'active' : ''}`}
                        onClick={() => set('role', r.value)}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="full_name">Full Name</label>
                  <div className={`input-wrapper ${errors.full_name ? 'input-error' : ''}`}>
                    <FiUser className="input-icon" />
                    <input id="full_name" type="text" value={form.full_name}
                      onChange={(e) => set('full_name', e.target.value)}
                      placeholder="Dr. John Smith" autoFocus />
                  </div>
                  {errors.full_name && <span className="field-error">{errors.full_name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="reg-email">Email</label>
                  <div className={`input-wrapper ${errors.email ? 'input-error' : ''}`}>
                    <FiMail className="input-icon" />
                    <input id="reg-email" type="email" value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="you@hospital.com" />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reg-pwd">Password</label>
                    <div className={`input-wrapper ${errors.password ? 'input-error' : ''}`}>
                      <FiLock className="input-icon" />
                      <input id="reg-pwd" type={showPwd ? 'text' : 'password'}
                        value={form.password} onChange={(e) => set('password', e.target.value)}
                        placeholder="Min 8 chars" />
                      <button type="button" className="btn-icon input-suffix"
                        onClick={() => setShowPwd((p) => !p)}>
                        {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </button>
                    </div>
                    {errors.password && <span className="field-error">{errors.password}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm-pwd">Confirm Password</label>
                    <div className={`input-wrapper ${errors.confirm_password ? 'input-error' : ''}`}>
                      <FiLock className="input-icon" />
                      <input id="confirm-pwd" type="password"
                        value={form.confirm_password}
                        onChange={(e) => set('confirm_password', e.target.value)}
                        placeholder="Repeat password" />
                    </div>
                    {errors.confirm_password && <span className="field-error">{errors.confirm_password}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone (optional)</label>
                  <div className="input-wrapper">
                    <FiPhone className="input-icon" />
                    <input id="phone" type="tel" value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      placeholder="+1 234 567 8900" />
                  </div>
                </div>

                <button type="button" className="btn btn-primary btn-full" onClick={handleNext}>
                  Next →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {form.role === 'patient' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input type="date" className="form-control"
                          value={form.date_of_birth}
                          onChange={(e) => set('date_of_birth', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Gender</label>
                        <select className="form-control" value={form.gender}
                          onChange={(e) => set('gender', e.target.value)}>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Blood Group</label>
                      <select className="form-control" value={form.blood_group}
                        onChange={(e) => set('blood_group', e.target.value)}>
                        <option value="">Select</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <textarea className="form-control" rows={2} value={form.address}
                        onChange={(e) => set('address', e.target.value)}
                        placeholder="123 Main St, City, State" />
                    </div>
                  </>
                )}

                {form.role === 'doctor' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Specialization *</label>
                        <input type="text" className="form-control" value={form.specialization}
                          onChange={(e) => set('specialization', e.target.value)}
                          placeholder="Cardiologist" required />
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <select className="form-control" value={form.department_id}
                          onChange={(e) => set('department_id', e.target.value)}>
                          <option value="">Select dept.</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Experience (years)</label>
                        <input type="number" className="form-control" min={0}
                          value={form.experience_years}
                          onChange={(e) => set('experience_years', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Consultation Fee ($)</label>
                        <input type="number" className="form-control" min={0} step="0.01"
                          value={form.consultation_fee}
                          onChange={(e) => set('consultation_fee', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Qualification</label>
                      <input type="text" className="form-control" value={form.qualification}
                        onChange={(e) => set('qualification', e.target.value)}
                        placeholder="MBBS, MD" />
                    </div>
                  </>
                )}

                <div className="form-row">
                  <button type="button" className="btn btn-secondary"
                    onClick={() => setStep(1)}>← Back</button>
                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? <span className="btn-spinner" /> : 'Create Account'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="link-primary">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
