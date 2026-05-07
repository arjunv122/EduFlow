import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Building2, Mail, Lock, User, Phone, MapPin, Moon, Sun, ArrowRight, ShieldCheck } from 'lucide-react';

/* ─────────────── Inline style objects ─────────────── */
const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    position: 'relative',
    overflow: 'hidden',
    padding: '2rem 1rem',
  },
  blob1: {
    position: 'absolute', top: '-5%', left: '-5%',
    width: '30%', height: '30%', borderRadius: '50%',
    background: 'var(--accent)', opacity: 0.08,
    filter: 'blur(100px)', pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-5%', right: '-5%',
    width: '30%', height: '30%', borderRadius: '50%',
    background: '#4A90D9', opacity: 0.07,
    filter: 'blur(100px)', pointerEvents: 'none',
  },
  themeBtn: {
    position: 'absolute', top: '1.25rem', right: '1.25rem',
    padding: '0.6rem', borderRadius: '50%',
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    color: 'var(--text-secondary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10, transition: 'all 150ms ease',
  },
  card: {
    width: '100%', maxWidth: 640,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '2.5rem',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    animation: 'fadeIn 0.25s ease-out',
  },
  logoWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', marginBottom: '2rem',
  },
  logoIcon: {
    width: 48, height: 48,
    background: 'linear-gradient(135deg, var(--accent), #C4780A)',
    borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1rem',
    color: 'var(--text-inverse)',
    boxShadow: '0 4px 16px rgba(232,160,32,0.3)',
  },
  h1: {
    fontFamily: 'var(--font-serif)', fontSize: '1.6rem',
    fontWeight: 'normal', color: 'var(--text-primary)',
    margin: 0, textAlign: 'center',
  },
  sub: {
    fontSize: '0.8125rem', color: 'var(--text-secondary)',
    marginTop: '0.25rem', textAlign: 'center',
  },
  progress: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem', marginTop: '1.5rem',
  },
  barActive: { height: 6, borderRadius: 3, width: 40, background: 'var(--accent)', transition: 'all 0.3s' },
  barInactive: { height: 6, borderRadius: 3, width: 16, background: 'var(--border)', transition: 'all 0.3s' },
  stepTitle: {
    fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' },
  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)', pointerEvents: 'none', display: 'flex', alignItems: 'center',
  },
  inputLeftPadding: { paddingLeft: '2.25rem' },
};

const Register = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [instData, setInstData] = useState({
    name: '', type: 'college', email: '', phone: '', website: '',
    address: { street: '', city: '', state: '', country: '', pincode: '' }
  });

  const [adminData, setAdminData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (adminData.password !== adminData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setIsSubmitting(true);
    try {
      const instRes = await api.post('/governance/register', instData);
      const institutionId = instRes.data.data._id;

      await api.post('/auth/register', {
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
        role: 'admin',
        institutionId,
      });

      toast.success('Registration successful! Please wait for superadmin approval.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.blob1} />
      <div style={S.blob2} />

      <button style={S.themeBtn} onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div style={S.card}>
        <div style={S.logoWrap}>
          <div style={S.logoIcon}><Building2 size={24} /></div>
          <h1 style={S.h1}>Partner with EduFlow</h1>
          <p style={S.sub}>Register your institution to get started</p>
          <div style={S.progress}>
            <div style={step >= 1 ? S.barActive : S.barInactive} />
            <div style={step >= 2 ? S.barActive : S.barInactive} />
          </div>
        </div>

        <form onSubmit={step === 1 ? handleNext : handleSubmit}>
          {step === 1 ? (
            <div className="animate-fade-in">
              <h3 style={S.stepTitle}>Institution Details</h3>
              
              <div style={S.grid2}>
                <div style={S.fieldGroup}>
                  <label>Institution Name</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}><Building2 size={15} /></span>
                    <input type="text" required value={instData.name} onChange={e => setInstData({...instData, name: e.target.value})} placeholder="e.g. Stanford University" style={S.inputLeftPadding} />
                  </div>
                </div>
                <div style={S.fieldGroup}>
                  <label>Type</label>
                  <select value={instData.type} onChange={e => setInstData({...instData, type: e.target.value})} style={{ appearance: 'none' }}>
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="university">University</option>
                    <option value="training_center">Training Center</option>
                  </select>
                </div>
              </div>

              <div style={S.grid2}>
                <div style={S.fieldGroup}>
                  <label>Official Email</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}><Mail size={15} /></span>
                    <input type="email" required value={instData.email} onChange={e => setInstData({...instData, email: e.target.value})} placeholder="admin@domain.edu" style={S.inputLeftPadding} />
                  </div>
                </div>
                <div style={S.fieldGroup}>
                  <label>Phone Contact</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}><Phone size={15} /></span>
                    <input type="tel" required value={instData.phone} onChange={e => setInstData({...instData, phone: e.target.value})} placeholder="+1 234 567 8900" style={S.inputLeftPadding} />
                  </div>
                </div>
              </div>

              <div style={S.fieldGroup}>
                <label>Address Location</label>
                <div style={S.inputWrap}>
                  <span style={{ ...S.inputIcon, top: '1rem', transform: 'none' }}><MapPin size={15} /></span>
                  <textarea rows={2} required value={instData.address.street} onChange={e => setInstData({...instData, address: {...instData.address, street: e.target.value}})} placeholder="Street Address, City, Country" style={{ ...S.inputLeftPadding, resize: 'none' }} />
                </div>
              </div>

              <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
                Continue to Admin Details <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h3 style={S.stepTitle}>Initial Admin Account</h3>
              
              <div style={S.grid2}>
                <div style={S.fieldGroup}>
                  <label>Full Name</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}><User size={15} /></span>
                    <input type="text" required value={adminData.name} onChange={e => setAdminData({...adminData, name: e.target.value})} placeholder="John Doe" style={S.inputLeftPadding} />
                  </div>
                </div>
                <div style={S.fieldGroup}>
                  <label>Admin Email</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}><Mail size={15} /></span>
                    <input type="email" required value={adminData.email} onChange={e => setAdminData({...adminData, email: e.target.value})} placeholder="admin@personal.com" style={S.inputLeftPadding} />
                  </div>
                </div>
              </div>

              <div style={S.grid2}>
                <div style={S.fieldGroup}>
                  <label>Password</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}><Lock size={15} /></span>
                    <input type="password" required minLength={6} value={adminData.password} onChange={e => setAdminData({...adminData, password: e.target.value})} placeholder="••••••••" style={S.inputLeftPadding} />
                  </div>
                </div>
                <div style={S.fieldGroup}>
                  <label>Confirm Password</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}><ShieldCheck size={15} /></span>
                    <input type="password" required minLength={6} value={adminData.confirmPassword} onChange={e => setAdminData({...adminData, confirmPassword: e.target.value})} placeholder="••••••••" style={S.inputLeftPadding} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={handleBack} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Back
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-accent" style={{ flex: 2, justifyContent: 'center' }}>
                  {isSubmitting ? <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign In here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
