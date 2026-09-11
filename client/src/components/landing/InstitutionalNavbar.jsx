import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GLBLogo } from '../common/GLBLogo';
import { 
  Menu, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  PhoneCall, 
  Info, 
  Sparkles,
  Lock
} from 'lucide-react';

export const InstitutionalNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Security', href: '#security' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80' 
          : 'bg-white border-b border-slate-200'
      }`}
    >
      {/* Institutional Top Bar (Official Affiliation Notice) */}
      <div className="bg-slate-900 text-slate-200 text-[11px] py-1 px-4 sm:px-6 lg:px-8 border-b border-slate-800 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-slate-300">
              GL BAJAJ GROUP OF INSTITUTIONS, MATHURA
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Digital Examination Cell & Assessment Portal</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Academic Session 2025–26</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Lock className="w-3 h-3 text-emerald-400" />
              Institutional Secure SSL
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Brand: College Logo + Product Name */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3.5 group">
              <GLBLogo size="md" variant="full" />
              <div className="hidden sm:block h-8 w-px bg-slate-200 mx-1" />
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-blue-950 font-sans">
                  GLB <span className="text-blue-600">ExamSphere</span>
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 -mt-1 hidden sm:block">
                  Institutional Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Right Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main Navigation">
            <div className="flex items-center space-x-6 text-sm font-semibold text-slate-600">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="hover:text-blue-700 transition-colors py-1 relative group"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200" />
                </a>
              ))}
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <Link
                to="/role-select"
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-blue-950/20 transition-all duration-150 flex items-center gap-2 group"
                id="navbar-login-btn"
              >
                <span>LOGIN TO PORTAL</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-300 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/role-select"
              className="px-3.5 py-2 rounded-lg bg-blue-900 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>Login</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label={mobileMenuOpen ? 'Close Navigation' : 'Open Navigation'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 pt-1">
            GL Bajaj Examination Portal
          </div>
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100">
            <Link
              to="/role-select"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm uppercase tracking-wider shadow-md text-center flex items-center justify-center gap-2"
            >
              <span>LOGIN TO PORTAL</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default InstitutionalNavbar;
