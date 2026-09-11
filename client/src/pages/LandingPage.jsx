import React from 'react';
import { InstitutionalNavbar } from '../components/landing/InstitutionalNavbar';
import { Hero } from '../components/landing/Hero';
import { TrustSection } from '../components/landing/TrustSection';
import { FeatureSection } from '../components/landing/FeatureSection';
import { SecuritySection } from '../components/landing/SecuritySection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { InstitutionalContact } from '../components/landing/InstitutionalContact';
import { InstitutionalFooter } from '../components/landing/InstitutionalFooter';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-900 selection:text-white">
      {/* Top Institutional Header */}
      <InstitutionalNavbar />

      {/* Main Page Sections */}
      <main>
        {/* 1. Hero Section with Institutional Hierarchy & Interface Mockup */}
        <Hero />

        {/* 2. Trust / Built for GL Bajaj Pillar Section */}
        <TrustSection />

        {/* 3. Core Features Section (6 Institutional Assessment Capabilities) */}
        <FeatureSection />

        {/* 4. Exam Security & Integrity Signals Section */}
        <SecuritySection />

        {/* 5. 4-Step How It Works Workflow Timeline */}
        <HowItWorks />

        {/* 6. Institutional Campus & Helpdesk Info */}
        <InstitutionalContact />
      </main>

      {/* Institutional Footer */}
      <InstitutionalFooter />
    </div>
  );
};

export default LandingPage;
