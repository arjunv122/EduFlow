import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAssignmentById, submitAssignment, getMySubmission } from '../../api/assessmentApi';
import toast from 'react-hot-toast';
import { FileText, Clock, CheckCircle2, AlertTriangle, Upload, ArrowLeft } from 'lucide-react';

const AssignmentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [textResponse, setTextResponse] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          getAssignmentById(id),
          user.role === 'student' ? getMySubmission(id) : Promise.resolve({ data: null }),
        ]);
        let fetchedAssignment = aRes.data?.data || aRes.data;
        if (Array.isArray(fetchedAssignment)) {
           fetchedAssignment = fetchedAssignment[0];
        }
        setAssignment(fetchedAssignment);
        const sub = sRes.data?.data || sRes.data;
        setMySubmission(sub);
        if (sub?.textResponse) setTextResponse(sub.textResponse);
      } catch (err) {
        toast.error('Failed to load assignment');
        navigate('/student/assessments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, user.role]);

  const handleSubmit = async () => {
    if (!textResponse.trim() && !fileToUpload) return toast.error('Please provide a text response or upload a file');
    setSubmitting(true);
    try {
      // In a real app, you would upload the file to a storage bucket and get the URL here.
      // For this implementation, we will just send the text response.
      await submitAssignment(id, { textResponse });
      toast.success('Assignment submitted!');
      const sRes = await getMySubmission(id);
      setMySubmission(sRes.data?.data || sRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
    </div>;
  }

  if (!assignment) return null;

  const now = new Date();
  const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isOverdue = due && now > due;
  const isClosed = assignment.status === 'closed';
  const isSubmitted = mySubmission?.status === 'submitted' || mySubmission?.status === 'graded';

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ padding: '0.55rem', borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex' }}>
          <FileText size={20} color="var(--accent)" />
        </div>
        <div>
          <h1 className="page-title serif-heading">{assignment.title}</h1>
          <p className="page-subtitle">
            {assignment.course?.name} ({assignment.course?.code}) · Max: {assignment.maxMarks} marks
          </p>
        </div>
      </div>

      {/* Status + Due Date banner */}
      <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isClosed ? (
            <span className="badge badge-neutral" style={{ gap: '0.3rem' }}><AlertTriangle size={12} /> Closed</span>
          ) : isOverdue ? (
            <span className="badge badge-warning" style={{ gap: '0.3rem' }}><Clock size={12} /> Overdue</span>
          ) : (
            <span className="badge badge-present" style={{ gap: '0.3rem' }}><CheckCircle2 size={12} /> Open</span>
          )}
          {isSubmitted && <span className="badge badge-info" style={{ gap: '0.3rem' }}><CheckCircle2 size={12} /> Submitted</span>}
        </div>
        {due && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <strong>Due:</strong> {due.toLocaleString()}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Description</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{assignment.description}</p>
        {assignment.instructions && (
          <>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1rem', marginBottom: '0.5rem' }}>Instructions</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{assignment.instructions}</p>
          </>
        )}
      </div>

      {/* Submission area (student only) */}
      {user.role === 'student' && !isClosed && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={14} /> Your Submission
          </h3>
          
          <div className="form-field">
            <textarea
              value={textResponse}
              onChange={e => setTextResponse(e.target.value)}
              placeholder="Write your response here…"
              rows={6}
              style={{ width: '100%', resize: 'vertical', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              disabled={isSubmitted && !assignment.allowResubmission}
            />
          </div>

          <div className="form-field">
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Upload File (Optional)</label>
            <input 
              type="file" 
              onChange={e => setFileToUpload(e.target.files[0])}
              disabled={isSubmitted && !assignment.allowResubmission}
              style={{ padding: '0.5rem', background: 'var(--bg-primary)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', width: '100%' }}
            />
            {assignment.allowedFileTypes?.length > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                Allowed: {assignment.allowedFileTypes.join(', ')} (Max {assignment.maxFileSize}MB)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || (isSubmitted && !assignment.allowResubmission)}
              className="btn btn-accent"
              style={{ gap: '0.4rem' }}
            >
              <CheckCircle2 size={14} />
              {submitting ? 'Submitting…' : isSubmitted ? (assignment.allowResubmission ? 'Resubmit' : 'Already Submitted') : 'Turn In'}
            </button>
          </div>
        </div>
      )}

      {/* Graded result */}
      {mySubmission?.status === 'graded' && (
        <div className="card" style={{ padding: '1.5rem', borderLeft: '3px solid var(--status-present)' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Grade</h3>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
            {mySubmission.marksAwarded} / {assignment.maxMarks}
          </p>
          {mySubmission.feedback && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{mySubmission.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentView;
