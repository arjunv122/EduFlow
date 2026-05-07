import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Layers, Plus, BookOpen, ChevronDown, ChevronRight, Loader2, X } from 'lucide-react';

const AcademicsManager = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDept, setExpandedDept] = useState(null);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({ name: '', code: '', head: '' });
  const [submitting, setSubmitting] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [addingCourseToDeptId, setAddingCourseToDeptId] = useState(null);
  const [newCourseForm, setNewCourseForm] = useState({ name: '', code: '' });

  useEffect(() => { 
    fetchDepartments(); 
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const res = await api.get('/faculty');
      setFacultyList(res.data.data || []);
    } catch {}
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academics/departments');
      setDepartments(res.data.data || []);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptForm.name || !newDeptForm.code) return toast.error('Name and Code required');
    setSubmitting(true);
    try {
      const res = await api.post('/academics/departments', newDeptForm);
      toast.success('Department created!');
      setDepartments([...departments, res.data.data]);
      setIsAddingDept(false);
      setNewDeptForm({ name: '', code: '', head: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCourse = async (deptId) => {
    if (!newCourseForm.name || !newCourseForm.code) return toast.error('Name and Code required');
    setSubmitting(true);
    try {
      const res = await api.post('/academics/courses', { ...newCourseForm, department: deptId });
      toast.success('Course created!');
      setDepartments(deps => deps.map(d => d._id === deptId ? { ...d, courses: [...(d.courses || []), res.data.data] } : d));
      setAddingCourseToDeptId(null);
      setNewCourseForm({ name: '', code: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetHOD = async (deptId, hodUserId) => {
    if (!hodUserId) return;
    try {
      await api.put(`/faculty/departments/${deptId}/hod`, { hodUserId });
      toast.success('HOD assigned successfully');
      setDepartments(deps => deps.map(d => d._id === deptId ? { ...d, head: hodUserId } : d));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign HOD');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title serif-heading">Academics Management</h1>
          <p className="page-subtitle">Manage departments, courses, and class sections.</p>
        </div>
        <button
          className={`btn ${isAddingDept ? 'btn-secondary' : 'btn-accent'}`}
          onClick={() => setIsAddingDept(!isAddingDept)}
          style={{ gap: '0.4rem' }}
        >
          {isAddingDept ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Department</>}
        </button>
      </div>

      {/* Add Department Form */}
      {isAddingDept && (
        <div className="card animate-scale-in" style={{ borderLeft: '4px solid var(--accent)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} color="var(--accent)" /> Create New Department
          </h3>
          <form onSubmit={handleAddDepartment} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-field" style={{ flex: '2 1 200px' }}>
              <label>Department Name</label>
              <input required placeholder="e.g. Computer Science" value={newDeptForm.name} onChange={e => setNewDeptForm({ ...newDeptForm, name: e.target.value })} />
            </div>
            <div className="form-field" style={{ flex: '1 1 100px' }}>
              <label>Code</label>
              <input required placeholder="e.g. CSE" value={newDeptForm.code} onChange={e => setNewDeptForm({ ...newDeptForm, code: e.target.value.toUpperCase() })} />
            </div>
            <button type="submit" disabled={submitting} className="btn btn-accent" style={{ height: '42px', padding: '0 1.5rem' }}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : 'Save Department'}
            </button>
          </form>
        </div>
      )}

      {/* Departments */}
      {loading ? (
        <div className="card" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-tertiary)' }}>
          <Loader2 size={28} className="animate-spin" color="var(--accent)" />
          <p style={{ fontSize: '0.875rem' }}>Loading academic data…</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Layers size={24} /></div>
            <h3>No Departments Found</h3>
            <p>Get started by creating your first academic department using the button above.</p>
            <button className="btn btn-accent" style={{ marginTop: '0.5rem' }} onClick={() => setIsAddingDept(true)}>
              <Plus size={14} /> Create Department
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="stagger-children">
          {departments.map((dept) => (
            <div key={dept._id} className="card" style={{ overflow: 'hidden', transition: 'all var(--transition)' }}>
              <div
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', userSelect: 'none',
                  transition: 'background-color var(--transition)',
                }}
                onClick={() => setExpandedDept(expandedDept === dept._id ? null : dept._id)}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: 'var(--accent-muted)', border: '1px solid var(--border-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.05em',
                  }}>
                    {dept.code?.slice(0, 3)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {dept.name}
                      <select 
                        value={dept.head?._id || dept.head || ''} 
                        onChange={(e) => handleSetHOD(dept._id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', appearance: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border)', marginLeft: '0.5rem', maxWidth: '140px' }}
                      >
                        <option value="">Assign HOD</option>
                        {facultyList
                          .filter(f => (f.department?._id || f.department) === dept._id)
                          .map(f => (
                            <option key={f.user?._id || f._id} value={f.user?._id || f._id}>
                              {f.user?.name || f.name || 'Unknown'}
                            </option>
                        ))}
                      </select>
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen size={11} /> {(dept.courses || []).length} course(s) associated
                    </p>
                  </div>
                </div>
                <div style={{ color: 'var(--text-tertiary)', transition: 'transform var(--transition)', transform: expandedDept === dept._id ? 'rotate(180deg)' : 'none' }}>
                  <ChevronDown size={18} />
                </div>
              </div>

              {expandedDept === dept._id && (
                <div className="animate-fade-in" style={{ borderTop: '1px solid var(--border)', padding: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
                      Courses in {dept.code}
                    </span>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setAddingCourseToDeptId(addingCourseToDeptId === dept._id ? null : dept._id)}
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', gap: '0.3rem' }}
                    >
                      {addingCourseToDeptId === dept._id ? <><X size={12}/> Cancel</> : <><Plus size={12} /> Add Course</>}
                    </button>
                  </div>
                  {addingCourseToDeptId === dept._id && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                      <input 
                        placeholder="Course Name" 
                        value={newCourseForm.name} 
                        onChange={e => setNewCourseForm({ ...newCourseForm, name: e.target.value })}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                      />
                      <input 
                        placeholder="Course Code" 
                        value={newCourseForm.code} 
                        onChange={e => setNewCourseForm({ ...newCourseForm, code: e.target.value.toUpperCase() })}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', width: '120px' }}
                      />
                      <button onClick={() => handleAddCourse(dept._id)} disabled={submitting} className="btn btn-accent" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                      </button>
                    </div>
                  )}
                  {(!dept.courses || dept.courses.length === 0) ? (
                    <div style={{
                      padding: '1.5rem', textAlign: 'center',
                      border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
                      color: 'var(--text-tertiary)', fontSize: '0.82rem',
                    }}>
                      No courses added yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {dept.courses.map(c => (
                        <div key={c._id} className="card" style={{ padding: '0.875rem' }}>
                          <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{c.code}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademicsManager;
