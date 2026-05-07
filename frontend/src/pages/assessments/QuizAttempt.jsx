import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { startQuiz, submitQuiz } from '../../api/assessmentApi';
import toast from 'react-hot-toast';
import { Shield, AlertTriangle, Clock, CheckCircle2, MonitorUp } from 'lucide-react';

const QuizAttempt = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [showProctorWarning, setShowProctorWarning] = useState(false);
  const [fullScreenActive, setFullScreenActive] = useState(false);

  // Proctoring state
  const tabSwitchCountRef = useRef(0);
  const fullScreenExitCountRef = useRef(0);
  const proctorLogRef = useRef([]);
  const hasAutoSubmittedRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // ── Load Quiz ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await startQuiz(quizId);
        const data = res.data;
        const q = data.quiz || data.data?.quiz;
        const a = data.attempt || data.data?.attempt;
        if (a?.status !== 'in_progress') {
          toast.error('Quiz already submitted');
          navigate('/student/assessments');
          return;
        }
        setQuiz(q);
        setAttempt(a);
        setTimeLeft(q.duration * 60);

        // If proctoring enabled, show warning before fullscreen
        if (q.proctoring?.enabled) {
          setShowProctorWarning(true);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load quiz');
        navigate('/student/assessments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId, navigate]);

  // ── Auto-submit helper ──────────────────────────────────────────────
  const handleAutoSubmit = useCallback(async (reason) => {
    if (hasAutoSubmittedRef.current || isSubmittingRef.current) return;
    hasAutoSubmittedRef.current = true;
    isSubmittingRef.current = true;

    const ansArray = Object.entries(answers).map(([qId, val]) => ({
      questionId: qId,
      selectedOption: typeof val === 'string' ? val : val?.selected,
      textAnswer: typeof val === 'object' ? val?.text : undefined,
    }));

    try {
      await submitQuiz(quizId, ansArray, true, {
        tabSwitchCount: tabSwitchCountRef.current,
        fullScreenExitCount: fullScreenExitCountRef.current,
        autoSubmitReason: reason,
        proctorLog: proctorLogRef.current,
      });
      setSubmitted(true);
      toast.error(`Quiz auto-submitted: ${reason === 'tab_switch' ? 'Tab switch detected' : reason === 'fullscreen_exit' ? 'Fullscreen exited' : 'Time expired'}`);
    } catch {
      toast.error('Auto-submission failed');
    }
    isSubmittingRef.current = false;
  }, [answers, quizId]);

  // ── Proctoring: Tab switch detection ────────────────────────────────
  useEffect(() => {
    if (!quiz?.proctoring?.enabled || !quiz?.proctoring?.tabSwitchDetection || showProctorWarning) return;

    const handleVisibility = () => {
      if (document.hidden && !hasAutoSubmittedRef.current) {
        tabSwitchCountRef.current++;
        proctorLogRef.current.push({ event: 'tab_switch', timestamp: new Date() });

        if (quiz.proctoring.autoSubmitOnSwitch) {
          handleAutoSubmit('tab_switch');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [quiz, handleAutoSubmit, showProctorWarning]);

  // ── Proctoring: Fullscreen detection ────────────────────────────────
  useEffect(() => {
    if (!quiz?.proctoring?.enabled || !quiz?.proctoring?.fullScreenEnforcement || showProctorWarning) return;

    const handleFSChange = () => {
      const isFull = !!document.fullscreenElement;
      setFullScreenActive(isFull);

      if (!isFull && !hasAutoSubmittedRef.current && !showProctorWarning) {
        fullScreenExitCountRef.current++;
        proctorLogRef.current.push({ event: 'fullscreen_exit', timestamp: new Date() });
        handleAutoSubmit('fullscreen_exit');
      }
    };

    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, [quiz, handleAutoSubmit, showProctorWarning]);

  // ── Proctoring: Prevent copy/paste/right-click ──────────────────────
  useEffect(() => {
    if (!quiz?.proctoring?.enabled || !quiz?.proctoring?.preventCopyPaste) return;

    const prevent = (e) => e.preventDefault();
    document.addEventListener('copy', prevent);
    document.addEventListener('paste', prevent);
    document.addEventListener('cut', prevent);
    document.addEventListener('contextmenu', prevent);

    return () => {
      document.removeEventListener('copy', prevent);
      document.removeEventListener('paste', prevent);
      document.removeEventListener('cut', prevent);
      document.removeEventListener('contextmenu', prevent);
    };
  }, [quiz]);

  // ── Timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) {
      handleAutoSubmit('timer');
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted, handleAutoSubmit]);

  // ── Enter Fullscreen ────────────────────────────────────────────────
  const enterFullScreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullScreenActive(true);
      setShowProctorWarning(false);
    } catch {
      toast.error('Failed to enter fullscreen. Please allow fullscreen access.');
    }
  };

  // ── Manual Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const ansArray = Object.entries(answers).map(([qId, val]) => ({
      questionId: qId,
      selectedOption: typeof val === 'string' ? val : val?.selected,
      textAnswer: typeof val === 'object' ? val?.text : undefined,
    }));

    try {
      await submitQuiz(quizId, ansArray, false, {
        tabSwitchCount: tabSwitchCountRef.current,
        fullScreenExitCount: fullScreenExitCountRef.current,
        autoSubmitReason: null,
        proctorLog: proctorLogRef.current,
      });
      setSubmitted(true);
      if (document.fullscreenElement) document.exitFullscreen();
      toast.success('Quiz submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
    isSubmittingRef.current = false;
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="card" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Loading quiz…</p>
      </div>
    );
  }

  // ── Submitted ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 500, margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--status-present)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={32} color="white" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Quiz Submitted!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Your answers have been recorded. Results will be available once published by your faculty.
          </p>
          <button onClick={() => navigate('/student/assessments')} className="btn btn-accent" style={{ margin: '0 auto' }}>
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  // ── Proctor Warning Screen ──────────────────────────────────────────
  if (showProctorWarning) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card animate-fade-in" style={{ maxWidth: 520, textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #C4780A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Shield size={32} color="white" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Proctored Quiz</h2>
          <div style={{ textAlign: 'left', padding: '1rem 1.25rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>This quiz has proctoring enabled. Rules:</p>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.25rem', margin: 0 }}>
              {quiz?.proctoring?.fullScreenEnforcement && <li><strong>Full Screen Required</strong> — You must stay in fullscreen mode</li>}
              {quiz?.proctoring?.tabSwitchDetection && <li><strong>No Tab Switching</strong> — Switching tabs will auto-submit your quiz</li>}
              {quiz?.proctoring?.preventCopyPaste && <li><strong>No Copy/Paste</strong> — Copy, paste, and right-click are disabled</li>}
              <li><strong>Time Limit</strong> — {quiz?.duration} minutes</li>
            </ul>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={enterFullScreen} className="btn btn-accent" style={{ gap: '0.5rem', padding: '0.75rem 2rem', fontSize: '0.9rem' }}>
              <MonitorUp size={18} /> Enter Fullscreen & Start Quiz
            </button>
            <button onClick={() => navigate('/student/assessments')} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz UI ─────────────────────────────────────────────────────────
  const questions = quiz?.questions || [];
  const q = questions[currentQ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{quiz?.title}</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
            Question {currentQ + 1} of {questions.length}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {quiz?.proctoring?.enabled && (
            <div className="badge badge-warning" style={{ gap: '0.3rem', fontSize: '0.7rem' }}>
              <Shield size={12} /> Proctored
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
            background: timeLeft < 60 ? 'var(--status-absent-bg)' : timeLeft < 300 ? 'var(--status-warning-bg)' : 'var(--bg-tertiary)',
            color: timeLeft < 60 ? 'var(--status-absent)' : timeLeft < 300 ? '#E8A020' : 'var(--text-primary)',
            fontWeight: 700, fontSize: '1rem', fontFamily: 'monospace',
            border: '1px solid var(--border)',
          }}>
            <Clock size={14} /> {formatTime(timeLeft || 0)}
          </div>
        </div>
      </div>

      {/* Question Card */}
      {q && (
        <div className="card" style={{ padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ background: 'var(--accent)', color: 'var(--text-inverse)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
              {currentQ + 1}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {q.marks || 1} mark{(q.marks || 1) > 1 ? 's' : ''} · {q.questionType?.toUpperCase()}
            </span>
          </div>

          <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {q.questionText}
          </p>

          {/* MCQ / True-False Options */}
          {['mcq', 'true_false'].includes(q.questionType) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(q.questionType === 'true_false' ? [{ text: 'True' }, { text: 'False' }] : q.options || []).map((opt, idx) => {
                const isSelected = answers[q._id] === opt.text;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers(prev => ({ ...prev, [q._id]: opt.text }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
                      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <span style={{ width: 22, height: 22, borderRadius: '50%', border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelected && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          )}

          {/* Short Answer / Essay */}
          {['short_answer', 'essay'].includes(q.questionType) && (
            <textarea
              placeholder="Type your answer here..."
              value={answers[q._id]?.text || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [q._id]: { text: e.target.value } }))}
              style={{
                width: '100%', minHeight: q.questionType === 'essay' ? 180 : 80,
                resize: 'vertical', padding: '0.75rem',
              }}
            />
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
          disabled={currentQ === 0}
          className="btn btn-secondary"
        >
          ← Previous
        </button>

        {/* Question dots */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQ(idx)}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: idx === currentQ ? 'var(--accent)' : answers[questions[idx]?._id] ? 'var(--status-present)' : 'var(--bg-tertiary)',
                color: idx === currentQ || answers[questions[idx]?._id] ? 'white' : 'var(--text-secondary)',
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQ === questions.length - 1 ? (
          <button onClick={handleSubmit} className="btn btn-accent" style={{ gap: '0.4rem' }}>
            <CheckCircle2 size={15} /> Submit Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQ(c => Math.min(questions.length - 1, c + 1))}
            className="btn btn-accent"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizAttempt;
