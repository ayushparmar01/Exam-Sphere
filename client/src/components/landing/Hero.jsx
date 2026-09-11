import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Camera, 
  Lock, 
  Sparkles, 
  GraduationCap, 
  Server,
  Activity,
  Layers
} from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-slate-50/70 via-blue-50/30 to-white border-b border-slate-200">
      {/* Decorative Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Institution Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-bold tracking-wide shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="uppercase">GL BAJAJ GROUP OF INSTITUTIONS, MATHURA</span>
            </div>

            {/* Product Name & Headings */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] font-sans">
                GLB <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800">
                  ExamSphere
                </span>
              </h1>
              <p className="text-lg sm:text-xl font-bold text-blue-800/90 tracking-tight">
                Smart • Secure • Seamless Examination Platform
              </p>
            </div>

            {/* Core Description */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              An integrated digital examination platform designed to deliver secure, reliable and efficient online assessments for students, faculty and administrators.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/role-select"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-950/20 hover:shadow-xl hover:shadow-blue-950/30 transition-all flex items-center justify-center gap-2.5 group"
                id="hero-login-btn"
              >
                <span>Login to Portal</span>
                <ArrowRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 hover:border-slate-400 shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Explore Platform</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 font-medium">
              <div className="flex items-center justify-center lg:justify-start gap-2 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-200/80 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Protected Sessions</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-200/80 shadow-xs">
                <Server className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Server-Timed Accuracy</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-200/80 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Automated Evaluation</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual: Sophisticated Examination Interface Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden">
              
              {/* Mockup Top Header */}
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold leading-tight">B.Tech End-Term Assessment</p>
                    <p className="text-[10px] text-slate-400">Department of Computer Science & Engg.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Timer:</span>
                  <div className="px-2.5 py-1 rounded bg-slate-800 text-amber-300 font-mono text-xs font-bold border border-slate-700">
                    00:42:15
                  </div>
                </div>
              </div>

              {/* Mockup Integrity & Camera Monitoring Ribbon */}
              <div className="bg-blue-50/80 px-4 py-2 border-b border-blue-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-blue-900 font-semibold">
                  <Camera className="w-3.5 h-3.5 text-blue-700" />
                  <span>Proctoring Feed: Active</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Face In Frame
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Fullscreen Locked
                  </span>
                </div>
              </div>

              {/* Question & Exam Content Preview */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">Question 14 of 30</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Auto-Saved at Server ✓
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Data Structures & Algorithms</p>
                  <h4 className="text-sm font-bold text-slate-800 leading-snug">
                    Which data structure provides amortized O(1) time complexity for insertion, deletion, and lookup operations?
                  </h4>
                </div>

                {/* Question Options */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-[11px]">A</span>
                    <span>Self-Balancing Binary Search Tree (AVL)</span>
                  </div>
                  <div className="p-2.5 rounded-lg border-2 border-blue-600 bg-blue-50 text-blue-950 font-semibold flex items-center gap-2.5 shadow-xs">
                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">B</span>
                    <span>Hash Table with Universal Hashing</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-[11px]">C</span>
                    <span>B+ Tree Index with Balanced Leaves</span>
                  </div>
                </div>

                {/* Palette Miniature */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium">Palette Status:</span>
                  <div className="flex gap-1">
                    <span className="w-5 h-5 rounded bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">12</span>
                    <span className="w-5 h-5 rounded bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">13</span>
                    <span className="w-5 h-5 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">14</span>
                    <span className="w-5 h-5 rounded bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-[10px]">15</span>
                    <span className="w-5 h-5 rounded bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px]">16</span>
                  </div>
                </div>
              </div>

              {/* Bottom Clarification Caption */}
              <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 text-[10px] text-slate-500 text-center">
                Interactive Institutional Portal Preview • GL Bajaj Examination Engine
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
