import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getQuizzesManage, getQuizzes, getAssignments, getMyAttempt } from '../../api/assessmentApi';
import { BookOpen, Plus, FileText, Clock, CheckCircle2, AlertTriangle, Users, Trophy, Loader2 } from 'lucide-react';

const statusBadge = (status) => ({
  draft:      'badge-neutral',
  published:  'badge-info',
  active:     'badge-present',
  completed:  'badge-warning',
  closed:     'badge-neutral',
}[status] || 'badge-neutral');

const AssessmentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFaculty = ['faculty', 'admin', 'superadmin'].includes(user?.role);
  const [tab, setTab] = useState('quizzes');
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  // Map of quizId -> attempt (for students)
  const [myAttempts, setMyAttempts] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [qRes, aRes] = await Promise.all([
          isFaculty ? getQuizzesManage() : getQuizzes(),
          getAssignments(),
        ]);
        const fetchedQuizzes = qRes.data?.data || [];
        setQuizzes(fetchedQuizzes);
        setAssignments(aRes.data?.data || aRes.data || []);

        // For students, fetch attempt status for each quiz
        if (!isFaculty && fetchedQuizzes.length > 0) {
          const attemptResults = await Promise.allSettled(
            fetchedQuizzes.map(q => getMyAttempt(q._id))
          );
          const attemptsMap = {};
          attemptResults.forEach((result, idx) => {
            if (result.status === 'fulfilled' && result.value?.data?.data) {
              attemptsMap[fetchedQuizzes[idx]._id] = result.value.data.data;
            }
          });
          setMyAttempts(attemptsMap);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [isFaculty]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex' }}>
            <BookOpen size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">Assessments</h1>
            <p className="page-subtitle">Quizzes & Assignments</p>
          </div>
        </div>
        {isFaculty && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/assessments/quiz/new" className="btn btn-accent" style={{ gap: '0.4rem' }}>
              <Plus size={15} /> New Quiz
            </Link>
            <Link to="/assessments/assignment/new" className="btn btn-secondary" style={{ gap: '0.4rem' }}>
              <Plus size={15} /> New Assignment
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border)' }}>
        {['quizzes', 'assignments'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.6rem 1.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text-tertiary)',
              fontWeight: tab === t ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
              marginBottom: '-2px',
              transition: 'all 150ms ease',
            }}
          >
            {t === 'quizzes' ? <BookOpen size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> : <FileText size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />}
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : tab === 'quizzes' ? (
        /* Quizzes Grid */
        quizzes.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No quizzes found. {isFaculty && 'Create one to get started!'}
          </div>
        ) : (
          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {quizzes.map(q => (
              <div key={q._id} className="card lift" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{q.title}</h3>
                  <span className={`badge ${statusBadge(q.status)}`} style={{ fontSize: '0.7rem' }}>{q.status}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  {q.course?.name} · {q.duration} min · {q.totalMarks} marks
                </p>
                {q.department && <span className="badge badge-info" style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>{q.department?.name}</span>}
                {q.proctoring?.enabled && (
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem', alignSelf: 'flex-start', gap: '0.2rem' }}>🛡 Proctored</span>
                )}
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  {user.role === 'student' && (q.status === 'active' || q.status === 'published') ? (() => {
                    const attempt = myAttempts[q._id];
                    // Already submitted
                    if (attempt && attempt.status !== 'in_progress') {
                      if (attempt.isPublished) {
                        // Results are published — show score + view link
                        const passed = attempt.percentage >= (attempt.quiz?.passingMarks || 0);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                              <Trophy size={14} color={passed ? 'var(--status-present)' : 'var(--status-absent)'} />
                              <span style={{ fontWeight: 700, color: passed ? 'var(--status-present)' : 'var(--status-absent)' }}>
                                {attempt.totalScore ?? 0} / {attempt.quiz?.totalMarks ?? q.totalMarks} marks ({Math.round(attempt.percentage ?? 0)}%)
                              </span>
                              <span style={{ fontSize: '0.7rem', color: passed ? 'var(--status-present)' : 'var(--status-absent)' }}>
                                {passed ? '✓ Passed' : '✗ Failed'}
                              </span>
                            </div>
                            <Link to={`/assessments/quiz/${q._id}/result`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', gap: '0.4rem' }}>
                              <Trophy size={13} /> View Results
                            </Link>
                          </div>
                        );
                      } else {
                        // Submitted but results not yet published
                        return (
                          <div style={{ padding: '0.6rem', background: 'var(--bg-tertiary)', borderRadius: 8, textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            <CheckCircle2 size={14} color="var(--status-present)" />
                            Submitted — Results Pending
                          </div>
                        );
                      }
                    }
                    // Not yet started or in-progress
                    return (
                      <Link to={`/assessments/quiz/${q._id}`} className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}>
                        {attempt?.status === 'in_progress' ? 'Resume Quiz' : 'Start Quiz'}
                      </Link>
                    );
                  })() : isFaculty ? (
                    <Link to={`/gradebook`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}>Gradebook</Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Assignments Grid */
        assignments.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No assignments found. {isFaculty && 'Create one to get started!'}
          </div>
        ) : (
          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {assignments.map(a => {
              const due = a.dueDate ? new Date(a.dueDate) : null;
              const isOverdue = due && new Date() > due;
              return (
                <div key={a._id} className="card lift" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{a.title}</h3>
                    <span className={`badge ${statusBadge(a.status)}`} style={{ fontSize: '0.7rem' }}>{a.status}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                    {a.course?.name} · Max: {a.maxMarks} marks · By: {a.createdBy?.name}
                  </p>
                  {due && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: isOverdue ? 'var(--status-absent)' : 'var(--text-secondary)' }}>
                      {isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
                      Due: {due.toLocaleString()}
                    </div>
                  )}
                  {!due && <span style={{ fontSize: '0.75rem', color: 'var(--status-present)' }}>No due date</span>}
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                    {user.role === 'student' ? (
                      <Link to={`/assessments/assignment/${a._id}`} className="btn btn-accent" style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem' }}>
                        {a.status === 'closed' ? 'View' : 'Open'}
                      </Link>
                    ) : (
                      <>
                        <Link to={`/assessments/assignment/${a._id}/submissions`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', gap: '0.3rem' }}>
                          <Users size={13} /> Submissions
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default AssessmentDashboard;
