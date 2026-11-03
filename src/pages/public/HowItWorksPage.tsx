import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  FileUp,
  BrainCircuit,
  Target,
  GitBranch,
  FolderKanban,
  LineChart,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const { setActivePage } = useApp();

  const steps = [
    {
      num: '01',
      icon: FileUp,
      title: 'Profile Setup & Resume Ingestion',
      desc: 'Upload your current PDF resume or select your known technical skills and educational status. The client-side PDF parser extracts textual contents safely without sending raw files across insecure channels.'
    },
    {
      num: '02',
      icon: BrainCircuit,
      title: 'Multimodal AI Analysis (Gemini 3.8 Flash)',
      desc: 'Our backend AI engine processes your background, identifies verified programming proficiencies, calculates an objective resume score (0-100), and audits gaps against real hiring trends.'
    },
    {
      num: '03',
      icon: Target,
      title: 'Career Track Matching & Assessment',
      desc: 'Take an optional 12-question interactive assessment to test your affinity for Frontend, Backend, Full Stack, Data Science, AI/ML, or Cybersecurity. The system calculates exact match percentages.'
    },
    {
      num: '04',
      icon: GitBranch,
      title: 'Personalized Roadmap Generation',
      desc: 'Instead of generic roadmaps, you receive a custom milestone schedule broken down into phases. Each phase provides exact estimated completion hours, difficulty flags, and documentation links.'
    },
    {
      num: '05',
      icon: FolderKanban,
      title: 'Portfolio Projects & Capstone Practice',
      desc: 'Learn through hands-on project recommendations designed specifically to resolve your identified skill gaps, complete with deliverables and technology requirements.'
    },
    {
      num: '06',
      icon: LineChart,
      title: 'Continuous Tracking & Contextual AI Coaching',
      desc: 'As you complete roadmap tasks, your readiness score increases. The AI Career Coach continuously analyzes your up-to-date metrics and provides context-aware guidance.'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Methodology</span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            How NexLeaf Works
          </h1>
          <p className="text-base text-slate-600">
            A cohesive feedback loop connecting your current abilities to your target industry career.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm space-y-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-slate-200">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Interactive Callout */}
        <div className="bg-indigo-900 text-white rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl font-bold">Experience the Guided Workflow</h3>
            <p className="text-sm text-indigo-200 max-w-xl">
              Start with the resume analyzer or explore career paths to see the system in action.
            </p>
          </div>
          <button
            onClick={() => setActivePage('onboarding')}
            className="px-6 py-3 bg-white text-indigo-950 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all shrink-0"
          >
            Start Analysis Now
          </button>
        </div>
      </div>
    </div>
  );
};
