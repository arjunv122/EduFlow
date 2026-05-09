import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuiz } from '../../api/assessmentApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, Trash2, GripVertical,
  Loader2, ArrowLeft, CheckCircle2, AlertCircle
} from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'mcq',          label: 'Multiple Choice (MCQ)' },
  { value: 'true_false',   label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'essay',        label: 'Essay' },
  { value: 'fill_blank',   label: 'Fill in the Blank' },
];

const defaultQuestion = () => ({
  id: crypto.randomUUID(),
  questionText: '',
  questionType: 'mcq',
  marks: 1,
  difficulty: 'medium',
  topic: '',
  explanation: '',
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ],
  correctAnswer: 'true',
});

const label = (text) => (
  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>
    {text}
  </label>
);

const QuestionAnswerEditor = ({ question, onChange }) => {
  const update = (field, value) => onChange({ ...question, [field]: value });

  if (question.questionType === 'mcq') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {label('Answer Options')}
        {question.options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => update('options', question.options.map((o, j) => ({ ...o, isCorrect: j === i })))}
              title="Mark as correct answer"
              style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0, border: `2px solid ${opt.isCorrect ? 'var(--status-present)' : 'var(--border)'}`,
                background: opt.isCorrect ? 'var(--status-present)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s'
              }}
            />
            <input
              type="text"
              placeholder={`Option ${i + 1}`}
              value={opt.text}
              onChange={(e) => update('options', question.options.map((o, j) => j === i ? { ...o, text: e.target.value } : o))}
              style={{ flex: 1 }}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => update('options', [...question.options, { text: '', isCorrect: false }])}
          style={{ fontSize: '0.8rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, marginTop: '0.25rem' }}
        >
          + Add option
        </button>
      </div>
    );
  }

  if (question.questionType === 'true_false') {
    return (
      <div>
        {label('Correct Answer')}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['true', 'false'].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => update('correctAnswer', val)}
              className={question.correctAnswer === val ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ textTransform: 'capitalize', padding: '0.45rem 1.25rem' }}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (['short_answer', 'fill_blank'].includes(question.questionType)) {
    return (
      <div>
        {label('Model Answer')}
        <input
          type="text"
          placeholder="Enter the expected answer…"
          value={question.correctAnswer || ''}
          onChange={(e) => update('correctAnswer', e.target.value)}
        />
      </div>
    );
  }

  return (
    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
      Essay questions are graded manually by faculty after submission.
    </p>
  );
};

