import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { User, Mail, GraduationCap, Building2, MapPin, Phone, Moon, Sun, ArrowRight, BookOpen, Briefcase } from 'lucide-react';

const S = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', padding: '2rem 1rem',
  },
  blob: {
    position: 'absolute', width: '30%', height: '30%', borderRadius: '50%',
    background: 'var(--accent)', opacity: 0.08, filter: 'blur(100px)', pointerEvents: 'none',
  },
  themeBtn: {
    position: 'absolute', top: '1.25rem', right: '1.25rem', padding: '0.6rem', borderRadius: '50%',
    background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
    cursor: 'pointer', zIndex: 10,
  },
  card: {
    width: '100%', maxWidth: 640, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '2.5rem', position: 'relative', zIndex: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },
  inputLeftPadding: { paddingLeft: '2.25rem' },
  roleBtn: {
    flex: 1, padding: '1.5rem', borderRadius: 8, border: '2px solid var(--border)',
    background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
  },
  roleBtnActive: { borderColor: 'var(--accent)', background: 'var(--accent-muted)' },
  previewBox: {
    background: 'var(--bg-tertiary)', border: '1px dashed var(--border-accent)',
    borderRadius: 8, padding: '1rem', marginTop: '1rem', fontSize: '0.85rem'
  }
};

const StudentRegister = () => {
  const [step, setStep] = useState(1); // 1: Role, 2: Details, 3: Review
  const [role, setRole] = useState('student'); // student | faculty
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [institutionId, setInstitutionId] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '',
    courseCode: '', // for student
    batchYear: new Date().getFullYear(), // for student
    designation: 'lecturer', // for faculty
    department: '', // for faculty — stores department _id
  });
  const [previewEmail, setPreviewEmail] = useState('');

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch SRET courses
    api.get('/auth/sret-courses')
      .then(res => setCourses(res.data.courses || []))
      .catch(err => console.error(err));
    
    // Fetch SRET institution ID + departments
    api.get('/auth/sret-info')
      .then(res => {
        const data = res.data;
        setInstitutionId(data.institutionId || '');
        setDepartments(data.departments || []);
      })
      .catch(err => console.error('Failed to fetch SRET info:', err));
  }, []);

  // Simple preview generation for display
  useEffect(() => {
    if (role === 'student' && formData.courseCode) {
      const course = courses.find(c => c.code === formData.courseCode);
      if (course) {
        const yy = String(formData.batchYear).slice(-2);
        setPreviewEmail(`e0${course.index}${yy}XXX@sret.edu.in`);
      }
    } else if (role === 'faculty' && formData.name) {
      const base = formData.name.trim().split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      setPreviewEmail(`${base}@sret.edu.in`);
    } else {
      setPreviewEmail('');
    }
  }, [formData.courseCode, formData.name, formData.batchYear, role, courses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email, // Contact email
        password: 'TMP_PASSWORD', // Auth service overrides this
        role,
        institutionId: institutionId,
        profileData: {
          contactEmail: formData.email,
          phone: formData.phone,
          ...(role === 'student' ? {
            courseCode: formData.courseCode,
            batchYear: formData.batchYear,
          } : {
            designation: formData.designation,
            department: formData.department, // Now sends the ObjectId
          })
        }
      };

      await api.post('/auth/register', payload);
      toast.success('Registration successful! Please check your personal email for login credentials.', { duration: 6000 });
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected department name for preview
  const selectedDeptName = departments.find(d => d._id === formData.department)?.name || formData.department;

  return (
    <div style={S.page}>
      <div style={{...S.blob, top: '-5%', left: '-5%'}} />
      <div style={{...S.blob, bottom: '-5%', right: '-5%', background: '#4A90D9'}} />
      <button style={S.themeBtn} onClick={toggleTheme}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>

      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="serif-heading" style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>SRET Registration</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Get your institutional EduFlow account</p>
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1rem' }}>I am registering as a...</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div 
                style={{ ...S.roleBtn, ...(role === 'student' ? S.roleBtnActive : {}) }}
                onClick={() => setRole('student')}
              >
                <GraduationCap size={32} color={role === 'student' ? 'var(--accent)' : 'var(--text-secondary)'} />
                <span style={{ fontWeight: 600 }}>Student</span>
              </div>
              <div 
                style={{ ...S.roleBtn, ...(role === 'faculty' ? S.roleBtnActive : {}) }}
                onClick={() => setRole('faculty')}
              >
                <Briefcase size={32} color={role === 'faculty' ? 'var(--accent)' : 'var(--text-secondary)'} />
                <span style={{ fontWeight: 600 }}>Faculty</span>
              </div>
            </div>
            <button className="btn btn-accent" style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }} onClick={() => setStep(2)}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <form className="animate-fade-in" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Personal Details
            </h3>
            
            <div style={S.grid2}>
              <div style={S.fieldGroup}>
                <label>Full Name</label>
                <div style={S.inputWrap}>
                  <span style={S.inputIcon}><User size={15} /></span>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" style={S.inputLeftPadding} />
                </div>
              </div>
              <div style={S.fieldGroup}>
                <label>Personal Email (Contact)</label>
                <div style={S.inputWrap}>
                  <span style={S.inputIcon}><Mail size={15} /></span>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@gmail.com" style={S.inputLeftPadding} />
                </div>
              </div>
            </div>

            <div style={S.fieldGroup}>
              <label>Phone Number</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}><Phone size={15} /></span>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 9876543210" style={S.inputLeftPadding} />
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}>
              Academic Details
            </h3>

            {role === 'student' ? (
              <div style={S.grid2}>
                <div style={S.fieldGroup}>
                  <label>Course</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}><BookOpen size={15} /></span>
                    <select required value={formData.courseCode} onChange={e => setFormData({...formData, courseCode: e.target.value})} style={{ ...S.inputLeftPadding, appearance: 'none' }}>
                      <option value="">-- Select Course --</option>
                      {courses.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={S.fieldGroup}>
                  <label>Batch Year</label>
                  <input type="number" required value={formData.batchYear} onChange={e => setFormData({...formData, batchYear: e.target.value})} min={2020} max={2030} />
                </div>
              </div>
            ) : (
              <div style={S.grid2}>
                <div style={S.fieldGroup}>
                  <label>Designation</label>
                  <select required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} style={{ appearance: 'none' }}>
                    <option value="professor">Professor</option>
                    <option value="associate_professor">Associate Professor</option>
                    <option value="assistant_professor">Assistant Professor</option>
                    <option value="lecturer">Lecturer</option>
                  </select>
                </div>
                <div style={S.fieldGroup}>
                  <label>Department</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}><Building2 size={15} /></span>
                    <select
                      required
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      style={{ ...S.inputLeftPadding, appearance: 'none' }}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Back</button>
              <button type="submit" className="btn btn-accent" style={{ flex: 2, justifyContent: 'center' }}>Preview Details</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
             <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Review Registration
            </h3>

            <div style={S.previewBox}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Your institutional email will be generated as:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Mail size={16} color="var(--accent)" />
                <code style={{ fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                  {previewEmail || 'TBD@sret.edu.in'}
                </code>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                Your login credentials will be emailed to <strong>{formData.email}</strong>.
              </p>
            </div>

            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              A secure default password will be assigned. You will be prompted to change it upon first login.
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" onClick={() => setStep(2)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Edit Details</button>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="btn btn-accent" style={{ flex: 2, justifyContent: 'center' }}>
                {isSubmitting ? <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> : 'Confirm Registration'}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign In here</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRegister;
