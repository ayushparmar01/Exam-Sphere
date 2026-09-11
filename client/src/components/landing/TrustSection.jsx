import React from 'react';
import { GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';

export const TrustSection = () => {
  const roles = [
    {
      title: 'Student',
      description: 'Take exams, save answers, view results and track performance.',
      icon: GraduationCap,
      label: 'Candidate Portal',
    },
    {
      title: 'Teacher',
      description: 'Create and manage examinations, questions and assessments.',
      icon: BookOpen,
      label: 'Faculty Portal',
    },
    {
      title: 'Administrator',
      description: 'Manage users, examinations, monitoring and platform operations.',
      icon: ShieldCheck,
      label: 'Administration Portal',
    },
  ];

  return (
    <section id="about" className="py-16 sm:py-20 bg-[#0F1115] border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#151922] border border-slate-800 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            Institutional Support
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#E6EDF3] tracking-tight">
            Built for the Entire Institution
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            GLB ExamSphere provides a dedicated, structured environment to support students, faculty, and administrative staff across GL Bajaj.
          </p>
        </div>

        {/* 3 Role Support Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {roles.map((r, idx) => {
            const Icon = r.icon;
            return (
              <div
                key={idx}
                className="bg-[#151922] rounded-xl border border-slate-800 p-7 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-lg bg-[#0F1115] border border-slate-800 flex items-center justify-center text-sky-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-[#0F1115] px-2 py-0.5 rounded border border-slate-800">
                      {r.label}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#E6EDF3] tracking-tight">
                    {r.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {r.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default TrustSection;
