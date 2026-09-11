import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  PlusCircle,
  Settings,
  Layers,
  CheckCircle,
  AlertCircle,
  Save,
  Building,
} from 'lucide-react';

export const AdminAcademicManagementPage = () => {
  const { user } = useAuth();
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);

  // System Setting: maxTeachersPerSection
  const [maxTeachers, setMaxTeachers] = useState(5);
  const [savingSetting, setSavingSetting] = useState(false);
  const [settingSuccess, setSettingSuccess] = useState('');

  // Modals
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    programs: 'B.Tech, M.Tech',
    years: '1, 2, 3, 4',
  });
  const [deptLoading, setDeptLoading] = useState(false);

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [newSection, setNewSection] = useState({
    departmentCode: 'CSE',
    program: 'B.Tech',
    year: 3,
    sectionName: 'A',
    academicYear: '2025-2026',
    studentCount: 60,
  });
  const [sectionLoading, setSectionLoading] = useState(false);

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      setLoading(true);
      const [hierRes, setRes] = await Promise.all([
        api.get('/academic/hierarchy').catch(() => ({ data: { hierarchy: [] } })),
        api.get('/academic/settings').catch(() => ({ data: { settings: { maxTeachersPerSection: 5 } } })),
      ]);

      if (hierRes.data?.hierarchy) setHierarchy(hierRes.data.hierarchy);
      if (setRes.data?.settings?.maxTeachersPerSection) {
        setMaxTeachers(setRes.data.settings.maxTeachersPerSection);
      }
    } catch (err) {
      console.error('Error fetching academic setup:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (e) => {
    e.preventDefault();
    try {
      setSavingSetting(true);
      setSettingSuccess('');
      await api.put('/academic/settings', {
        key: 'maxTeachersPerSection',
        value: Number(maxTeachers),
        description: 'Maximum number of teachers that can be assigned to a single section',
      });
      setSettingSuccess('Limit updated successfully!');
      setTimeout(() => setSettingSuccess(''), 2500);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating settings');
    } finally {
      setSavingSetting(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      setDeptLoading(true);
      const programsArr = newDept.programs.split(',').map((p) => p.trim()).filter(Boolean);
      const yearsArr = newDept.years.split(',').map((y) => Number(y.trim())).filter((n) => !isNaN(n));

      await api.post('/academic/departments', {
        name: newDept.name,
        code: newDept.code.toUpperCase(),
        programs: programsArr,
        years: yearsArr,
      });

      setDeptModalOpen(false);
      setNewDept({ name: '', code: '', programs: 'B.Tech, M.Tech', years: '1, 2, 3, 4' });
      fetchAcademicData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating department');
    } finally {
      setDeptLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      setSectionLoading(true);
      await api.post('/academic/sections', newSection);
      setSectionModalOpen(false);
      setNewSection({
        departmentCode: 'CSE',
        program: 'B.Tech',
        year: 3,
        sectionName: 'A',
        academicYear: '2025-2026',
        studentCount: 60,
      });
      fetchAcademicData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating section');
    } finally {
      setSectionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            Institutional Academic Architecture
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Configure college departments, program cohorts, academic years, sections, and faculty allocation policies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setDeptModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2"
          >
            <Building className="w-3.5 h-3.5 text-slate-500" />
            Add Department
          </button>
          <button
            onClick={() => setSectionModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Section
          </button>
        </div>
      </div>

      {/* Platform Policy Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              Teacher Section Allocation Policy
            </h2>
            <p className="text-xs text-slate-500">
              Enforce strict institutional constraint on the maximum number of teachers permitted per section (Default: 5).
            </p>
          </div>

          <form onSubmit={handleSaveSetting} className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Max Teachers / Section:</label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={maxTeachers}
                onChange={(e) => setMaxTeachers(e.target.value)}
                className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingSetting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {savingSetting ? 'Saving...' : 'Save Policy'}
            </button>
          </form>
        </div>

        {settingSuccess && (
          <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {settingSuccess}
          </div>
        )}
      </div>

      {/* Academic Hierarchy Tree View */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Configured Academic Departments</h2>
          <span className="text-xs text-slate-400 font-semibold">{hierarchy.length} Active Departments</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading academic hierarchy...</div>
        ) : hierarchy.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No departments found. Use "Add Department" to seed your college structure.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {hierarchy.map((dept) => (
              <div
                key={dept._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-black">
                        {dept.code}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">{dept.name}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Programs: {dept.programs?.join(', ')} • Cohorts: {dept.years?.map((y) => `Year ${y}`).join(', ')}
                    </p>
                  </div>
                </div>

                {/* Years & Sections Matrix */}
                <div className="space-y-4">
                  {dept.years?.map((yr) => {
                    const sectionsInYear = dept.sectionsByYear?.[yr] || [];
                    return (
                      <div key={yr} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            Year {yr} ({sectionsInYear.length} Sections)
                          </h4>
                        </div>

                        {sectionsInYear.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No sections created for Year {yr}.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {sectionsInYear.map((sec) => (
                              <div
                                key={sec._id}
                                className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-slate-900">
                                    Section {sec.sectionName}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      sec.teacherCount >= maxTeachers
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    }`}
                                  >
                                    {sec.teacherCount} / {maxTeachers} Teachers
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500">
                                  {sec.assignedTeachers?.length > 0 ? (
                                    <ul className="space-y-0.5">
                                      {sec.assignedTeachers.map((t, idx) => (
                                        <li key={idx} className="truncate">
                                          • <span className="font-semibold text-slate-700">{t.name}</span> ({t.subject})
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="text-slate-400 italic">No teachers assigned yet</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: ADD DEPARTMENT */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Academic Department</h3>
              <button onClick={() => setDeptModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Code:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Programs (comma separated):</label>
                <input
                  type="text"
                  value={newDept.programs}
                  onChange={(e) => setNewDept({ ...newDept, programs: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Academic Years (e.g. 1, 2, 3, 4):</label>
                <input
                  type="text"
                  value={newDept.years}
                  onChange={(e) => setNewDept({ ...newDept, years: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptLoading}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50"
                >
                  {deptLoading ? 'Saving...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SECTION */}
      {sectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Academic Section</h3>
              <button onClick={() => setSectionModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department:</label>
                <select
                  value={newSection.departmentCode}
                  onChange={(e) => setNewSection({ ...newSection, departmentCode: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {hierarchy.map((d) => (
                    <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Program:</label>
                  <input
                    type="text"
                    required
                    value={newSection.program}
                    onChange={(e) => setNewSection({ ...newSection, program: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year (1-4):</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    required
                    value={newSection.year}
                    onChange={(e) => setNewSection({ ...newSection, year: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section Name (e.g. A, B, C):</label>
                  <input
                    type="text"
                    required
                    value={newSection.sectionName}
                    onChange={(e) => setNewSection({ ...newSection, sectionName: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Capacity / Student Count:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newSection.studentCount}
                    onChange={(e) => setNewSection({ ...newSection, studentCount: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSectionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionLoading}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50"
                >
                  {sectionLoading ? 'Saving...' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
