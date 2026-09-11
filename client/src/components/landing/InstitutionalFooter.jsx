import React from 'react';
import { Link } from 'react-router-dom';
import { GLBLogo } from '../common/GLBLogo';
import { ShieldCheck, Lock } from 'lucide-react';

export const InstitutionalFooter = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
          
          {/* Institutional Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <GLBLogo size="md" variant="full" theme="dark" />
            </Link>
            
            <div className="space-y-1">
              <p className="text-sm font-bold text-white tracking-wide">
                GLB ExamSphere
              </p>
              <p className="text-xs text-blue-300 font-semibold">
                GL BAJAJ GROUP OF INSTITUTIONS, MATHURA
              </p>
              <p className="text-xs text-slate-400 leading-relaxed pt-1 max-w-sm">
                Digital Examination & Assessment Platform designed to conduct secure, server-timed, and reliable academic assessments.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Institutional Examination Engine Active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#about" className="hover:text-white transition">About Platform</a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition">Core Features</a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition">Security Architecture</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition">Campus Contact</a>
              </li>
            </ul>
          </div>

          {/* Portals Access */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Portal Access
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/role-select" className="hover:text-white transition flex items-center gap-1.5 text-blue-400 font-semibold">
                  <span>Role Selection Portal</span>
                  <span>→</span>
                </Link>
              </li>
              <li>
                <Link to="/login?role=student" className="hover:text-white transition">Student Examination Login</Link>
              </li>
              <li>
                <Link to="/login?role=teacher" className="hover:text-white transition">Faculty & Assessment Management</Link>
              </li>
              <li>
                <Link to="/login?role=admin" className="hover:text-white transition">Examination Cell & Admin Console</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 GL Bajaj Group of Institutions, Mathura. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
              <Lock className="w-3 h-3 text-emerald-400" />
              Secure Institutional Portal
            </span>
            <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
              Session 2025–26
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default InstitutionalFooter;
