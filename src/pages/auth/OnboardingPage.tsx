import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { AiProcessingModal } from '../../components/ui/AiProcessingModal.tsx';
import {
  Compass,
  User,
  GraduationCap,
  Code,
  Gauge,
  Sparkles,
  Target,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { login, showToast } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Retrieve pending registration if available
  const pendingData = (() => {
    try {
      const stored = sessionStorage.getItem('pending_registration');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // Step 1: Personal information
  const [fullName, setFullName] = useState(pendingData?.fullName || 'Alex Sharma');
  const [email, setEmail] = useState(pendingData?.email || 'alex.sharma@example.com');
  const [location, setLocation] = useState('New Delhi, India');

  // Step 2: Education
  const [education, setEducation] = useState(pendingData?.education || 'BCA (Bachelor of Computer Applications)');
  const [gradYear, setGradYear] = useState('2026');

  // Step 3: Current skills
  const availableSkills = [
    'HTML5', 'CSS3', 'JavaScript (ES6+)', 'TypeScript', 'React', 'Node.js',
    'Java', 'Python', 'SQL', 'Git & GitHub', 'Tailwind CSS', 'C/C++',
    'Docker', 'Figma', 'Linux', 'MongoDB'
  ];
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'HTML5', 'CSS3', 'JavaScript (ES6+)', 'Java', 'SQL', 'Git & GitHub'
  ]);

  // Step 4: Experience level
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  // Step 5: Career interests
  const availableInterests = [
    'Web & Full-Stack Development',
    'Artificial Intelligence & ML',
    'Data Science & Analytics',
    'Cybersecurity & Network Defense',
    'Cloud Architecture & DevOps',
    'UI/UX & Product Design'
  ];
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Web & Full-Stack Development',
    'UI/UX & Product Design'
  ]);

  // Step 6: Target career
  const targetCareerOptions = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'Data Scientist',
    'AI/ML Engineer',
    'Cybersecurity Analyst',
    'UI/UX Designer',
    'Cloud Engineer',
    'DevOps Engineer'
  ];
  const [targetCareer, setTargetCareer] = useState('Frontend Developer');

  // Step 7: Learning availability
  const availabilityOptions = [
    'Less than 1 hour/day',
    '1–2 hours/day',
    '2–4 hours/day',
    '4+ hours/day'
  ];
  const [learningAvailability, setLearningAvailability] = useState('2–4 hours/day');

  const toggleSkill = (sk: string) => {
    setSelectedSkills((prev) =>
      prev.includes(sk) ? prev.filter((s) => s !== sk) : [...prev, sk]
    );
  };

  const toggleInterest = (intr: string) => {
    setSelectedInterests((prev) =>
      prev.includes(intr) ? prev.filter((i) => i !== intr) : [...prev, intr]
    );
  };

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      triggerAnalysis();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const triggerAnalysis = async () => {
    setIsProcessing(true);

    try {
      // Complete user registration
      const regData = {
        fullName,
        email,
        password: pendingData?.password || 'Password123!',
        education: `${education} (${gradYear})`,
        currentRole: 'Student',
        targetCareer,
        skills: selectedSkills,
        learningAvailability
      };

      const res = await api.auth.register(regData);
      sessionStorage.removeItem('pending_registration');

      // Processing modal will complete after animation
      setTimeout(() => {
        setIsProcessing(false);
        login(res.token, res.user, res.profile);
        showToast('Personalized AI career analysis ready!', 'success');
      }, 4500);
    } catch (error: any) {
      // Fail honestly: never log the user in as the demo account or claim
      // success when registration itself failed.
      setIsProcessing(false);
      showToast(error.message || 'Registration failed. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Progress indicator */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            <span className="font-extrabold text-slate-900 text-lg">NexLeaf</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Personalized Career Setup
          </h1>
          <p className="text-xs text-slate-500">
            Step {currentStep} of 7: {
              currentStep === 1 ? 'Personal Information' :
              currentStep === 2 ? 'Academic Background' :
              currentStep === 3 ? 'Current Technical Skills' :
              currentStep === 4 ? 'Current Experience Level' :
              currentStep === 5 ? 'Career Domains of Interest' :
              currentStep === 6 ? 'Primary Target Career' :
              'Daily Learning Availability'
            }
          </p>

          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          {/* STEP 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personal Details</h3>
                  <p className="text-xs text-slate-500">How should we address your career profile?</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Education */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Academic Background</h3>
                  <p className="text-xs text-slate-500">Your current degree or qualification</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Degree Program</label>
                  <select
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  >
                    <option value="BCA (Bachelor of Computer Applications)">BCA (Bachelor of Computer Applications)</option>
                    <option value="B.Tech Computer Science">B.Tech Computer Science</option>
                    <option value="B.Sc Information Technology">B.Sc Information Technology</option>
                    <option value="MCA (Master of Computer Applications)">MCA (Master of Computer Applications)</option>
                    <option value="Self-Taught Developer">Self-Taught Developer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
                  <select
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  >
                    <option value="2026">2026 (Final Year)</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2025">2025 (Recent Graduate)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Current Skills */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Your Current Technical Skills</h3>
                  <p className="text-xs text-slate-500">Select any programming languages and tools you know</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableSkills.map((sk) => {
                  const isSelected = selectedSkills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {sk}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400">
                You can add or fine-tune skills later in your profile or via resume upload.
              </p>
            </div>
          )}

          {/* STEP 4: Experience Level */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Overall Practical Experience</h3>
                  <p className="text-xs text-slate-500">Where are you on your engineering journey?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'beginner', title: 'Beginner', desc: 'Learning core fundamentals & college syllabus coursework' },
                  { id: 'intermediate', title: 'Intermediate', desc: 'Built 2-3 small projects and understand version control' },
                  { id: 'advanced', title: 'Advanced', desc: 'Comfortable with full-stack architectures & APIs' }
                ].map((lvl) => (
                  <div
                    key={lvl.id}
                    onClick={() => setExperienceLevel(lvl.id as any)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      experienceLevel === lvl.id
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-slate-900 text-sm block">{lvl.title}</span>
                    <p className="text-xs text-slate-600 mt-1">{lvl.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Career Interests */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Career Interests</h3>
                  <p className="text-xs text-slate-500">Which technology domains excite you most?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableInterests.map((intr) => {
                  const isChecked = selectedInterests.includes(intr);
                  return (
                    <div
                      key={intr}
                      onClick={() => toggleInterest(intr)}
                      className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span>{intr}</span>
                      {isChecked && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Target Career */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Primary Target Career</h3>
                  <p className="text-xs text-slate-500">We will tailor your roadmap and skill gaps to this role</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {targetCareerOptions.map((role) => (
                  <div
                    key={role}
                    onClick={() => setTargetCareer(role)}
                    className={`p-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                      targetCareer === role
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>{role}</span>
                    {targetCareer === role && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Learning Availability */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Learning Availability</h3>
                  <p className="text-xs text-slate-500">How much time can you dedicate to learning?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availabilityOptions.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => setLearningAvailability(opt)}
                    className={`p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all flex items-center justify-between ${
                      learningAvailability === opt
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>{opt}</span>
                    {learningAvailability === opt && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all"
            >
              {currentStep === 7 ? 'Generate My Career Analysis' : 'Next Step'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Processing Modal */}
      <AiProcessingModal
        isOpen={isProcessing}
        title="Synthesizing Your Career Analysis..."
      />
    </div>
  );
};
