import React from 'react';
import { 
  Camera, 
  ScanFace, 
  Compass, 
  AppWindow, 
  Maximize, 
  ClipboardX, 
  RotateCcw, 
  FileText,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const SecuritySection = () => {
  const securityFeatures = [
    {
      title: 'Camera Monitoring',
      description: 'Continuous video feed verification to ensure candidate identity continuity throughout the session.',
      icon: Camera,
    },
    {
      title: 'Face Presence',
      description: 'AI-assisted integrity signals detecting when a candidate is missing or if multiple faces enter the frame.',
      icon: ScanFace,
    },
    {
      title: 'Head-Pose Signals',
      description: 'Orientation estimation to assist proctors in flagging unusual sustained deviation away from the display.',
      icon: Compass,
    },
    {
      title: 'Tab/Window Integrity',
      description: 'Automated event capture when the assessment window loses focus or application switching occurs.',
      icon: AppWindow,
    },
    {
      title: 'Fullscreen Monitoring',
      description: 'Controlled testing viewport with configurable tolerances for unexpected exits or display disruptions.',
      icon: Maximize,
    },
    {
      title: 'Copy/Paste Detection',
      description: 'Restriction of system clipboard shortcuts and input interception to prevent external text insertion.',
      icon: ClipboardX,
    },
    {
      title: 'Session Recovery',
      description: 'State synchronization mechanisms ensuring students can resume safely in the event of local hardware failure.',
      icon: RotateCcw,
    },
    {
      title: 'Audit Logs',
      description: 'Immutable timeline of timestamped candidate events and proctor observations preserved for post-exam review.',
      icon: FileText,
    },
  ];

  return (
    <section id="security" className="py-20 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Assessment Integrity Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for Secure Digital Assessments
          </h2>

          <p className="text-base text-slate-400 leading-relaxed">
            GLB ExamSphere combines automated system defenses with human-review oriented monitoring to help examination authorities maintain test credibility and identify unusual examination activity.
          </p>
        </div>

        {/* 8 Security Capability Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-slate-800/70 backdrop-blur border border-slate-700/80 rounded-2xl p-6 hover:bg-slate-800 hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800/80 text-blue-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Professional Clarification Note regarding CV signals */}
        <div className="mt-12 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-1">
              <p className="font-bold text-white text-sm">Institutional Integrity Protocol</p>
              <p>
                Configurable integrity monitoring and AI-assisted signals are designed to assist faculty invigilators by identifying anomalies for human review. In accordance with GL Bajaj institutional policy, all final determinations are evaluated by authorized college examination committees.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SecuritySection;
