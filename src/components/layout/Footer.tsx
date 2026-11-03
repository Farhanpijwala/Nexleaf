import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Compass, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActivePage } = useApp();

  return (
    <footer className="bg-slate-950 text-slate-400 py-14 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-850">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">NexLeaf</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              NexLeaf is an AI-powered career navigation platform empowering students and job seekers with personalized roadmaps, resume audits, skill gap analysis, and tailored project recommendations.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-500">
              <span>BCA Capstone Project 2026</span>
              <span>·</span>
              <span>Gemini 3.8 Flash Powered</span>
            </div>
          </div>

          {/* Links: Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => setActivePage('how-it-works')} className="hover:text-white transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('features')} className="hover:text-white transition-colors">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('careers-public')} className="hover:text-white transition-colors">
                  Careers Catalog
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('about')} className="hover:text-white transition-colors">
                  About
                </button>
              </li>
            </ul>
          </div>

          {/* Links: Workflow */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">AI Workflow</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => setActivePage('resume-analyzer')} className="hover:text-white transition-colors">
                  Resume Analyzer
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('career-assessment')} className="hover:text-white transition-colors">
                  Career Assessment
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('skill-gap')} className="hover:text-white transition-colors">
                  Skill Gap Analysis
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('roadmap')} className="hover:text-white transition-colors">
                  Dynamic Roadmap
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('ai-coach')} className="hover:text-white transition-colors">
                  AI Career Coach
                </button>
              </li>
            </ul>
          </div>

          {/* Technical Specs & Schema */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">Project & Database</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => setActivePage('settings')} className="hover:text-white transition-colors">
                  Architecture Specs
                </button>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 NexLeaf. All rights reserved. AI-Powered Career Navigation Platform.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Security Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
