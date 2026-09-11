import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  PlusCircle,
  Trash2,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Filter,
  ShieldCheck,
} from 'lucide-react';

export const AdminTeacherAssignmentsPage = () => {
  const { user } = useAuth();
  const [hierarchy, setHierarchy] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [maxLimit, setMaxLimit] = useState(5);
  const [loading, setLoading] = useState(true);

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [assignedSubject, setAssignedSubject] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hierRes, teachersRes, setRes] = await Promise.all([
        api.get('/academic/hierarchy').catch(() => ({ data: { hierarchy: [] } })),
        api.get('/users?role=TEACHER').catch(() => ({ data: { users: [] } })),
        api.get('/academic/settings').catch(() => ({ data: { settings: { maxTeachersPerSection: 5 } } })),
      ]);

      if (hierRes.data?.hierarchy) setHierarchy(hierRes.data.hierarchy);
      if (teachersRes.data?.users) setTeachers(teachersRes.data.users);
      if (setRes.data?.settings?.maxTeachersPerSection) {
        setMaxLimit(setRes.data.settings.maxTeachersPerSection);
      }
    } catch (err) {
      console.error('Error loading allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = (section) => {
    setSelectedSectionId(section._id);
    setSelectedTeacherId(teachers[0]?._id || '');
    setAssignedSubject('Data Structures & Algorithms');
    setAssignError('');
    setAssignModalOpen(true);
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!selectedSectionId || !selectedTeacherId || !assignedSubject.trim()) return;
    try {
      setAssignLoading(true);
      setAssignError('');
      await api.post(`/academic/sections/${selectedSectionId}/teachers`, {
        teacherId: selectedTeacherId,
        subject: assignedSubject.trim(),
      });
      setAssignModalOpen(false);
      fetchData();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Failed to assign teacher.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this teacher assignment?')) return;
    try {
      await api.delete(`/academic/teacher-assignments/${assignmentId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing teacher');
    }
  };

  // Flatten all sections from hierarchy
  const allSections = [];
  hierarchy.forEach((dept) => {
    dept.years?.forEach((yr) => {
      const secs = dept.sectionsByYear?.[yr] || [];
      secs.forEach((s) => {
        allSections.push({
          ...s,
          deptName: dept.name,
          deptCode: dept.code,
        });
      });
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600" />
            Teacher Section Allocation Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Assign subject faculty to academic sections while enforcing the institutional limit of maximum {maxLimit} teachers per section.
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold self-start flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Active Enforcement: Max {maxLimit} Teachers / Section</span>
        </div>
      </div>

      {/* Sections Allocation Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading section allocations...</div>
      ) : allSections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No sections configured. Please create academic sections first in Academic Management.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allSections.map((sec) => {
            const currentCount = sec.teacherCount || 0;
            const isAtMaxLimit = currentCount >= maxLimit;

            return (
              <div
                key={sec._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-xs">
                      {sec.deptCode} • Year {sec.year}
                    </span>
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                        isAtMaxLimit
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {currentCount} / {maxLimit} Teachers
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Section {sec.sectionName}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Enrolled: {sec.studentCount || 60} Students • {sec.deptName}
                    </p>
                  </div>

                  {/* Assigned Teachers List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Assigned Faculty & Courses:
                    </p>

                    {sec.assignedTeachers?.length > 0 ? (
                      <div className="space-y-1.5">
                        {sec.assignedTeachers.map((t, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs"
                          >
                            <div className="truncate pr-2">
                              <p className="font-bold text-slate-900 truncate">{t.name}</p>
                              <p className="text-[10px] text-indigo-600 font-semibold truncate">{t.subject}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveAssignment(t.id)}
                              title="Remove teacher from section"
                              className="text-slate-400 hover:text-rose-600 transition p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No teachers allocated yet.</p>
                    )}
                  </div>
                </div>

                {/* Assign Button */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    disabled={isAtMaxLimit}
                    onClick={() => handleOpenAssignModal(sec)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isAtMaxLimit
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isAtMaxLimit ? 'Max Teachers Limit Reached' : 'Assign Faculty'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ASSIGN TEACHER MODAL */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Assign Teacher to Section</h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAssignTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Faculty Member:</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Subject / Course Module:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={assignedSubject}
                  onChange={(e) => setAssignedSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {assignError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{assignError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
