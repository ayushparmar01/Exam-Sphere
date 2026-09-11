import React from 'react';
import { 
  FileSpreadsheet, 
  CheckCheck, 
  ShieldAlert, 
  Activity, 
  BarChart3, 
  Bot,
  ArrowUpRight
} from 'lucide-react';

export const FeatureSection = () => {
  const features = [
    {
      title: 'Online Examinations',
      description:
        'Conduct structured digital examinations with configurable duration, questions and marking rules.',
      icon: FileSpreadsheet,
      category: 'Exam Delivery',
    },
    {
      title: 'Smart Assessment',
      description:
        'Support multiple question types, automated evaluation and result generation.',
      icon: CheckCheck,
      category: 'Evaluation Engine',
    },
    {
      title: 'Secure Examination',
      description:
        'Authentication, session protection and configurable integrity monitoring.',
      icon: ShieldAlert,
      category: 'Session Protection',
    },
    {
      title: 'Live Monitoring',
      description:
        'Real-time examination monitoring and integrity-event visibility for authorized administrators.',
      icon: Activity,
      category: 'Invigilation',
    },
    {
      title: 'Analytics & Results',
      description:
        'Scores, accuracy, rankings, performance analysis and downloadable reports.',
      icon: BarChart3,
      category: 'Performance Insights',
    },
    {
      title: 'AI-Assisted Tools',
      description:
        'AI-assisted question generation and analysis where enabled by the institution.',
      icon: Bot,
      category: 'Faculty Assistance',
    },
  ];

  return (
    <section id="features" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            Institutional Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything You Need for Modern Examinations
          </h2>
          <p className="text-base text-slate-600">
            Engineered to streamline assessment workflows for GL Bajaj faculty, students, and examination authorities.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/90 p-7 shadow-xs hover:shadow-md hover:border-blue-300 transition duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {f.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {f.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-800">
                  <span>GL Bajaj Assessment Standard</span>
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
