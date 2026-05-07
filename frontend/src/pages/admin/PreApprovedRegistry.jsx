import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, Plus, Trash2, Loader2 } from 'lucide-react';

const PreApprovedRegistry = () => {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', identifier: '', role: 'student' });

  // Resolve the institution ID to use — from the user's own institution or cached superadmin context
  const instId = user?.institution?._id || user?.institution || localStorage.getItem('activeInstitutionId');

  // On mount — if superadmin with no institution context cached, fetch it first, THEN load list
  useEffect(() => {
    const ensureInstId = async () => {
      if (!localStorage.getItem('activeInstitutionId') && user?.role === 'superadmin') {
        try {
          const govRes = await api.get('/governance');
          const institutions = govRes.data?.data || govRes.data?.institutions || [];
          if (institutions.length > 0) {
            localStorage.setItem('activeInstitutionId', institutions[0]._id);
          } else {
            toast.error('No institutions found. Create one first.');
            setLoading(false);
            return;
          }
        } catch {
          toast.error('Could not resolve institution context.');
          setLoading(false);
          return;
        }
      }
      // Only call loadList after we have confirmed the institution id is set
      loadList();
    };
    ensureInstId();
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/pre-approve');
      setList(res.data?.data || []);
    } catch {
      toast.error('Failed to load pre-approved registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.identifier) return;

    setAdding(true);
    try {
      await api.post('/users/pre-approve', formData);
      toast.success(`${formData.role === 'student' ? 'Student' : 'Faculty'} securely whitelisted!`);
      setFormData({ name: '', identifier: '', role: 'student' });
      loadList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to registry.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this user from the pre-approved registry?')) return;
    try {
      await api.delete(`/users/pre-approve/${id}`);
      toast.success('Removed securely.');
      setList(l => l.filter(x => x._id !== id));
    } catch (err) {
      toast.error('Failed to remove entry.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Add New Entry Form */}
      <div className="card animate-fade-in" style={{ padding: '1.5rem', borderLeft: '4px solid var(--status-warning)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ShieldCheck size={18} color="var(--status-warning)" />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Whitelist New Paid Member</h3>
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Role</label>
            <select 
              value={formData.role} 
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              style={{ width: '100%', padding: '0.6rem' }}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Full Name</label>
            <input 
              required 
              placeholder="e.g. John Doe" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              Personal Email Address
            </label>
            <input 
              required 
              type="email"
              placeholder="Their contact email for verification" 
              value={formData.identifier} 
              onChange={e => setFormData({ ...formData, identifier: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={adding} style={{ height: '42px', padding: '0 1.5rem' }}>
            {adding ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Add to Whitelist</>}
          </button>
        </form>
      </div>

      {/* Registry Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Registered Email Check</th>
                <th>Role</th>
                <th>Registration Status</th>
                <th style={{ width: 80, textAlign: 'center' }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    No pre-approved records found.
                  </td>
                </tr>
              ) : list.map(item => (
                <tr key={item._id}>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.identifier}</td>
                  <td>
                    <span className={`badge ${item.role === 'student' ? 'badge-neutral' : 'badge-info'}`}>
                      {item.role === 'student' ? 'Student' : 'Faculty'}
                    </span>
                  </td>
                  <td>
                    {item.isClaimed ? (
                      <span className="badge badge-present">✓ Successfully Registered</span>
                    ) : (
                      <span className="badge badge-warning">⏳ Waiting for them to Register</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ color: 'var(--danger)', padding: '0.4rem' }} 
                      onClick={() => handleRemove(item._id)}
                      title="Remove from Whitelist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PreApprovedRegistry;
