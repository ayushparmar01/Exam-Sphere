import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GLBLogo } from '../common/GLBLogo';
import { Menu, X, ArrowRight } from 'lucide-react';

export const InstitutionalNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'Features', href: '#features' },
    { name: 'Security', href: '#security' },
    { name: 'How It Works', href: '#how-it-works' },
  ];

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-colors duration-200 ${
        scrolled 
          ? 'bg-[#0F1115]/95 backdrop-blur-md border-b border-slate-800/90 shadow-md' 
          : 'bg-[#0F1115] border-b border-slate-800/60'
      }`}
    >
      {/* Top Institutional Identity Bar */}
      <div className="bg-[#0B0D11] text-slate-400 text-[11px] py-1 px-4 sm:px-6 lg:px-8 border-b border-slate-800/50 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span className="font-semibold text-slate-300">
              GL BAJAJ GROUP OF INSTITUTIONS, MATHURA
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Institutional Examination Portal</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[10px] font-mono">
            <span>SESSION 2025–26</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Left Brand Mark */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-3 group">
              <GLBLogo size="md" variant="full" theme="dark" />
              <div className="hidden sm:block h-7 w-px bg-slate-800 mx-1" />
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-black tracking-tight text-[#E6EDF3] font-sans">
                  GLB <span className="text-sky-400">ExamSphere</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 -mt-1 hidden sm:block">
                  Examination Platform
                </span>
              </div>
            </a>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-sky-400 transition-colors py-1 focus:outline-none focus:text-sky-400"
              >
                {link.name}
              </a>
            ))}

            {/* Primary Action Button */}
            <div className="pl-3 border-l border-slate-800">
              <Link
                to="/role-select"
                className="px-4 py-2.5 rounded-lg bg-[#151922] hover:bg-[#1C2230] text-slate-100 hover:text-white border border-slate-700/80 hover:border-sky-500/50 font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-2 group shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                id="navbar-login-btn"
              >
                <span>Login to ExamSphere</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/role-select"
              className="px-3 py-1.5 rounded-lg bg-[#151922] border border-slate-700 text-slate-100 font-bold text-xs uppercase tracking-wider flex items-center gap-1"
            >
              <span>Login</span>
              <ArrowRight className="w-3 h-3 text-sky-400" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label={mobileMenuOpen ? 'Close Navigation' : 'Open Navigation'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#12141A] px-4 pt-3 pb-6 shadow-2xl space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-1">
            GL Bajaj Examination Portal
          </div>
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-200 hover:bg-[#181D26] hover:text-sky-400 transition"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-800">
            <Link
              to="/role-select"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 px-4 rounded-lg bg-[#151922] hover:bg-[#1C2230] text-slate-100 font-bold text-xs uppercase tracking-wider border border-slate-700 text-center flex items-center justify-center gap-2"
            >
              <span>Login to ExamSphere</span>
              <ArrowRight className="w-4 h-4 text-sky-400" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default InstitutionalNavbar;
