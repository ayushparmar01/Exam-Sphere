import React from 'react';
import { MapPin, Building, ShieldCheck, Mail, Phone, HelpCircle } from 'lucide-react';

export const InstitutionalContact = () => {
  return (
    <section id="contact" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Institutional Location Info */}
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              Campus & Examination Cell
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              GL Bajaj Group of Institutions, Mathura
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
              Official institutional portal for internal evaluations, term tests, semester preparation, and continuous assessment under the purview of the College Examination Cell.
            </p>

            <div className="pt-2 space-y-3">
              <div className="flex items-start gap-3 text-xs text-slate-700">
                <MapPin className="w-4 h-4 text-blue-800 flex-shrink-0 mt-0.5" />
                <span>
                  NH-2, Mathura-Delhi Road, PO-Chaumuhan, Mathura, Uttar Pradesh 281406
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <Building className="w-4 h-4 text-blue-800 flex-shrink-0" />
                <span>Affiliation: Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Approved by AICTE, Ministry of Education, Government of India</span>
              </div>
            </div>
          </div>

          {/* Quick Notice / Support Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Examination Helpdesk</h3>
                <p className="text-xs text-slate-500">Student & Faculty Inquiries</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              For schedule inquiries, slot allocations, or technical assistance during an active examination window, please reach out to your departmental exam coordinator or the Examination Cell.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Operating Hours:</span>
                <span>09:00 AM – 05:00 PM (IST)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Session Status:</span>
                <span className="text-emerald-700 font-bold">Portals Active</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InstitutionalContact;
