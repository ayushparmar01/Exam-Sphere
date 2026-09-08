import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Loader2,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const AdminAIQuestionGenPage = () => {
  const [subject, setSubject] = useState('DSA');
  const [topic, setTopic] = useState('Graph Theory');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [generatedMode, setGeneratedMode] = useState('');
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [selectedToApprove, setSelectedToApprove] = useState([]);
  const [approving, setApproving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch currently pending questions on load
  const fetchPending = async () => {
    try {
      const res = await api.get('/questions?status=Pending Review&limit=50');
      if (res.data && res.data.data) {
        setPendingQuestions(res.data.data);
        setSelectedToApprove(res.data.data.map((q) => q._id));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMessage('');

      const res = await api.post('/ai/generate-questions', {
        subject,
        topic,
        difficulty,
        count: Number(count),
        autoSave: true, // auto-saves with status: Pending Review
      });

      if (res.data) {
        setGeneratedMode(res.data.modeLabel || res.data.mode);
        setStatusMessage(`Generated ${res.data.count} items using ${res.data.modeLabel}. Review below before promoting to active exam pools.`);
        fetchPending();
      }
    } catch (err) {
      alert('Generation request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedToApprove.includes(id)) {
      setSelectedToApprove(selectedToApprove.filter((qId) => qId !== id));
    } else {
      setSelectedToApprove([...selectedToApprove, id]);
    }
  };

  const handleApproveBatch = async () => {
    if (selectedToApprove.length === 0) return;
    try {
      setApproving(true);
      await api.patch('/ai/approve-questions', { questionIds: selectedToApprove });
      setStatusMessage(`Approved ${selectedToApprove.length} questions into Active Question Bank!`);
      fetchPending();
    } catch (err) {
      alert('Approval failed.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-200">
            Intelligent Item Synthesis
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Question Synthesizer & Review Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Generate rigorous technical MCQs using <strong>Gemini AI Mode</strong> or the deterministic <strong>Rule-Based Recommendation Engine</strong>.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
        <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Human-in-the-Loop Safeguard:</p>
          <p className="text-amber-800 leading-relaxed">
            AI-generated questions enter the <strong>"Pending Review"</strong> queue and are never dispatched to public candidate examinations until explicitly reviewed and approved by an authorized administrator.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Generator Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Synthesize Questions
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            Engine Mode: Gemini AI (w/ Rule-Based Fallback)
          </span>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. DSA, DBMS"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Topic</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Dynamic Programming"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Count</label>
              <input
                type="number"
                min="1"
                max="10"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-purple-200 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Technical Items...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Review Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pending Review Queue ({pendingQuestions.length} items)
            </h3>
            <p className="text-xs text-slate-400">
              Select items to verify and promote into the Active Question Bank.
            </p>
          </div>

          {pendingQuestions.length > 0 && (
            <button
              onClick={handleApproveBatch}
              disabled={approving || selectedToApprove.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Approve {selectedToApprove.length} Selected Questions</span>
            </button>
          )}
        </div>

        {pendingQuestions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-700">Review Queue is Empty</p>
            <p>Generate items above to populate the verification queue.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingQuestions.map((q) => {
              const isSelected = selectedToApprove.includes(q._id);
              return (
                <div
                  key={q._id}
                  className={`p-5 rounded-2xl border-2 transition space-y-3 ${
                    isSelected ? 'border-purple-300 bg-purple-50/20' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(q._id)}
                        className="w-4 h-4 rounded text-purple-600"
                      />
                      <span>{q.subject} • {q.topic} ({q.difficulty})</span>
                    </label>
                    <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[10px] font-bold">
                      Pending Review
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{q.questionText}</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          opt.id === q.correctAnswer
                            ? 'border-emerald-400 bg-emerald-50/70 text-emerald-950 font-semibold'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-bold">{opt.id}:</span>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
