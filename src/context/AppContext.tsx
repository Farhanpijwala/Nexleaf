import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, tokenStorage } from '../services/api.ts';
import {
  User,
  Profile,
  UserSkill,
  CareerMatch,
  SkillGapItem,
  Roadmap,
  ResumeAnalysis,
  Career,
  UserProgressData
} from '../../server/types.js';

export type ActivePage =
  | 'landing'
  | 'about'
  | 'how-it-works'
  | 'features'
  | 'careers-public'
  | 'login'
  | 'register'
  | 'onboarding'
  | 'dashboard'
  | 'profile'
  | 'resume-analyzer'
  | 'career-assessment'
  | 'career-matches'
  | 'career-detail'
  | 'skill-gap'
  | 'roadmap'
  | 'projects'
  | 'courses'
  | 'progress'
  | 'ai-coach'
  | 'settings';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  user: User | null;
  profile: Profile | null;
  skills: UserSkill[];
  activePage: ActivePage;
  selectedCareerSlug: string | null;
  toasts: Toast[];
  isLoading: boolean;
  roadmap: Roadmap | null;
  resumeAnalysis: ResumeAnalysis | null;
  skillGaps: SkillGapItem[];
  careerMatches: CareerMatch[];
  progressData: UserProgressData | null;
  aiRecommendation: { title: string; message: string; targetSkill: string; suggestedTask: string; estimatedMinutes: number } | null;
  setActivePage: (page: ActivePage) => void;
  setSelectedCareerSlug: (slug: string | null) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  login: (token: string, user: User, profile: Profile) => void;
  logout: () => void;
  refreshAppData: () => Promise<void>;
  updateRoadmapTask: (taskId: string, status: 'not_started' | 'in_progress' | 'completed') => Promise<void>;
  updateProfileState: (user: User, profile: Profile) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [activePage, setActivePage] = useState<ActivePage>('landing');
  const [selectedCareerSlug, setSelectedCareerSlug] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core app data caches
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGapItem[]>([]);
  const [careerMatches, setCareerMatches] = useState<CareerMatch[]>([]);
  const [progressData, setProgressData] = useState<UserProgressData | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<{
    title: string;
    message: string;
    targetSkill: string;
    suggestedTask: string;
    estimatedMinutes: number;
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshAppData = useCallback(async () => {
    try {
      const [userProfRes, roadmapRes, resumeRes, gapsRes, matchesRes, progRes, aiRecRes] =
        await Promise.allSettled([
          api.profile.get(),
          api.roadmap.get(),
          api.resume.getAnalysis(),
          api.skills.getGaps(),
          api.careers.getMatches(),
          api.progress.get(),
          api.ai.getRecommendation(),
        ]);

      if (userProfRes.status === 'fulfilled') {
        setUser(userProfRes.value.user);
        setProfile(userProfRes.value.profile);
        setSkills(userProfRes.value.skills || []);
      }
      if (roadmapRes.status === 'fulfilled') {
        setRoadmap(roadmapRes.value);
      }
      if (resumeRes.status === 'fulfilled') {
        setResumeAnalysis(resumeRes.value);
      }
      if (gapsRes.status === 'fulfilled') {
        setSkillGaps(gapsRes.value);
      }
      if (matchesRes.status === 'fulfilled') {
        setCareerMatches(matchesRes.value);
      }
      if (progRes.status === 'fulfilled') {
        setProgressData(progRes.value);
      }
      if (aiRecRes.status === 'fulfilled') {
        setAiRecommendation(aiRecRes.value);
      }
    } catch (err) {
      console.error('Failed to load initial app data', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await refreshAppData();
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [refreshAppData]);

  const login = (token: string, newUser: User, newProfile: Profile) => {
    tokenStorage.set(token);
    setUser(newUser);
    setProfile(newProfile);
    refreshAppData();
    setActivePage('dashboard');
    showToast(`Welcome back, ${newUser.fullName}!`, 'success');
  };
  const logout = () => {
  tokenStorage.clear();

  // Clear the current user AND every cached piece of their app data, so a
  // previous user's profile, skills, roadmap, resume, gaps, matches and
  // progress are never left visible after logout / to the next user.
  setUser(null);
  setProfile(null);
  setSkills([]);
  setRoadmap(null);
  setResumeAnalysis(null);
  setSkillGaps([]);
  setCareerMatches([]);
  setProgressData(null);
  setAiRecommendation(null);
  setSelectedCareerSlug(null);

  // Return to the public landing page
  setActivePage('landing');

  showToast('You have been logged out.', 'info');
};

  const updateRoadmapTask = async (
    taskId: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => {
    try {
      const updated = await api.roadmap.updateTask(taskId, status);
      setRoadmap(updated);
      showToast(`Task status updated to "${status.replace('_', ' ')}"`, 'success');

      // Refresh progress & AI recommendation in the background
      const [prog, aiRec] = await Promise.allSettled([
        api.progress.get(),
        api.ai.getRecommendation(),
      ]);
      if (prog.status === 'fulfilled') setProgressData(prog.value);
      if (aiRec.status === 'fulfilled') setAiRecommendation(aiRec.value);
    } catch (error: any) {
      showToast(error.message || 'Failed to update task', 'error');
    }
  };

  const updateProfileState = (updatedUser: User, updatedProfile: Profile) => {
    setUser(updatedUser);
    setProfile(updatedProfile);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        skills,
        activePage,
        selectedCareerSlug,
        toasts,
        isLoading,
        roadmap,
        resumeAnalysis,
        skillGaps,
        careerMatches,
        progressData,
        aiRecommendation,
        setActivePage,
        setSelectedCareerSlug,
        showToast,
        removeToast,
        login,
        logout,
        refreshAppData,
        updateRoadmapTask,
        updateProfileState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
