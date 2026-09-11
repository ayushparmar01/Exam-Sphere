import React from 'react';
import { Link } from 'react-router-dom';
import { GLBLogo } from '../common/GLBLogo';
import { ArrowUp } from 'lucide-react';

export const InstitutionalFooter = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0B0D11] text-slate-400 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
          
          {/* Institutional Brand Identity */}
          <div className="md:col-span-6 space-y-3">
            <a href="#" className="inline-flex items-center gap-3">
              <GLBLogo size="md" variant="full" theme="dark" />
            </a>
            
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#E6EDF3]">
                GLB ExamSphere
              </p>
              <p className="text-xs text-sky-400 font-semibold">
                GL BAJAJ GROUP OF INSTITUTIONS, MATHURA
              </p>
              <p className="text-xs text-slate-400 pt-1 max-w-md leading-relaxed">
                Smart • Secure • Seamless Examination Platform. An integrated digital examination portal designed for reliable academic assessments.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="hover:text-sky-400 transition-colors">Home</a>
              </li>
              <li>
                <a href="#features" className="hover:text-sky-400 transition-colors">Features</a>
              </li>
              <li>
                <a href="#security" className="hover:text-sky-400 transition-colors">Security</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-sky-400 transition-colors">How It Works</a>
              </li>
            </ul>
          </div>

          {/* Portal Access */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Portal Access
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/role-select" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
                  Login to ExamSphere →
                </Link>
              </li>
              <li>
                <Link to="/login?role=student" className="hover:text-slate-200 transition-colors">
                  Student Login
                </Link>
              </li>
              <li>
                <Link to="/login?role=teacher" className="hover:text-slate-200 transition-colors">
                  Teacher Login
                </Link>
              </li>
              <li>
                <Link to="/login?role=admin" className="hover:text-slate-200 transition-colors">
                  Administrator Login
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 GL Bajaj Group of Institutions, Mathura. All rights reserved.</p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors p-1 rounded"
            aria-label="Scroll to top"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};

export default InstitutionalFooter;
