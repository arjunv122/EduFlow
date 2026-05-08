import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyAttempt } from '../../api/assessmentApi';
import { Trophy, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, ShieldAlert, Clock } from 'lucide-react';

const QuizResult = () => {
  const { quizId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyAttempt(quizId);
        const data = res.data?.data;
        if (!data) { setError('No attempt found for this quiz.'); setLoading(false); return; }
        if (!data.isPublished) { setError('Results have not been published yet. Please check back later.'); setLoading(false); return; }
        setAttempt(data);
      } catch {
        setError('Failed to load quiz results.');
      }
      setLoading(false);
    };
    load();
  }, [quizId]);

  if (loading) return (
    <div className="card" style={{ padding: '4rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (error) return (
    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
      <AlertTriangle size={40} color="var(--status-absent)" style={{ margin: '0 auto 1rem' }} />
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
      <Link to="/assessments" className="btn btn-secondary">← Back to Assessments</Link>
    </div>
  );

  const quiz = attempt.quiz;
  const passed = attempt.percentage >= (quiz?.passingMarks || 0);
  const scoreColor = passed ? 'var(--status-present)' : 'var(--status-absent)';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 720, margin: '0 auto' }}>
      {/* Back */}
      <Link to="/assessments" className="btn btn-secondary" style={{ alignSelf: 'flex-start', gap: '0.4rem' }}>
        <ArrowLeft size={15} /> Back to Assessments
      </Link>

      {/* Result card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ background: passed ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #dc2626, #b91c1c)', padding: '2.5rem', textAlign: 'center' }}>
          <Trophy size={48} color="white" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '1.6rem' }}>{passed ? 'Congratulations!' : 'Better Luck Next Time'}</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '1rem' }}>{quiz?.title}</p>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Score summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
            {[
              { label: 'Score', value: `${attempt.totalScore ?? 0} / ${quiz?.totalMarks ?? '?'}`, color: scoreColor },
              { label: 'Percentage', value: `${Math.round(attempt.percentage ?? 0)}%`, color: scoreColor },
              { label: 'Result', value: passed ? 'PASSED' : 'FAILED', color: scoreColor },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '0 0 0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Proctoring summary if any issues */}
          {(attempt.tabSwitchCount > 0 || attempt.fullScreenExitCount > 0) && (
            <div style={{ background: 'rgba(234,67,53,0.08)', border: '1px solid rgba(234,67,53,0.25)', borderRadius: 8, padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <ShieldAlert size={18} color="var(--status-absent)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--status-absent)' }}>Proctoring Alerts Recorded</strong>
                <div>Tab switches: {attempt.tabSwitchCount ?? 0} · Fullscreen exits: {attempt.fullScreenExitCount ?? 0}</div>
                {attempt.autoSubmitted && <div style={{ color: 'var(--status-absent)', fontWeight: 600 }}>⚠ Quiz was auto-submitted due to a proctoring violation</div>}
              </div>
            </div>
          )}

          {/* Timing */}
          {attempt.submittedAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              <Clock size={13} />
              Submitted: {new Date(attempt.submittedAt).toLocaleString()}
            </div>
          )}

          {/* Per-question breakdown (only if showResultImmediately) */}
          {attempt.answers && attempt.answers.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Answer Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {attempt.answers.map((ans, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 8, border: `1px solid ${ans.isCorrect === true ? 'var(--status-present)' : ans.isCorrect === false ? 'var(--status-absent)' : 'var(--border)'}` }}>
                    {ans.isCorrect === true && <CheckCircle2 size={16} color="var(--status-present)" style={{ flexShrink: 0 }} />}
                    {ans.isCorrect === false && <XCircle size={16} color="var(--status-absent)" style={{ flexShrink: 0 }} />}
                    {ans.isCorrect === null && <AlertTriangle size={16} color="var(--status-late)" style={{ flexShrink: 0 }} />}
                    <div style={{ flex: 1, fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Q{idx + 1}</span>
                      {ans.selectedOption && <span style={{ marginLeft: '0.5rem', color: 'var(--text-primary)' }}>· {ans.selectedOption}</span>}
                      {ans.textAnswer && <span style={{ marginLeft: '0.5rem', color: 'var(--text-primary)' }}>· {ans.textAnswer.slice(0, 80)}</span>}
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: ans.isCorrect === true ? 'var(--status-present)' : ans.isCorrect === false ? 'var(--status-absent)' : 'var(--text-tertiary)' }}>
                      {ans.marksAwarded !== null ? `+${ans.marksAwarded}` : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
