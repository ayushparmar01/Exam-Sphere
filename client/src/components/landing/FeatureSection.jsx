import React from 'react';
import { 
  ShieldCheck, 
  CheckCheck, 
  Activity, 
  Sparkles, 
  BarChart3, 
  RotateCcw 
} from 'lucide-react';

export const FeatureSection = () => {
  const features = [
    {
      title: 'Secure Examinations',
      description: 'Controlled examination workflow with session and integrity monitoring.',
      icon: ShieldCheck,
      category: 'Session Security',
    },
    {
      title: 'Smart Assessment',
      description: 'Structured online assessments with automatic evaluation.',
      icon: CheckCheck,
      category: 'Automated Evaluation',
    },
    {
      title: 'Real-Time Monitoring',
      description: 'Live examination and integrity signals for authorized administrators.',
      icon: Activity,
      category: 'Proctoring & Oversight',
    },
    {
      title: 'AI-Assisted Tools',
      description: 'AI-assisted question generation and analysis where enabled.',
      icon: Sparkles,
      category: 'Faculty Assistance',
    },
    {
      title: 'Performance Analytics',
      description: 'Results, rankings and performance insights.',
      icon: BarChart3,
      category: 'Insights & Reporting',
    },
    {
      title: 'Reliable Session Recovery',
      description: 'Designed to reduce answer loss during temporary network or browser interruptions.',
      icon: RotateCcw,
      category: 'Fault Tolerance',
    },
  ];

  return (
    <section id="features" className="py-20 bg-[#0F1115] border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#151922] border border-slate-800 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            Platform Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#E6EDF3] tracking-tight">
            Features Built for Assessment Integrity
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Essential tools engineered to support examination workflows from initial paper authoring through final results.
          </p>
        </div>

        {/* 6 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-[#151922] rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#0F1115] border border-slate-800 flex items-center justify-center text-sky-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-[#0F1115] px-2 py-0.5 rounded border border-slate-800">
                      {f.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#E6EDF3] tracking-tight">
                    {f.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {f.description}
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

export default FeatureSection;
