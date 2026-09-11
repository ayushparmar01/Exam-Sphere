import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle,
  Users,
  Calendar,
  Send,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const TeacherAssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherScopes, setTeacherScopes] = useState([]);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    subject: '',
    department: 'CSE',
    year: 3,
    section: 'A',
    scope: 'SECTION',
    dueDate: '',
    maxMarks: 20,
    instructions: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');

  // Submissions View
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Grade Modal
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [marksToAward, setMarksToAward] = useState(0);
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [gradingLoading, setGradingLoading] = useState(false);

  useEffect(() => {
    fetchTeacherScopes();
    fetchAssignments();
  }, []);

  const fetchTeacherScopes = async () => {
    try {
      const res = await api.get('/academic/my-scopes');
      if (res.data?.scopes) {
        setTeacherScopes(res.data.scopes);
        if (res.data.scopes.length > 0) {
          const first = res.data.scopes[0];
          setNewAssignment((prev) => ({
            ...prev,
            department: first.departmentCode,
            year: first.year,
            section: first.sectionName,
            subject: first.subject || 'Data Structures & Algorithms',
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching teacher scopes:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      if (res.data?.assignments) {
        setAssignments(res.data.assignments);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setCreateSuccess('');
      await api.post('/assignments', newAssignment);
      setCreateSuccess('Assignment created and published successfully!');
      setTimeout(() => {
        setCreateModalOpen(false);
        setCreateSuccess('');
        setNewAssignment({
          title: '',
          description: '',
          subject: teacherScopes[0]?.subject || '',
          department: teacherScopes[0]?.departmentCode || 'CSE',
          year: teacherScopes[0]?.year || 3,
          section: teacherScopes[0]?.sectionName || 'A',
          scope: 'SECTION',
          dueDate: '',
          maxMarks: 20,
          instructions: '',
        });
        fetchAssignments();
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating assignment');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewSubmissions = async (asg) => {
    if (selectedAssignment?._id === asg._id) {
      setSelectedAssignment(null);
      setSubmissions([]);
      return;
    }
    try {
      setSelectedAssignment(asg);
      setSubmissionsLoading(true);
      const res = await api.get(`/assignments/${asg._id}/submissions`);
      if (res.data?.submissions) {
        setSubmissions(res.data.submissions);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    try {
      setGradingLoading(true);
      await api.post(`/assignments/submissions/${gradingSubmission._id}/grade`, {
        marksObtained: Number(marksToAward),
        feedback: gradingFeedback,
      });
      // Refresh submissions
      const res = await api.get(`/assignments/${selectedAssignment._id}/submissions`);
      if (res.data?.submissions) {
        setSubmissions(res.data.submissions);
      }
      setGradingSubmission(null);
      setMarksToAward(0);
      setGradingFeedback('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error grading submission');
    } finally {
      setGradingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-600" />
            Course Assignments & Deliverables
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Create scoped assignments for your sections, evaluate submissions, and provide qualitative student feedback.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Assignment
        </button>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading course assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No assignments created yet. Click "Create New Assignment" to publish your first task.
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((asg) => {
            const isSelected = selectedAssignment?._id === asg._id;
            return (
              <div
                key={asg._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition"
              >
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 text-xs">
                        {asg.subject}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        Target: {asg.department} Year {asg.year} (Sec {asg.section || 'All'})
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{asg.title}</h3>
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">{asg.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {new Date(asg.dueDate).toLocaleDateString()}
                      </span>
                      <span>Max Marks: {asg.maxMarks}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-auto">
                    <button
                      onClick={() => handleViewSubmissions(asg)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Hide Submissions' : 'View Submissions'}</span>
                      {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Submissions Section */}
                {isSelected && (
                  <div className="p-6 bg-slate-50/80 border-t border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Student Submissions ({submissions.length})
                      </h4>
                    </div>

                    {submissionsLoading ? (
                      <div className="py-6 text-center text-xs text-slate-400">Loading submissions...</div>
                    ) : submissions.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No submissions received yet for this assignment.
                      </div>
                    ) : (
                      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">Student</th>
                              <th className="py-3 px-4">Roll Number</th>
                              <th className="py-3 px-4">Submission Notes / Link</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Status & Score</th>
                              <th className="py-3 px-4 text-right">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {submissions.map((sub) => (
                              <tr key={sub._id} className="hover:bg-slate-50/60 transition">
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  {sub.studentId?.name || 'Student'}
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-700">
                                  {sub.studentId?.rollNumber || 'N/A'}
                                </td>
                                <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                                  {sub.submissionText || 'Uploaded attachment'}
                                </td>
                                <td className="py-3 px-4 text-slate-400">
                                  {new Date(sub.submittedAt).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      sub.status === 'GRADED'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    {sub.status === 'GRADED'
                                      ? `${sub.marksObtained} / ${asg.maxMarks} Marks`
                                      : 'NEEDS GRADING'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => {
                                      setGradingSubmission(sub);
                                      setMarksToAward(sub.marksObtained || 0);
                                      setGradingFeedback(sub.feedback || '');
                                    }}
                                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition"
                                  >
                                    {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Course Assignment</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Pattern Implementation: Strategy & Factory"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={newAssignment.subject}
                  onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Target Section Picker from teacher scopes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Section Scope:</label>
                <select
                  value={`${newAssignment.department}-${newAssignment.year}-${newAssignment.section}`}
                  onChange={(e) => {
                    const [d, y, s] = e.target.value.split('-');
                    setNewAssignment({
                      ...newAssignment,
                      department: d,
                      year: Number(y),
                      section: s,
                    });
                  }}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {teacherScopes.map((sc, i) => (
                    <option key={i} value={`${sc.departmentCode}-${sc.year}-${sc.sectionName}`}>
                      {sc.departmentCode} Year {sc.year} - Section {sc.sectionName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Marks:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newAssignment.maxMarks}
                    onChange={(e) => setNewAssignment({ ...newAssignment, maxMarks: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date:</label>
                  <input
                    type="date"
                    required
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summary of assignment objectives..."
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Submission Instructions:</label>
                <textarea
                  rows={2}
                  placeholder="Specific guidelines for report formatting, code repo links, or benchmarks..."
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {createSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold">
                  {createSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {createLoading ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADE SUBMISSION MODAL */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Grade Student Submission</h3>
                <p className="text-xs text-slate-500">
                  Student: {gradingSubmission.studentId?.name} ({gradingSubmission.studentId?.rollNumber})
                </p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-700">Submission Content:</p>
              <p className="text-slate-600 whitespace-pre-wrap">{gradingSubmission.submissionText}</p>
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Marks Awarded (Max: {selectedAssignment?.maxMarks || 20}):
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedAssignment?.maxMarks || 100}
                  required
                  value={marksToAward}
                  onChange={(e) => setMarksToAward(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qualitative Feedback:</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Excellent unit test coverage. Edge case logic well-structured."
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gradingLoading}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {gradingLoading ? 'Saving...' : 'Save Grade & Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
