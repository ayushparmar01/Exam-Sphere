import React from 'react';
import { InstitutionalNavbar } from '../components/landing/InstitutionalNavbar';
import { Hero } from '../components/landing/Hero';
import { TrustSection } from '../components/landing/TrustSection';
import { FeatureSection } from '../components/landing/FeatureSection';
import { SecuritySection } from '../components/landing/SecuritySection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { InstitutionalFooter } from '../components/landing/InstitutionalFooter';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6EDF3] font-sans selection:bg-sky-500 selection:text-slate-950">
      {/* Top Navbar */}
      <InstitutionalNavbar />

      {/* Main Content Sections */}
      <main>
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Trust / Institutional Role Support Section */}
        <TrustSection />

        {/* 3. Core Feature Capabilities Section */}
        <FeatureSection />

        {/* 4. Examination Security Architecture Section */}
        <SecuritySection />

        {/* 5. 4-Step How It Works Workflow Section */}
        <HowItWorks />
      </main>

      {/* Institutional Footer */}
      <InstitutionalFooter />
    </div>
  );
};

export default LandingPage;
