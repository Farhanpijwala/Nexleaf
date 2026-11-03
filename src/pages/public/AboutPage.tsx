import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Compass, GraduationCap, ShieldCheck, Database, Award, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setActivePage } = useApp();

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 text-center">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">About The Project</span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            NexLeaf
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            An AI-Powered Career Navigation Platform designed to revolutionize how students transition from academic curriculums to high-demand engineering careers.
          </p>
        </div>

        {/* Academic Context Card */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Academic Background & Motivation</h2>
              <p className="text-xs text-slate-500">BCA Final Year Engineering Thesis</p>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            Many computer science and computer applications students encounter a significant gap between textbook theory (algorithms, basic syntax, and classic relational schemas) and current industry expectations (component-driven architectures, TypeScript, automated cloud deployment, and API microservices).
          </p>

          <p className="text-sm text-slate-700 leading-relaxed">
            NexLeaf bridges this divide by providing an automated, objective, and personalized system that extracts a student's actual current capabilities from their resume, tests their practical affinity through interactive assessments, and generates a structured, phased learning roadmap.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="font-semibold text-slate-900 block">Degree Program</span>
              <span className="text-slate-600">Bachelor of Computer Applications</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="font-semibold text-slate-900 block">AI Engine</span>
              <span className="text-slate-600">Google Gemini 3.8 Flash SDK</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="font-semibold text-slate-900 block">Database Target</span>
              <span className="text-slate-600">MySQL 8.0 Relational Design</span>
            </div>
          </div>
        </div>

        {/* System Architecture Section */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Technical Architecture & Stack</h2>
              <p className="text-xs text-slate-500">Production-grade full-stack engineering</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <strong className="text-slate-900">Frontend:</strong> React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts for analytics visualizers, and browser PDF.js for client-side PDF document parsing.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <strong className="text-slate-900">Backend:</strong> Node.js, Express.js REST API with JWT authentication, Bcrypt password hashing, and clean controller routing.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <strong className="text-slate-900">Artificial Intelligence:</strong> Server-side @google/genai SDK leveraging the Gemini 3.8 Flash model with structured JSON response schemas for deterministic career recommendations.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <strong className="text-slate-900">Database Layer:</strong> Relational schema with 18 normalized tables spanning users, profiles, skills, resumes, assessments, roadmaps, and progress tracking.
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={() => setActivePage('dashboard')}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              Launch Platform
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
