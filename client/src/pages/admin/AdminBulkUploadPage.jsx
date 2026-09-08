import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';

export const AdminBulkUploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleDownloadSample = () => {
    const csvContent =
      'question,optionA,optionB,optionC,optionD,correctAnswer,explanation,subject,topic,difficulty,marks,negativeMarks\n' +
      '"What is the worst-case time of binary search on sorted array?","O(n)","O(log n)","O(1)","O(n log n)","B","Binary search cuts the search space in half each iteration, yielding logarithmic complexity.","DSA","Searching","Easy",1,0.25\n' +
      '"Which property of ACID prevents dirty reads?","Atomicity","Isolation","Durability","Consistency","B","Isolation ensures concurrent transactions execute without reading uncommitted modifications.","DBMS","Transactions","Medium",1,0.25';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ExamSphere_Questions_Template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a .csv file to import.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/questions/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data) {
        setResult(res.data);
        setFile(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk upload failed. Please check CSV formatting.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <Link
            to="/admin/questions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Question Bank
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bulk Question Importer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Import hundreds of standardized multiple-choice questions via comma-separated value (.csv) tables.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl p-8 text-center transition bg-slate-50/50 flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">
                {file ? file.name : 'Choose a .csv file or drag & drop here'}
              </p>
              <p className="text-xs text-slate-400">
                Ensure CSV contains headers: question, optionA, optionB, optionC, optionD, correctAnswer, explanation, subject, topic
              </p>
            </div>

            <label className="px-5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer shadow-xs">
              <span>Browse File</span>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Process & Import Questions</span>
            </button>
          </div>
        </form>
      </div>

      {/* Upload Results & Error Report */}
      {result && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Import Verification Summary</h3>
            <Link to="/admin/questions" className="text-xs font-bold text-indigo-600 hover:underline">
              View Question Bank →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <div>
                <span className="text-2xl font-extrabold text-emerald-700">{result.successfulRows}</span>
                <p className="text-xs font-semibold text-emerald-900">Successfully Imported</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-rose-600" />
              <div>
                <span className="text-2xl font-extrabold text-rose-700">{result.failedRows}</span>
                <p className="text-xs font-semibold text-rose-900">Validation Failures</p>
              </div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Row-Level Error Telemetry:
              </h4>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                {result.errors.map((err, i) => (
                  <div key={i} className="p-3 text-xs flex items-start gap-3">
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      Row {err.row}
                    </span>
                    <span className="text-slate-600 flex-1">{err.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
