import React from 'react';
import { LogIn, FileText, MonitorCheck, Award } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      step: '01',
      title: 'Login',
      description: 'Sign in using your authorized account.',
      icon: LogIn,
    },
    {
      step: '02',
      title: 'Select Examination',
      description: 'Access available examinations assigned to your role.',
      icon: FileText,
    },
    {
      step: '03',
      title: 'Take Examination',
      description: 'Complete the assessment through the secure examination interface.',
      icon: MonitorCheck,
    },
    {
      step: '04',
      title: 'Review Performance',
      description: 'Access permitted results, rankings and performance insights.',
      icon: Award,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#0F1115] border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#151922] border border-slate-800 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            Workflow Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#E6EDF3] tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            A straightforward, synchronized 4-step assessment workflow.
          </p>
        </div>

        {/* Timeline Grid: Horizontal on Desktop, Vertical on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          
          {/* Subtle connecting line on desktop */}
          <div className="hidden md:block absolute top-10 left-12 right-12 h-px bg-slate-800/80 -z-0" />

          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div 
                key={idx} 
                className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left"
              >
                {/* Step Marker Badge */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-lg bg-[#151922] border border-slate-800 flex items-center justify-center text-sky-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold font-mono text-slate-500">
                    {s.step}
                  </span>
                </div>

                <div className="bg-[#151922] border border-slate-800 rounded-xl p-5 w-full space-y-2 hover:border-slate-700 transition-colors">
                  <h3 className="text-sm font-bold text-[#E6EDF3] tracking-tight">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {s.description}
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

export default HowItWorks;
