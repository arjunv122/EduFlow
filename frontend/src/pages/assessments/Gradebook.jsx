import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { getQuizzesManage } from '../../api/assessmentApi';
import { BarChart3, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';

const scoreColor = (pct) => {
  if (pct >= 75) return { color: 'var(--status-present)', bg: 'var(--status-present-bg)' };
  if (pct >= 50) return { color: 'var(--status-late)',    bg: 'var(--status-late-bg)' };
  return              { color: 'var(--status-absent)',   bg: 'var(--status-absent-bg)' };
};

const Gradebook = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    getQuizzesManage()
      .then(r => setQuizzes(r.data?.data || []))
      .catch(() => toast.error('Failed to load quizzes.'))
      .finally(() => setLoadingQuizzes(false));
  }, []);

  const loadAttempts = async (quiz) => {
    setSelectedQuiz(quiz);
    setLoadingAttempts(true);
    try {
      const res = await api.get(`/assessment/quiz/${quiz._id}/attempts`);
      setAttempts(res.data?.data || []);
    } catch {
      toast.error('Failed to load attempts.');
    } finally {
      setLoadingAttempts(false);
    }
  };

  const publishResults = async () => {
    if (!selectedQuiz) return;
    setPublishing(true);
    try {
      await api.put(`/assessment/quiz/${selectedQuiz._id}/publish-results`);
      toast.success('Results published to students.');
      setSelectedQuiz(q => ({ ...q, isPublished: true }));
      setQuizzes(qs => qs.map(q => q._id === selectedQuiz._id ? { ...q, isPublished: true } : q));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title serif-heading">Gradebook</h1>
          <p className="page-subtitle">Select a quiz to view student scores and publish results</p>
        </div>
      </div>

      {/* Quiz selector */}
      <div className="card">
        <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-field" style={{ flex: '1 1 280px' }}>
            <label>Select Quiz</label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedQuiz?._id || ''}
                onChange={e => {
                  const q = quizzes.find(x => x._id === e.target.value);
                  if (q) loadAttempts(q);
                }}
                style={{ appearance: 'none', paddingRight: '2rem' }}
                disabled={loadingQuizzes}
              >
                <option value="">— Choose a quiz —</option>
                {quizzes.map(q => (
                  <option key={q._id} value={q._id}>{q.title} ({q.status})</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          {selectedQuiz && (
            <button
              className="btn btn-accent"
              style={{ gap: '0.4rem', alignSelf: 'flex-end', marginBottom: '0.05rem' }}
              onClick={publishResults}
              disabled={publishing || selectedQuiz.isPublished}
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {selectedQuiz.isPublished ? 'Results Published' : 'Publish Results'}
            </button>
          )}
        </div>
      </div>

      {/* Score legend */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { label: '≥ 75% — Pass',    color: 'var(--status-present)' },
          { label: '50–74% — Warning', color: 'var(--status-late)' },
          { label: '< 50% — Fail',     color: 'var(--status-absent)' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Attempts table */}
      {!selectedQuiz ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', borderStyle: 'dashed' }}>
          <BarChart3 size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <p className="serif-heading" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Select a quiz to view its gradebook</p>
        </div>
      ) : loadingAttempts ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : attempts.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          No submissions yet for this quiz.
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Tab Switches</th>
                  <th>Auto-Submit</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt, i) => {
                  const total = selectedQuiz.totalMarks || 100;
                  const pct = total > 0 ? Math.round((attempt.totalScore / total) * 100) : 0;
                  const { color, bg } = scoreColor(pct);
                  const passing = selectedQuiz.passingMarks > 0;
                  const passed = passing ? attempt.totalScore >= selectedQuiz.passingMarks : pct >= 50;
                  const hasSwitched = (attempt.tabSwitchCount || 0) > 0;
                  const hasExitedFS = (attempt.fullScreenExitCount || 0) > 0;

                  return (
                    <tr key={attempt._id}>
                      <td style={{ color: 'var(--text-tertiary)', width: 40 }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{attempt.student?.name || attempt.student}</td>
                      <td>
                        <span style={{ fontWeight: 600, color }}>
                          {attempt.totalScore ?? '—'} / {total}
                        </span>
                      </td>
                      <td>
                        <div style={{
                          display: 'inline-block',
                          background: bg, color,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 4, fontSize: '0.78rem', fontWeight: 700,
                          border: `1px solid ${color}`,
                        }}>
                          {pct}%
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${passed ? 'badge-pass' : 'badge-fail'}`}>
                          {passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td>
                        {hasSwitched || hasExitedFS ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: 'var(--status-absent-bg)', color: 'var(--status-absent)', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(234,67,53,0.2)' }}>
                            ⚠ {attempt.tabSwitchCount || 0} tab / {attempt.fullScreenExitCount || 0} FS
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--status-present)' }}>✓ Clean</span>
                        )}
                      </td>
                      <td>
                        {attempt.autoSubmitted ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                            {attempt.autoSubmitReason === 'tab_switch' ? '⚡ Tab Switch' :
                             attempt.autoSubmitReason === 'fullscreen_exit' ? '⚡ FS Exit' :
                             attempt.autoSubmitReason === 'timer' ? '⏱ Timer' : '⚡ Auto'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Manual</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                        {attempt.submittedAt
                          ? new Date(attempt.submittedAt).toLocaleString()
                          : attempt.status === 'in_progress' ? '—' : '—'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gradebook;
