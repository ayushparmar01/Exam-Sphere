import React from 'react';
import { LogIn, MonitorPlay, Activity, Award, ArrowRight } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      step: '01',
      title: 'LOGIN',
      subtitle: 'Secure Authentication',
      description: 'Student, Teacher or Administrator securely signs in with institutional credentials.',
      icon: LogIn,
    },
    {
      step: '02',
      title: 'EXAM',
      subtitle: 'Controlled Environment',
      description: 'Students access assigned examinations through a controlled, timed exam environment.',
      icon: MonitorPlay,
    },
    {
      step: '03',
      title: 'MONITOR',
      subtitle: 'Integrity Signals',
      description: 'Configured integrity signals and examination events are monitored during the attempt.',
      icon: Activity,
    },
    {
      step: '04',
      title: 'RESULT',
      subtitle: 'Instant Evaluation',
      description: 'Results, performance analytics and verified reports are generated after submission.',
      icon: Award,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            System Lifecycle
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How GLB ExamSphere Works
          </h2>
          <p className="text-base text-slate-600">
            A standardized, seamless 4-step assessment workflow built for high-stakes institutional evaluations.
          </p>
        </div>

        {/* Timeline: Horizontal on Desktop, Vertical on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          
          {/* Desktop Connecting Line */}
          <div className="hidden md:block absolute top-12 left-12 right-12 h-0.5 bg-blue-100 -z-0" />

          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div 
                key={idx} 
                className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left group"
              >
                {/* Step Circle with Number Badge */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-blue-200" />
                  </div>
                  <span className="text-2xl font-black font-mono text-blue-950/20 group-hover:text-blue-900 transition-colors">
                    {s.step}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 w-full space-y-2 hover:bg-white hover:shadow-md hover:border-blue-300 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      {s.title}
                    </h3>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {s.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
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
