import React from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle, Github } from 'lucide-react';
import { GLBLogo } from './common/GLBLogo';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2">
              <GLBLogo size="sm" variant="mark" theme="dark" />
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-white tracking-tight">
                  GLB <span className="text-blue-400">ExamSphere</span>
                </span>
                <span className="text-[9px] font-semibold text-blue-300 uppercase">
                  GL Bajaj Mathura
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Institutional assessment platform for GL Bajaj Group of Institutions, Mathura with live testing, mistake analytics, and certified performance reporting.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Assessment Engines Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/exams" className="hover:text-white transition">Explore Exams</Link></li>
              <li><Link to="/leaderboard" className="hover:text-white transition">Global Leaderboard</Link></li>
              <li><Link to="/schedule" className="hover:text-white transition">Assessment Schedule</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition">Performance Analytics</Link></li>
            </ul>
          </div>

          {/* Student Tools */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Features</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/mistakes" className="hover:text-white transition">Mistake Analysis</Link></li>
              <li><span className="text-slate-500">Certified PDF Reports</span></li>
              <li><span className="text-slate-500">Server Time Synchronizer</span></li>
              <li><span className="text-slate-500">Zero-Leak Answer Security</span></li>
              <li><span className="text-slate-500">Gemini & Rule-Based Engines</span></li>
            </ul>
          </div>

          {/* Security & Legal */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white cursor-pointer transition">Privacy Policy</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Terms of Evaluation</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Security Whitepaper</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Candidate Honor Code</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 GL Bajaj Group of Institutions, Mathura. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-1 rounded">
              GLB Institutional Exam Portal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
