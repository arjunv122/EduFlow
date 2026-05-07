import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Building2, CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';

const InstitutionsManager = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/governance');
      setInstitutions(res.data.data);
    } catch (error) {
      toast.error('Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const approveInstitution = async (id, plan) => {
    if (!window.confirm(`Approve this institution with ${plan} plan?`)) return;
    
    try {
      await api.put(`/governance/${id}/approve`, { subscriptionPlan: plan });
      toast.success('Institution approved successfully');
      fetchInstitutions(); // Refresh
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    }
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="rounded-full bg-border-color h-10 w-10"></div><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-border-color rounded w-3/4"></div></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ShieldAlert size={24} className="text-primary-color" />
            Institution Governance
          </h1>
          <p className="text-text-secondary mt-1">Manage partner institutions and sub-administrators</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-border-color overflow-hidden shadow-sm">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-surface-color/50 border-b border-border-color">
                 <th className="p-4 font-semibold text-text-secondary">Institution</th>
                 <th className="p-4 font-semibold text-text-secondary">Contact</th>
                 <th className="p-4 font-semibold text-text-secondary">Status</th>
                 <th className="p-4 font-semibold text-text-secondary">Subscription</th>
                 <th className="p-4 font-semibold text-text-secondary text-right">Actions</th>
               </tr>
            </thead>
            <tbody>
               {institutions.length === 0 ? (
                 <tr><td colSpan="5" className="p-8 text-center text-text-secondary">No institutions found.</td></tr>
               ) : (
                 institutions.map(inst => (
                   <tr key={inst._id} className="border-b border-border-color last:border-0 hover:bg-surface-hover/30 transition-colors">
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-primary-color/10 flex items-center justify-center text-primary-color">
                              <Building2 size={18} />
                           </div>
                           <div>
                             <p className="font-medium text-text-primary">{inst.name}</p>
                             <p className="text-xs text-text-secondary capitalize">{inst.type.replace('_', ' ')}</p>
                           </div>
                        </div>
                     </td>
                     <td className="p-4">
                        <p className="text-sm text-text-primary">{inst.email}</p>
                        <p className="text-xs text-text-secondary">{inst.phone}</p>
                     </td>
                     <td className="p-4">
                        {inst.status === 'pending' && <span className="flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning-color/10 text-warning-color border border-warning-color/20"><Clock size={12}/> Pending</span>}
                        {inst.status === 'approved' && <span className="flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-color/10 text-accent-color border border-accent-color/20"><CheckCircle size={12}/> Approved</span>}
                        {inst.status === 'rejected' && <span className="flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger-color/10 text-danger-color border border-danger-color/20"><XCircle size={12}/> Rejected</span>}
                     </td>
                     <td className="p-4">
                        <p className="text-sm font-medium capitalize text-text-primary">{inst.subscription?.plan || 'N/A'}</p>
                        {inst.status === 'approved' && <p className="text-xs text-text-secondary">Max Users: {inst.subscription?.maxUsers}</p>}
                     </td>
                     <td className="p-4 text-right">
                        {inst.status === 'pending' && (
                          <div className="flex justify-end gap-2 text-sm">
                             <button onClick={() => approveInstitution(inst._id, 'basic')} className="btn btn-secondary px-3 py-1.5 text-xs">Approve (Basic)</button>
                             <button onClick={() => approveInstitution(inst._id, 'professional')} className="btn btn-primary px-3 py-1.5 text-xs">Approve (Pro)</button>
                          </div>
                        )}
                        {inst.status === 'approved' && (
                          <button className="btn btn-secondary px-3 py-1.5 text-xs">Manage Limits</button>
                        )}
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default InstitutionsManager;
