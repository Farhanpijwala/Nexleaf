import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { extractTextFromPdf } from '../../utils/pdfParser.ts';
import { AiProcessingModal } from '../../components/ui/AiProcessingModal.tsx';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  FileCheck,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

export const ResumeAnalyzerPage: React.FC = () => {
  const { resumeAnalysis, refreshAppData, showToast, setActivePage } = useApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedTextPreview, setExtractedTextPreview] = useState<string>('');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'text/plain') {
      showToast('Please upload a PDF document (or .txt file).', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size exceeds the 10MB limit.', 'error');
      return;
    }

    setSelectedFile(file);
    setIsExtractingPdf(true);

    try {
      const text = await extractTextFromPdf(file);
      setExtractedTextPreview(text);
      showToast(`Resume "${file.name}" ready for AI analysis`, 'success');
    } catch (err: any) {
      showToast('Failed to parse PDF text. Please verify file integrity.', 'error');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    // Never analyze sample/invented text in place of the user's own resume:
    // without extracted text there is nothing honest to analyze.
    if (!extractedTextPreview.trim()) {
      showToast('Please upload a resume file first — its text could not be read yet.', 'error');
      return;
    }
    const textToAnalyze = extractedTextPreview;

    setIsAnalyzing(true);
    try {
      await api.resume.analyze(textToAnalyze, selectedFile?.name || 'Resume_BCA.pdf');
      await refreshAppData();
      showToast('Resume analyzed successfully with Gemini 3.8 Flash!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to complete resume analysis', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentAnalysis = resumeAnalysis;
  const score = currentAnalysis?.resumeScore ?? 0;

  const scoreChartData = [{ name: 'Score', value: score, fill: score >= 80 ? '#10b981' : score >= 60 ? '#4f46e5' : '#f59e0b' }];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Core Evaluation Engine</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          AI Resume Analyzer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Upload your resume in PDF format. Gemini 3.8 Flash audits your technical skills, computes a placement readiness score, and identifies critical gaps.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="text-sm sm:text-base font-bold text-slate-900">
              {selectedFile ? selectedFile.name : 'Drop your resume here'}
            </p>
            <p className="text-xs text-slate-500">
              PDF files up to 10MB (Standard single or multi-page formats)
            </p>
          </div>

          <button
            type="button"
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors mt-2"
          >
            {selectedFile ? 'Change File' : 'Upload Resume'}
          </button>
        </div>

        {/* Selected file preview & analysis trigger */}
        {selectedFile && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block truncate">{selectedFile.name}</span>
                <span className="text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Ready for analysis
                </span>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isExtractingPdf}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing with Gemini...' : 'Analyze Resume with AI'}
            </button>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {currentAnalysis ? (
        <div className="space-y-6">
          {/* Top Score & Highlights Banner */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Score Radial Visualizer */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
              <div className="h-32 w-32 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="75%"
                    outerRadius="100%"
                    data={scoreChartData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">{score}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">out of 100</span>
                </div>
              </div>

              <div className="mt-2 text-xs font-bold text-slate-900">
                {score >= 85 ? 'Strong Placement Candidate' : score >= 70 ? 'Solid Foundation (Needs Polish)' : 'Early Stage Profile'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Evaluated against entry-level tech benchmarks</p>
            </div>

            {/* Academic & Experience Overview */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block">Candidate Audit</span>
                <h3 className="text-lg font-bold text-slate-900">{currentAnalysis.fileName}</h3>
                <p className="text-xs text-slate-500">Analyzed on {currentAnalysis.uploadDate}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="font-semibold text-slate-700 block">Education Background</span>
                  <p className="text-slate-600 leading-relaxed">{currentAnalysis.educationSummary}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="font-semibold text-slate-700 block">Experience / Projects</span>
                  <p className="text-slate-600 leading-relaxed">{currentAnalysis.experienceSummary}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Skills vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detected Skills */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Detected Verified Skills ({currentAnalysis.detectedSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentAnalysis.detectedSkills.map((sk) => (
                  <span
                    key={sk}
                    className="text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 rounded-lg"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Critical Missing Skills ({currentAnalysis.missingSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentAnalysis.missingSkills.map((sk) => (
                  <span
                    key={sk}
                    className="text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths and Concrete Improvement Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Candidate Strengths</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                {currentAnalysis.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Revisions & Suggestions */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Resume Improvement Suggestions</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                {currentAnalysis.improvementSuggestions.map((sug, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested Career Paths */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Suggested Career Alignments</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentAnalysis.suggestedCareerPaths.map((cp) => (
                <div key={cp.career} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{cp.career}</span>
                    <span className="text-xs font-bold text-emerald-600">{cp.matchPct}%</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{cp.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Upload a resume above or click "Analyze Resume with AI" to generate your first audit report.
        </div>
      )}

      {/* AI Processing Modal */}
      <AiProcessingModal
        isOpen={isAnalyzing}
        title="Analyzing Resume with Gemini 3.8 Flash..."
        steps={[
          'Extracting semantic resume text and document layout...',
          'Detecting programming languages, frameworks and databases...',
          'Comparing project descriptions against industry metrics...',
          'Calculating composite placement score (0-100)...',
          'Formulating actionable resume improvement points...'
        ]}
      />
    </div>
  );
};
