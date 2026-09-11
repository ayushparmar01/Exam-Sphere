import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GLBLogo } from '../components/common/GLBLogo';
import { 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';

export const RoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'student',
      title: 'Student',
      badge: 'Candidate Portal',
      description: 'Access examinations and personal performance.',
      buttonText: 'Continue as Student',
      icon: GraduationCap,
      path: '/login?role=student',
    },
    {
      id: 'teacher',
      title: 'Teacher',
      badge: 'Faculty Portal',
      description: 'Create and manage examinations.',
      buttonText: 'Continue as Teacher',
      icon: BookOpen,
      path: '/login?role=teacher',
    },
    {
      id: 'admin',
      title: 'Administrator',
      badge: 'Platform Administration',
      description: 'Manage the examination platform.',
      buttonText: 'Continue as Admin',
      icon: ShieldCheck,
      path: '/login?role=admin',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6EDF3] flex flex-col justify-between selection:bg-sky-500 selection:text-slate-950">
      
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#0F1115] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3">
            <GLBLogo size="sm" variant="full" theme="dark" />
            <div className="h-5 w-px bg-slate-800 hidden sm:block" />
            <span className="text-base font-black text-[#E6EDF3] hidden sm:block">
              GLB <span className="text-sky-400">ExamSphere</span>
            </span>
          </Link>

          <Link
            to="/"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#151922] hover:bg-[#1B202D] focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Role Selection Area */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col justify-center">
        
        {/* Section Heading */}
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-md bg-[#151922] border border-slate-800 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            Portal Access
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E6EDF3] tracking-tight">
            Welcome to GLB ExamSphere
          </h1>
          
          <p className="text-sm font-medium text-slate-400">
            Select your role to continue
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="bg-[#151922] rounded-xl border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between group transition-colors"
              >
                <div className="space-y-4">
                  {/* Top Role Badge and Icon */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-[#0F1115] border border-slate-800 flex items-center justify-center text-sky-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#0F1115] text-slate-400 border border-slate-800">
                      {role.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-[#E6EDF3] tracking-tight">
                      {role.title}
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed min-h-[2.5rem]">
                    {role.description}
                  </p>
                </div>

                {/* Role CTA Button */}
                <div className="pt-6 mt-6 border-t border-slate-800/80">
                  <button
                    onClick={() => navigate(role.path)}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#0F1115] hover:bg-[#1C2230] text-slate-100 hover:text-white border border-slate-700 hover:border-sky-500/60 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-sky-500"
                    id={`login-role-${role.id}`}
                  >
                    <span>{role.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </main>

      {/* Bottom Minimal Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0D11] py-4 px-4 text-center text-xs text-slate-400">
        © 2026 GL Bajaj Group of Institutions, Mathura. All rights reserved.
      </footer>

    </div>
  );
};

export default RoleSelection;
