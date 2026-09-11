import React from 'react';
import { 
  Lock, 
  UserCheck, 
  ShieldAlert, 
  Eye, 
  CheckCircle, 
  FileCheck2, 
  FileText, 
  WifiOff 
} from 'lucide-react';

export const SecuritySection = () => {
  const securityItems = [
    {
      title: 'Authentication',
      description: 'Secure credential verification and token-based authentication protocols.',
      icon: Lock,
    },
    {
      title: 'Role-Based Access Control',
      description: 'Clear boundary enforcement between student, teacher, and admin operations.',
      icon: UserCheck,
    },
    {
      title: 'Exam Session Protection',
      description: 'Controlled browser viewport, focus monitoring, and attempt restrictions.',
      icon: ShieldAlert,
    },
    {
      title: 'Integrity Monitoring',
      description: 'Real-time telemetry and proctoring signals for authorized review.',
      icon: Eye,
    },
    {
      title: 'Server-Side Validation',
      description: 'Authoritative server timestamps and server-side answer evaluation.',
      icon: CheckCircle,
    },
    {
      title: 'Secure Result Handling',
      description: 'Tamper-resistant score storage and controlled outcome release schedules.',
      icon: FileCheck2,
    },
    {
      title: 'Audit Logging',
      description: 'Timestamped event records for administrative visibility and compliance review.',
      icon: FileText,
    },
    {
      title: 'Network Recovery',
      description: 'Resilient answer caching to handle brief local network disconnects gracefully.',
      icon: WifiOff,
    },
  ];

  return (
    <section id="security" className="py-20 bg-[#0B0D11] border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#151922] border border-slate-800 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            Security & Compliance
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#E6EDF3] tracking-tight">
            Designed for Secure Digital Assessments
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Multi-layered institutional controls ensuring test authenticity, session continuity, and tamper-resistant operations.
          </p>
        </div>

        {/* 8 Security Capability Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {securityItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#12141A] rounded-xl border border-slate-800/80 p-5 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-[#151922] border border-slate-800 flex items-center justify-center text-sky-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#E6EDF3]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
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

export default SecuritySection;
