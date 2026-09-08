import React from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  Flame,
  Globe,
  GraduationCap,
  Layers,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Enterprise Testing Engine with Zero Answer Leaks</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Test Your Knowledge.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">
                  Track Your Growth.
                </span>{' '}
                Reach Your Goals.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                ExamSphere is a modern online assessment platform delivering realistic timed examinations, instantaneous evaluation, multi-dimensional mistake analytics, dynamic rank leaderboards, and certified downloadable reports.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/exams"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start Testing
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-slate-700 font-bold text-sm border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                  Explore Features
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Server-Timed Integrity
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant Results
                </span>
                <span className="flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-500" /> Certified PDF Reports
                </span>
              </div>
            </div>

            {/* Right Interactive Mockup Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 overflow-hidden">
                {/* Header Preview */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-bold text-slate-500 ml-2">Assessment Active</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                    00:24:18
                  </div>
                </div>

                {/* Question Mock */}
                <div className="py-5 space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <span>Question 7 of 25</span>
                    <span className="text-emerald-600 font-bold">Saved ✓</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 leading-snug">
                    Which algorithm guarantees optimal single-source shortest paths in directed weighted graphs with non-negative edge weights?
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">A</span>
                      <span>Bellman-Ford Algorithm</span>
                    </div>
                    <div className="p-3 rounded-xl border-2 border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold flex items-center gap-3 shadow-sm">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">B</span>
                      <span>Dijkstra's Algorithm</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">C</span>
                      <span>Floyd-Warshall Algorithm</span>
                    </div>
                  </div>
                </div>

                {/* Floating Metric Badge */}
                <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 text-white flex items-center justify-between text-xs font-semibold shadow-md">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>Live Rank: #4 (Top 5%)</span>
                  </div>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[11px]">88% Score</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Engine Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Realistic High-Stakes Assessments
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              ExamSphere combines robust server authority with seamless UI responsiveness to simulate professional testing environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Realistic Online Exams',
                desc: 'Timed MCQ environment with question palette, review tags, and live server clock synchronization.',
                icon: Clock,
                color: 'indigo',
              },
              {
                title: 'Instant Results',
                desc: 'Automated server evaluation upon submission with instant score, accuracy, and pass/fail indicators.',
                icon: Zap,
                color: 'emerald',
              },
              {
                title: 'Detailed Performance Analytics',
                desc: 'Interactive Recharts visualizer tracking score trajectories, subject mastery, and time efficiency.',
                icon: BarChart3,
                color: 'purple',
              },
              {
                title: 'Leaderboards & Rankings',
                desc: 'Dynamic leaderboards utilizing deterministic tie-breakers (score, accuracy, time taken).',
                icon: Trophy,
                color: 'amber',
              },
              {
                title: 'Exam Scheduling',
                desc: 'Comprehensive calendar timeline for scheduled, active, and completed certifications.',
                icon: Layers,
                color: 'indigo',
              },
              {
                title: 'Downloadable Reports',
                desc: 'Certified PDF performance reports with candidate branding, topic breakdowns, and study advice.',
                icon: Download,
                color: 'emerald',
              },
              {
                title: 'AI-Powered Insights',
                desc: 'Dual-engine support: Gemini AI analysis and deterministic rule-based learning plans.',
                icon: Sparkles,
                color: 'purple',
              },
              {
                title: 'Secure Assessment Environment',
                desc: 'Server-side answer confidentiality, idempotent submissions, and integrity telemetry.',
                icon: Lock,
                color: 'rose',
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Four Steps to Assessment Mastery
            </h2>
            <p className="text-sm text-slate-500">
              Simple, reliable, and scientifically engineered assessment lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Create Account',
                desc: 'Register in seconds with email or log in using one-click demo credentials.',
              },
              {
                step: '02',
                title: 'Choose an Exam',
                desc: 'Browse domain assessments across DSA, DBMS, OS, Networks, and AI Fundamentals.',
              },
              {
                step: '03',
                title: 'Take Assessment',
                desc: 'Experience realistic testing with synchronized timer, question palette, and debounced auto-save.',
              },
              {
                step: '04',
                title: 'Analyze & Improve',
                desc: 'Review exact question breakdowns, consult explanations, and target weak topics.',
              },
            ].map((s, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="text-3xl font-extrabold text-indigo-600/30 block font-mono">{s.step}</span>
                <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section (Platform Demo Statistics) */}
      <section className="py-16 bg-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-wider text-indigo-300 uppercase mb-2">
            Assessment Benchmarks (Verified Platform Statistics)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8">
            <div>
              <p className="text-4xl sm:text-5xl font-extrabold text-white">10K+</p>
              <p className="text-xs text-indigo-200 mt-2">Practice Questions</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-extrabold text-white">5K+</p>
              <p className="text-xs text-indigo-200 mt-2">Enrolled Candidates</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-extrabold text-white">1K+</p>
              <p className="text-xs text-indigo-200 mt-2">Completed Assessments</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-extrabold text-white">95%</p>
              <p className="text-xs text-indigo-200 mt-2">Candidate Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ready to test yourself?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Join ExamSphere today to experience zero-leak assessment integrity, benchmark against peer leaderboards, and elevate your technical prowess.
          </p>
          <div className="pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