const QuizBuilder = () => {
  const navigate = useNavigate();
  const [classSections, setClassSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);

  const [meta, setMeta] = useState({
    title: '',
    description: '',
    instructions: '',
    classSectionId: '',
    courseId: '',
    duration: 30,
    startDateTime: '',
    endDateTime: '',
    passingMarks: 0,
    randomizeQuestions: false,
    showResultImmediately: true,
    proctoring: { enabled: false, tabSwitchDetection: true, fullScreenEnforcement: true, autoSubmitOnSwitch: true, preventCopyPaste: true },
    status: 'draft',
  });

  const [questions, setQuestions] = useState([defaultQuestion()]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectRes, courseRes] = await Promise.all([
          api.get('/academics/classes'),
          api.get('/academics/courses'),
        ]);
        setClassSections(sectRes.data?.data || []);
        setCourses(courseRes.data?.data || []);
      } catch {
        toast.error('Failed to load class data.');
      }
    };
    fetchData();
  }, []);

  const addQuestion = () => setQuestions((prev) => [...prev, defaultQuestion()]);
  const removeQuestion = (id) => setQuestions((prev) => prev.filter((q) => q.id !== id));
  const updateQuestion = (id, updated) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...updated, id } : q)));

  const totalMarks = questions.reduce((s, q) => s + Number(q.marks || 0), 0);

  const handleSubmit = async (publishStatus = 'draft') => {
    if (!meta.title.trim()) return toast.error('Quiz title is required.');
    if (!meta.classSectionId) return toast.error('Please select a class section.');
    if (!meta.courseId) return toast.error('Please select a course.');
    if (!meta.startDateTime || !meta.endDateTime) return toast.error('Set quiz start and end times.');
    if (questions.some((q) => !q.questionText.trim())) return toast.error('All questions need text.');

    setSaving(true);
    try {
      const payload = {
        ...meta,
        classSection: meta.classSectionId,
        course: meta.courseId,
        // Convert local datetime-local values to proper UTC ISO strings
        // datetime-local gives "2026-05-09T17:50" (no TZ) — new Date() treats as local time
        startDateTime: new Date(meta.startDateTime).toISOString(),
        endDateTime: new Date(meta.endDateTime).toISOString(),
        questions: questions.map(({ id, ...q }) => q),
        status: publishStatus,
      };
      await createQuiz(payload);
      toast.success(publishStatus === 'published' ? 'Quiz published!' : 'Quiz saved as draft.');
      navigate('/assessments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ value, onToggle, color = 'var(--accent)' }) => (
    <div
      onClick={onToggle}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
        background: value ? color : 'var(--bg-tertiary)', border: `1px solid ${value ? color : 'var(--border)'}`,
        transition: 'all 0.25s ease', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        left: value ? 23 : 3, transition: 'left 0.25s ease',
      }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <button
            onClick={() => navigate('/assessments')}
            style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ padding: '0.55rem', borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex' }}>
            <BookOpen size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">Quiz Builder</h1>
            <p className="page-subtitle">Design a quiz for your class</p>
          </div>
        </div>
      </div>

      {/* Meta form */}
      <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Quiz Details</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Quiz Title — full width */}
          <div style={{ gridColumn: '1 / -1' }}>
            {label('Quiz Title *')}
            <input
              id="quiz-title"
              type="text"
              placeholder="e.g. Mid-Term Theory Test — Unit 3"
              value={meta.title}
              onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            {label('Class Section *')}
            <select
              value={meta.classSectionId}
              onChange={(e) => setMeta((m) => ({ ...m, classSectionId: e.target.value }))}
              style={{ width: '100%' }}
            >
              <option value="">Select a section…</option>
              {classSections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.course?.name || 'Course'} — Sec {s.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            {label('Course *')}
            <select
              value={meta.courseId}
              onChange={(e) => setMeta((m) => ({ ...m, courseId: e.target.value }))}
              style={{ width: '100%' }}
            >
              <option value="">Select a course…</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            {label('Duration (minutes) *')}
            <input
              type="number" min={5} value={meta.duration}
              onChange={(e) => setMeta((m) => ({ ...m, duration: Number(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            {label('Passing Marks')}
            <input
              type="number" min={0} value={meta.passingMarks}
              onChange={(e) => setMeta((m) => ({ ...m, passingMarks: Number(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            {label('Start Date & Time *')}
            <input
              type="datetime-local" value={meta.startDateTime}
              onChange={(e) => setMeta((m) => ({ ...m, startDateTime: e.target.value }))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            {label('End Date & Time *')}
            <input
              type="datetime-local" value={meta.endDateTime}
              onChange={(e) => setMeta((m) => ({ ...m, endDateTime: e.target.value }))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Instructions — full width */}
          <div style={{ gridColumn: '1 / -1' }}>
            {label('Instructions for Students')}
            <textarea
              rows={3}
              placeholder="Any special instructions the students should read before starting…"
              value={meta.instructions}
              onChange={(e) => setMeta((m) => ({ ...m, instructions: e.target.value }))}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Toggle settings */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
          {[
            { key: 'randomizeQuestions', label: 'Randomize Question Order' },
            { key: 'showResultImmediately', label: 'Show Result Immediately' },
          ].map(({ key, label: lbl }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <ToggleSwitch value={meta[key]} onToggle={() => setMeta((m) => ({ ...m, [key]: !m[key] }))} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{lbl}</span>
            </label>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <ToggleSwitch
              value={meta.proctoring.enabled}
              color="var(--status-warning)"
              onToggle={() => setMeta((m) => ({ ...m, proctoring: { ...m.proctoring, enabled: !m.proctoring.enabled } }))}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Enable Proctoring</span>
          </label>
        </div>

        {/* Expanded proctoring settings */}
        {meta.proctoring.enabled && (
          <div style={{ padding: '1rem 1.25rem', background: 'var(--status-warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(232,160,32,0.3)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Proctoring Settings</p>
            {[
              { key: 'fullScreenEnforcement', label: 'Force Full Screen Mode' },
              { key: 'tabSwitchDetection', label: 'Detect Tab Switches' },
              { key: 'autoSubmitOnSwitch', label: 'Auto-Submit on Tab Switch (immediate)' },
              { key: 'preventCopyPaste', label: 'Block Copy / Paste / Right-Click' },
            ].map(({ key, label: lbl }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <ToggleSwitch
                  value={meta.proctoring[key]}
                  color="var(--status-warning)"
                  onToggle={() => setMeta(m => ({ ...m, proctoring: { ...m.proctoring, [key]: !m.proctoring[key] } }))}
                />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{lbl}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Questions section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Questions
            <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
              ({questions.length} total · {totalMarks} marks)
            </span>
          </h2>
          <button id="add-question-btn" onClick={addQuestion} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
            <Plus size={15} /> Add Question
          </button>
        </div>

        {questions.map((question, idx) => (
          <div
            key={question.id}
            className="card"
            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '3px solid var(--accent)' }}
          >
            {/* Question header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                <GripVertical size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid var(--border-accent)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {idx + 1}
                </span>
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <select
                  value={question.questionType}
                  onChange={(e) => updateQuestion(question.id, { ...question, questionType: e.target.value })}
                  style={{ width: '100%', fontSize: '0.875rem', padding: '0.45rem 0.75rem' }}
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                <input
                  type="number" min={0.5} step={0.5}
                  value={question.marks}
                  onChange={(e) => updateQuestion(question.id, { ...question, marks: Number(e.target.value) })}
                  style={{ fontSize: '0.875rem', padding: '0.45rem 0.75rem', width: 80, textAlign: 'center' }}
                  placeholder="Marks"
                />

                <select
                  value={question.difficulty}
                  onChange={(e) => updateQuestion(question.id, { ...question, difficulty: e.target.value })}
                  style={{ width: '100%', fontSize: '0.875rem', padding: '0.45rem 0.75rem' }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <button
                onClick={() => removeQuestion(question.id)}
                disabled={questions.length === 1}
                style={{ padding: '0.4rem', borderRadius: 8, background: 'transparent', border: '1px solid transparent', color: 'var(--status-absent)', cursor: 'pointer', opacity: questions.length === 1 ? 0.3 : 1 }}
                title="Remove question"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Question text */}
            <textarea
              rows={2}
              placeholder={`Question ${idx + 1} text…`}
              value={question.questionText}
              onChange={(e) => updateQuestion(question.id, { ...question, questionText: e.target.value })}
              style={{ width: '100%', resize: 'vertical' }}
            />

            <QuestionAnswerEditor
              question={question}
              onChange={(updated) => updateQuestion(question.id, updated)}
            />

            <div>
              {label('Explanation (shown after grading)')}
              <input
                type="text"
                placeholder="Optionally explain the correct answer…"
                value={question.explanation}
                onChange={(e) => updateQuestion(question.id, { ...question, explanation: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          Total: <strong style={{ color: 'var(--text-primary)' }}>{questions.length} questions</strong>,{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{totalMarks} marks</strong>
        </span>
        {meta.passingMarks > 0 && (
          <span style={{ color: 'var(--text-secondary)' }}>
            Passing: <strong style={{ color: 'var(--status-present)' }}>{meta.passingMarks} marks</strong>{' '}
            ({((meta.passingMarks / totalMarks) * 100).toFixed(0)}%)
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button onClick={() => handleSubmit('draft')} disabled={saving} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertCircle size={16} />}
          Save as Draft
        </button>
        <button id="publish-quiz-btn" onClick={() => handleSubmit('published')} disabled={saving} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
          Publish Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizBuilder;
