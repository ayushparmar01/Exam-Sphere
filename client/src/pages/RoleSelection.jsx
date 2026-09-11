import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GLBLogo } from '../components/common/GLBLogo';
import { 
  GraduationCap, 
  BookOpenCheck, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Lock,
  CheckCircle2
} from 'lucide-react';

export const RoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'student',
      title: 'Student',
      subtitle: 'Candidate Portal',
      description: 'Access assigned examinations, attempt tests and view results.',
      buttonText: 'Student Login',
      icon: GraduationCap,
      path: '/login?role=student',
      badge: 'B.Tech / MCA / Management',
      features: ['Attempt scheduled tests', 'Real-time timer & autosave', 'Download verified results'],
      accentColor: 'blue',
    },
    {
      id: 'teacher',
      title: 'Teacher',
      subtitle: 'Faculty Portal',
      description: 'Create and manage examinations, questions and assessments.',
      buttonText: 'Teacher Login',
      icon: BookOpenCheck,
      path: '/login?role=teacher',
      badge: 'Faculty & Department Evaluators',
      features: ['Author question banks', 'Schedule departmental tests', 'Review candidate scores'],
      accentColor: 'indigo',
    },
    {
      id: 'admin',
      title: 'Administrator',
      subtitle: 'Examination Cell Console',
      description: 'Manage users, examinations, monitoring and institutional analytics.',
      buttonText: 'Administrator Login',
      icon: ShieldCheck,
      path: '/login?role=admin',
      badge: 'Exam Cell & Institutional Admin',
      features: ['Live proctoring surveillance', 'Institutional question pool', 'Audit logs & analytics'],
      accentColor: 'slate',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-white flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3">
            <GLBLogo size="sm" variant="full" />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <span className="text-lg font-black text-blue-950 hidden sm:block">
              GLB <span className="text-blue-600">ExamSphere</span>
            </span>
          </Link>

          <Link
            to="/"
            className="text-xs font-semibold text-slate-600 hover:text-blue-900 transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal Home</span>
          </Link>
        </div>
      </header>

      {/* Main Role Selection Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col justify-center">
        
        {/* Headings */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <span>Institutional Access Gate</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Welcome to GLB ExamSphere
          </h1>
          
          <p className="text-base font-semibold text-blue-800/90">
            Select your role to continue
          </p>

          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            GL Bajaj Group of Institutions, Mathura • Secure Examination Environment
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="bg-white rounded-2xl border-2 border-slate-200/90 hover:border-blue-600 p-8 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-5">
                  
                  {/* Top Role Badge and Icon */}
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors duration-200 shadow-xs">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {role.subtitle}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-900 transition-colors">
                      {role.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {role.badge}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {role.description}
                  </p>

                  {/* Feature Highlights */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    {role.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Role CTA Button */}
                <div className="pt-8">
                  <button
                    onClick={() => navigate(role.path)}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:bg-blue-900"
                    id={`login-role-${role.id}`}
                  >
                    <span>{role.buttonText}</span>
                    <ArrowRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Security / Guidance Notice */}
        <div className="mt-12 text-center text-xs text-slate-500 max-w-xl mx-auto space-y-1">
          <p className="flex items-center justify-center gap-1.5 font-medium text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authorized access only. All authentication attempts are logged for audit compliance.</span>
          </p>
          <p className="text-[11px] text-slate-400">
            GL Bajaj Examination Cell • Session 2025–26
          </p>
        </div>

      </main>

      {/* Bottom Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        © 2026 GL Bajaj Group of Institutions, Mathura. All rights reserved.
      </footer>

    </div>
  );
};

export default RoleSelection;
