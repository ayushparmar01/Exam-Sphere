import React from 'react';
import { Shield, RefreshCw, Cpu, CheckCircle } from 'lucide-react';

export const TrustSection = () => {
  const pillars = [
    {
      title: 'Secure',
      icon: Shield,
      color: 'blue',
      badge: 'Protected Integrity',
      description:
        'Role-based authentication, protected examination sessions and integrity monitoring.',
      highlights: [
        'JWT & role verification',
        'Controlled fullscreen enforcement',
        'Secure token lifecycle',
      ],
    },
    {
      title: 'Reliable',
      icon: RefreshCw,
      color: 'emerald',
      badge: 'Zero Answer Loss',
      description:
        'Server-authoritative sessions, autosave and recovery mechanisms designed to reduce answer loss.',
      highlights: [
        'Debounced answer synchronization',
        'Persistent offline/reconnect recovery',
        'Authoritative server clock',
      ],
    },
    {
      title: 'Intelligent',
      icon: Cpu,
      color: 'indigo',
      badge: 'Modern Workflows',
      description:
        'Assessment analytics and AI-assisted capabilities to support modern examination workflows.',
      highlights: [
        'Topic-wise performance diagnostics',
        'Assisted question generation',
        'Instant cohort analytics',
      ],
    },
  ];

  return (
    <section id="about" className="py-16 sm:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Institutional Standard
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for Digital Examination at GL Bajaj
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            GLB ExamSphere provides a centralized environment for conducting, managing and monitoring digital assessments with a focus on reliability, security and a better examination experience.
          </p>
        </div>

        {/* 3 Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl border border-slate-200/90 bg-slate-50/50 p-8 hover:bg-white hover:shadow-xl hover:border-blue-200 transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6 text-blue-200" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {p.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/60 space-y-2">
                  {p.highlights.map((item, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
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
