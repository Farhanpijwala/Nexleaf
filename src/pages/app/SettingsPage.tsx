import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { GraduationCap } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, profile } = useApp();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">System & Project Configuration</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Project Details
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Inspect AI models, database architecture, and student account configuration.
        </p>
      </div>

      {/* BCA Final Project Technical Architecture Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">BCA College Project Verification</h2>
            <p className="text-xs text-slate-500">Bachelor of Computer Applications Capstone Specifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Project Name</span>
            <div className="text-sm font-bold text-slate-900">NexLeaf</div>
            <p className="text-slate-500">AI-Powered Career Navigation Platform</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">AI Integration</span>
            <div className="text-sm font-bold text-slate-900">Google Gemini 3.8 Flash</div>
            <p className="text-slate-500">Server-Side SDK with JSON Schema</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Database Architecture</span>
            <div className="text-sm font-bold text-slate-900">MySQL 8.0 (18 Tables)</div>
            <p className="text-slate-500">Fully Relational & Normalized</p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Current Session Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Logged-in User</span>
            <span className="font-bold text-slate-900 text-sm">{user?.fullName}</span>
            <span className="text-slate-500 block">{user?.email}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Target Career Goal</span>
            <span className="font-bold text-indigo-600 text-sm">{profile?.targetCareer}</span>
            <span className="text-slate-500 block">{profile?.learningHoursPerDay}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
