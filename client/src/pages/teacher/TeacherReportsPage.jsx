import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Layers,
  BookOpen,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const TeacherReportsPage = () => {
  const { user } = useAuth();
  const [teacherScopes, setTeacherScopes] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Scope for Section Report
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedYear, setSelectedYear] = useState(3);
  const [selectedSection, setSelectedSection] = useState('A');

  // Selected Exam for Exam Report
  const [selectedExamId, setSelectedExamId] = useState('');

  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [scopesRes, examsRes] = await Promise.all([
        api.get('/academic/my-scopes').catch(() => ({ data: { scopes: [] } })),
        api.get('/exams').catch(() => ({ data: { data: [] } })),
      ]);

      if (scopesRes.data?.scopes?.length > 0) {
        setTeacherScopes(scopesRes.data.scopes);
        const first = scopesRes.data.scopes[0];
        setSelectedDept(first.departmentCode);
        setSelectedYear(first.year);
        setSelectedSection(first.sectionName);
      }
      if (examsRes.data?.data) {
        setExams(examsRes.data.data);
        if (examsRes.data.data.length > 0) {
          setSelectedExamId(examsRes.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching scopes & exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSectionPDF = async () => {
    try {
      setDownloading(true);
      const res = await api.get(
        `/reports/section-pdf?department=${selectedDept}&year=${selectedYear}&section=${selectedSection}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Section_Report_${selectedDept}_Yr${selectedYear}_Sec${selectedSection}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error generating section PDF report.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadExamPDF = async () => {
    if (!selectedExamId) return;
    try {
      setDownloading(true);
      const res = await api.get(`/reports/exam/${selectedExamId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Exam_Report_${selectedExamId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error generating exam analytics PDF report.');
    } finally {
      setDownloading(false);
    }
  };

  const handleExportSectionCSV = () => {
    window.open(
      `http://localhost:5000/api/reports/section-csv?department=${selectedDept}&year=${selectedYear}&section=${selectedSection}`,
      '_blank'
    );
  };

  const handleExportExamCSV = () => {
    if (!selectedExamId) return;
    window.open(`http://localhost:5000/api/reports/exam/${selectedExamId}/csv`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-indigo-600" />
          Academic Reports & Institutional Exports
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Generate accredited PDF evaluation reports and CSV roster datasets for departmental audits, faculty review, and student portfolios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section Performance Report Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Section Academic Report</h2>
                <p className="text-xs text-slate-400">Class aggregate metrics, score distributions & topic diagnostics</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700">Select Target Section:</label>
              <select
                value={`${selectedDept}-${selectedYear}-${selectedSection}`}
                onChange={(e) => {
                  const [d, y, s] = e.target.value.split('-');
                  setSelectedDept(d);
                  setSelectedYear(Number(y));
                  setSelectedSection(s);
                }}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                {teacherScopes.map((sc, i) => (
                  <option key={i} value={`${sc.departmentCode}-${sc.year}-${sc.sectionName}`}>
                    {sc.departmentCode} Year {sc.year} - Section {sc.sectionName} ({sc.subject})
                  </option>
                ))}
              </select>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Included in Section PDF:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li>Enrolled student count and active participation rate</li>
                  <li>Pass rate percentage and class score average</li>
                  <li>Needs Revision Diagnostic topics (accuracy &lt; 60%)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadSectionPDF}
              disabled={downloading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Section PDF</span>
            </button>
            <button
              onClick={handleExportSectionCSV}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Exam Analytics Report Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Exam Assessment Analytics</h2>
                <p className="text-xs text-slate-400">Complete item analysis, percentile distributions & attempt stats</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700">Select Examination:</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.title} ({ex.subject} - {ex.status})
                  </option>
                ))}
              </select>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Included in Exam Analytics PDF:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li>Total submissions, average time spent, and pass percentage</li>
                  <li>Highest and lowest candidate performance benchmarks</li>
                  <li>Proctoring integrity flags and question accuracy ratings</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadExamPDF}
              disabled={downloading || !selectedExamId}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Exam PDF</span>
            </button>
            <button
              onClick={handleExportExamCSV}
              disabled={!selectedExamId}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
