import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Folder,
  Upload,
  BookOpen,
  FileText,
  Download,
  Trash2,
  PlusCircle,
  Filter,
  CheckCircle,
} from 'lucide-react';

export const TeacherMaterialsPage = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherScopes, setTeacherScopes] = useState([]);

  // Upload Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    subject: '',
    unit: 'Unit 1',
    topic: '',
    description: '',
    department: 'CSE',
    year: 3,
    sections: 'A',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Selected Subject Filter
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  useEffect(() => {
    fetchTeacherScopes();
    fetchMaterials();
  }, []);

  const fetchTeacherScopes = async () => {
    try {
      const res = await api.get('/academic/my-scopes');
      if (res.data?.scopes) {
        setTeacherScopes(res.data.scopes);
        if (res.data.scopes.length > 0) {
          const first = res.data.scopes[0];
          setNewMaterial((prev) => ({
            ...prev,
            subject: first.subject || 'Data Structures & Algorithms',
            department: first.departmentCode || 'CSE',
            year: first.year || 3,
            sections: first.sectionName || 'A',
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching teacher scopes:', err);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/materials');
      if (res.data?.groupedMaterials) {
        setMaterials(res.data.groupedMaterials);
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    try {
      setUploadLoading(true);
      setUploadSuccess('');
      const formData = new FormData();
      formData.append('title', newMaterial.title);
      formData.append('subject', newMaterial.subject);
      formData.append('unit', newMaterial.unit);
      formData.append('topic', newMaterial.topic);
      formData.append('description', newMaterial.description);
      formData.append('department', newMaterial.department);
      formData.append('year', newMaterial.year);
      formData.append('sections', newMaterial.sections);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.post('/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadSuccess('Study material uploaded successfully!');
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadSuccess('');
        setSelectedFile(null);
        setNewMaterial({
          title: '',
          subject: teacherScopes[0]?.subject || '',
          unit: 'Unit 1',
          topic: '',
          description: '',
          department: teacherScopes[0]?.departmentCode || 'CSE',
          year: teacherScopes[0]?.year || 3,
          sections: teacherScopes[0]?.sectionName || 'A',
        });
        fetchMaterials();
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading study material');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to remove this study resource?')) return;
    try {
      await api.delete(`/materials/${materialId}`);
      fetchMaterials();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting material');
    }
  };

  const filteredMaterials = selectedSubject === 'ALL'
    ? materials
    : materials.filter((m) => m._id === selectedSubject);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Folder className="w-6 h-6 text-indigo-600" />
            Study Materials & Lecture Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Organize syllabus resources hierarchically across subjects and units for your enrolled sections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm self-start"
          >
            <Upload className="w-4 h-4" />
            Upload Study Material
          </button>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter by Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Subjects</option>
            {materials.map((m) => (
              <option key={m._id} value={m._id}>{m._id}</option>
            ))}
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          {materials.reduce((acc, m) => acc + (m.units?.reduce((uacc, u) => uacc + (u.materials?.length || 0), 0) || 0), 0)} Total Resources
        </span>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading course materials...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No study materials uploaded yet. Click "Upload Study Material" to share your first PDF or lecture notes.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMaterials.map((subjGroup) => (
            <div key={subjGroup._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  {subjGroup._id}
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {subjGroup.units?.length || 0} Syllabus Units
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {subjGroup.units?.map((unitGroup) => (
                  <div
                    key={unitGroup.unit}
                    className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                          {unitGroup.unit}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {unitGroup.materials?.length} files
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {unitGroup.materials?.map((item) => (
                          <div
                            key={item._id}
                            className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                              <button
                                onClick={() => handleDeleteMaterial(item._id)}
                                title="Delete Resource"
                                className="text-slate-400 hover:text-rose-600 transition p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2">{item.topic || item.description}</p>
                            
                            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                              <span>{(item.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                              <a
                                href={`http://localhost:5000/api/materials/${item._id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Upload Syllabus Study Material</h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadMaterial} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resource Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asymptotic Analysis & Recurrences"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures & Algorithms"
                    value={newMaterial.subject}
                    onChange={(e) => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit:</label>
                  <select
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Unit 1">Unit 1</option>
                    <option value="Unit 2">Unit 2</option>
                    <option value="Unit 3">Unit 3</option>
                    <option value="Unit 4">Unit 4</option>
                    <option value="Unit 5">Unit 5</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic Name / Coverage:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Theorem & Big-O Notation"
                  value={newMaterial.topic}
                  onChange={(e) => setNewMaterial({ ...newMaterial, topic: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Section Scope:</label>
                <select
                  value={`${newMaterial.department}-${newMaterial.year}-${newMaterial.sections}`}
                  onChange={(e) => {
                    const [d, y, s] = e.target.value.split('-');
                    setNewMaterial({
                      ...newMaterial,
                      department: d,
                      year: Number(y),
                      sections: s,
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Lecture Summary:</label>
                <textarea
                  rows={2}
                  placeholder="Key concepts covered in this module..."
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">File Attachment (PDF / Doc / PPT):</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              {uploadSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold">
                  {uploadSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {uploadLoading ? 'Uploading...' : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
