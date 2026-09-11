import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Camera, 
  Layers,
  Server,
  Activity,
  CheckCircle2
} from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-10 pb-20 lg:pt-20 lg:pb-28 bg-[#0F1115] border-b border-slate-800/80">
      
      {/* Subtle Dark Ambient Glow - Non-distracting */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[20rem] bg-sky-950/20 rounded-full blur-3xl pointer-events-none" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Institutional Label Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151922] border border-slate-700/70 text-slate-300 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="uppercase text-[11px] font-bold">
                GL BAJAJ GROUP OF INSTITUTIONS, MATHURA
              </span>
            </div>

            {/* Platform Heading & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#E6EDF3] tracking-tight leading-[1.08] font-sans">
                GLB <span className="text-sky-400">ExamSphere</span>
              </h1>
              <p className="text-lg sm:text-xl font-bold text-slate-300 tracking-tight">
                Smart • Secure • Seamless Examination Platform
              </p>
            </div>

            {/* Supporting Text */}
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              A modern digital examination platform designed to provide a secure, reliable and seamless assessment experience for students, teachers and administrators.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/role-select"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-sky-500/20 transition-all flex items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-sky-400"
                id="hero-login-btn"
              >
                <span>Login to ExamSphere</span>
                <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#151922] hover:bg-[#1C2230] text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-slate-700/80 hover:border-slate-600 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-700"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Explore Platform</span>
              </a>
            </div>

            {/* Clean System Highlights */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 font-medium">
              <div className="flex items-center justify-center lg:justify-start gap-2 bg-[#151922] px-3 py-2 rounded-lg border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Protected Session</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 bg-[#151922] px-3 py-2 rounded-lg border border-slate-800">
                <Server className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Server Synchronized</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 bg-[#151922] px-3 py-2 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Reliable Autosave</span>
              </div>
            </div>

          </div>

          {/* Right Hero Visual: Abstract Dark Examination UI Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-lg bg-[#151922] rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
              
              {/* Interface Preview Header */}
              <div className="bg-[#0B0D11] px-4 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-[#E6EDF3] leading-tight">Assessment Session</p>
                    <p className="text-[10px] text-slate-400">Institutional Examination Interface</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <div className="px-2 py-0.5 rounded bg-[#151922] text-amber-300 font-mono text-xs font-bold border border-slate-700">
                    00:42:15
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="bg-[#12161F] px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  <span>Session Active & Authoritative</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                  Autosaved at Server
                </span>
              </div>

              {/* Sample Question View */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">Question 14 of 30</span>
                  <span className="text-slate-400 font-mono text-[11px]">Single Choice</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#E6EDF3] leading-snug">
                    Which data structure provides amortized O(1) time complexity for insertion, deletion, and lookup operations?
                  </h4>
                </div>

                {/* Option Items */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-800 bg-[#0F1115] text-slate-300 flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-slate-300">A</span>
                    <span>Self-Balancing Binary Search Tree (AVL)</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-sky-500/60 bg-sky-950/20 text-[#E6EDF3] font-medium flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded bg-sky-600 text-slate-950 flex items-center justify-center font-bold text-[11px]">B</span>
                    <span>Hash Table with Universal Hashing</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-800 bg-[#0F1115] text-slate-300 flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-slate-300">C</span>
                    <span>B+ Tree Index with Balanced Leaves</span>
                  </div>
                </div>

                {/* Question Palette Mini Preview */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Palette Status:</span>
                  <div className="flex gap-1.5 font-mono text-[10px]">
                    <span className="w-5 h-5 rounded bg-emerald-600/80 text-white font-bold flex items-center justify-center">12</span>
                    <span className="w-5 h-5 rounded bg-emerald-600/80 text-white font-bold flex items-center justify-center">13</span>
                    <span className="w-5 h-5 rounded bg-sky-500 text-slate-950 font-bold flex items-center justify-center">14</span>
                    <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center">15</span>
                  </div>
                </div>
              </div>

              {/* Bottom Clarification Notice */}
              <div className="bg-[#0B0D11] px-4 py-2 border-t border-slate-800 text-[10px] text-slate-400 text-center">
                Institutional Interface Preview • GL Bajaj Examination Engine
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
