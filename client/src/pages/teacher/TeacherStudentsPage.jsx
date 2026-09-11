import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
} from 'lucide-react';

export const TeacherStudentsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [teacherScopes, setTeacherScopes] = useState([]);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null);

  // Add Student Form State
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: 'CSE',
    program: 'B.Tech',
    year: 3,
    section: 'A',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  // Bulk Upload State
  const [csvFile, setCsvFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  useEffect(() => {
    fetchTeacherScopes();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, selectedSection, searchTerm]);

  const fetchTeacherScopes = async () => {
    try {
      const res = await api.get('/academic/my-scopes');
      if (res.data?.scopes) {
        setTeacherScopes(res.data.scopes);
        if (res.data.scopes.length > 0 && selectedSection === 'ALL') {
          // Keep ALL as default to view all sections
        }
      }
    } catch (err) {
      console.error('Error fetching teacher scopes:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let queryUrl = `/academic/students?page=${currentPage}&limit=10`;
      if (searchTerm.trim()) {
        queryUrl += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }
      if (selectedSection !== 'ALL') {
        const [dept, yr, sec] = selectedSection.split('-');
        if (dept && yr && sec) {
          queryUrl += `&department=${dept}&year=${yr}&section=${sec}`;
        }
      }
      const res = await api.get(queryUrl);
      if (res.data) {
        setStudents(res.data.students || []);
        setTotalStudents(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      setAddMessage('');
      await api.post('/academic/students', newStudent);
      setAddMessage('Student enrolled successfully!');
      setTimeout(() => {
        setAddModalOpen(false);
        setAddMessage('');
        setNewStudent({
          name: '',
          email: '',
          rollNumber: '',
          department: 'CSE',
          program: 'B.Tech',
          year: 3,
          section: 'A',
        });
        fetchStudents();
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating student');
    } finally {
      setAddLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    try {
      setBulkLoading(true);
      setBulkResult(null);
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await api.post('/academic/students/bulk-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBulkResult(res.data);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing CSV file');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownloadStudentPDF = async (studentId, rollNumber) => {
    try {
      const res = await api.get(`/reports/student/${studentId}/progress-pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Student_${rollNumber || 'Report'}_Progress.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Could not download student progress report PDF.');
    }
  };

  const handleExportRosterCSV = () => {
    let dept = 'CSE';
    let yr = '3';
    let sec = 'A';
    if (selectedSection !== 'ALL') {
      const parts = selectedSection.split('-');
      if (parts.length === 3) {
        dept = parts[0];
        yr = parts[1];
        sec = parts[2];
      }
    }
    window.open(`http://localhost:5000/api/reports/section-csv?department=${dept}&year=${yr}&section=${sec}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            My Students Roster
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage student enrollments, monitor individual progress, and export academic rosters across your assigned sections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportRosterCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Roster CSV
          </button>
          <button
            onClick={() => setBulkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" />
            Bulk CSV Import
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Student
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student by name, roll number, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Section Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSection}
            onChange={(e) => {
              setSelectedSection(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All My Sections ({totalStudents} Students)</option>
            {teacherScopes.map((sc, i) => (
              <option key={i} value={`${sc.departmentCode}-${sc.year}-${sc.sectionName}`}>
                {sc.departmentCode} Year {sc.year} - Sec {sc.sectionName} ({sc.subject})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading student roster...</div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No students found matching your search or assigned sections.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Section & Year</th>
                  <th className="py-3 px-4">Tests Taken</th>
                  <th className="py-3 px-4">Avg Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {s.name ? s.name[0].toUpperCase() : 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-[11px] text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {s.rollNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[11px]">
                        {s.department || 'CSE'} - Yr {s.year || 3} ({s.section || 'A'})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {s.stats?.testsCompleted || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-600">
                        {s.stats?.averageScore || 0}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {s.stats?.accuracy || 0}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedStudentForProgress(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                        >
                          View Diagnostics
                        </button>
                        <button
                          onClick={() => handleDownloadStudentPDF(s._id, s.rollNumber)}
                          title="Download Progress PDF"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {currentPage} of {totalPages} ({totalStudents} total students)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD SINGLE STUDENT */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Enroll Single Student</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address:</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. student@examsphere.com"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2101330100042"
                  value={newStudent.rollNumber}
                  onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department:</label>
                  <input
                    type="text"
                    required
                    value={newStudent.department}
                    onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Program:</label>
                  <input
                    type="text"
                    required
                    value={newStudent.program}
                    onChange={(e) => setNewStudent({ ...newStudent, program: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year (1-4):</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    required
                    value={newStudent.year}
                    onChange={(e) => setNewStudent({ ...newStudent, year: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section:</label>
                  <input
                    type="text"
                    required
                    value={newStudent.section}
                    onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {addMessage && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold">
                  {addMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {addLoading ? 'Saving...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK CSV UPLOAD */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Bulk CSV Student Import</h3>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-500 space-y-2">
              <p>Upload a standard CSV file with student records. Required columns:</p>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700">
                name, email, rollNumber, department, program, year, section
              </div>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              {bulkResult && (
                <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl font-medium space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    {bulkResult.message}
                  </p>
                  <p>Successfully processed: {bulkResult.createdCount} students.</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading || !csvFile}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {bulkLoading ? 'Uploading & Processing...' : 'Upload & Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT DIAGNOSTIC PROGRESS */}
      {selectedStudentForProgress && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedStudentForProgress.name}</h3>
                <p className="text-xs text-slate-500">
                  Roll No: {selectedStudentForProgress.rollNumber || 'N/A'} • {selectedStudentForProgress.department} Year {selectedStudentForProgress.year} ({selectedStudentForProgress.section})
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForProgress(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-indigo-700">Tests Taken</p>
                <p className="text-lg font-black text-indigo-900">{selectedStudentForProgress.stats?.testsCompleted || 0}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-emerald-700">Avg Score</p>
                <p className="text-lg font-black text-emerald-900">{selectedStudentForProgress.stats?.averageScore || 0}%</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-amber-700">Accuracy</p>
                <p className="text-lg font-black text-amber-900">{selectedStudentForProgress.stats?.accuracy || 0}%</p>
              </div>
            </div>

            {/* Diagnostic Needs Revision Alert */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                Academic Diagnostic Insights
              </h4>
              <p className="text-xs text-slate-600">
                {selectedStudentForProgress.stats?.averageScore >= 60
                  ? 'Student exhibits consistent topic retention. Recommended to attempt advanced algorithmic modules.'
                  : 'Student is flagged in diagnostic tracking for supplemental unit revision in foundation concepts.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleDownloadStudentPDF(selectedStudentForProgress._id, selectedStudentForProgress.rollNumber)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Download Full Progress PDF
              </button>
              <button
                onClick={() => setSelectedStudentForProgress(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
