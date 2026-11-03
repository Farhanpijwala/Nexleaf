import {
  User,
  Profile,
  UserSkill,
  Career,
  CareerMatch,
  SkillGapItem,
  Roadmap,
  Project,
  CourseResource,
  ResumeAnalysis,
  AssessmentQuestion,
  AssessmentResult,
  UserProgressData
} from '../../server/types.js';

const TOKEN_KEY = 'nexleaf_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) errorMsg = errJson.error;
    } catch {
      // Ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: User; profile: Profile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: {
      email: string;
      password: string;
      fullName: string;
      education: string;
      currentRole: string;
      targetCareer?: string;
      skills?: string[];
      learningAvailability?: string;
    }) =>
      request<{ token: string; user: User; profile: Profile }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getMe: () => request<{ user: User; profile: Profile }>('/auth/me'),
  },

  profile: {
    get: () => request<{ user: User; profile: Profile; skills: UserSkill[] }>('/profile'),
    update: (updates: Partial<Profile & { fullName: string; education: string; currentRole: string }>) =>
      request<{ user: User; profile: Profile }>('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
  },

  skills: {
    getAll: () => request<UserSkill[]>('/skills'),
    add: (skill: { skillName: string; proficiency: 'beginner' | 'intermediate' | 'advanced'; source?: string }) =>
      request<UserSkill>('/skills', {
        method: 'POST',
        body: JSON.stringify(skill),
      }),
    remove: (id: string) =>
      request<{ success: boolean; message: string }>(`/skills/${id}`, {
        method: 'DELETE',
      }),
    getGaps: () => request<SkillGapItem[]>('/skills/gaps'),
    refreshGaps: () =>
      request<SkillGapItem[]>('/skills/gaps/refresh', {
        method: 'POST',
      }),
  },

  resume: {
    getAnalysis: () => request<ResumeAnalysis | null>('/resume/analysis'),
    analyze: (resumeText: string, fileName?: string) =>
      request<ResumeAnalysis>('/resume/analyze', {
        method: 'POST',
        body: JSON.stringify({ resumeText, fileName }),
      }),
  },

  assessment: {
    getQuestions: () => request<AssessmentQuestion[]>('/assessment/questions'),
    submit: (answers: Record<string, Record<string, number>>) =>
      request<AssessmentResult>('/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),
    getResult: () => request<AssessmentResult | null>('/assessment/result'),
  },

  careers: {
    getAll: () => request<Career[]>('/careers'),
    getBySlug: (slug: string) => request<Career>(`/careers/${slug}`),
    getMatches: () => request<CareerMatch[]>('/careers-matches'),
  },

  roadmap: {
    get: () => request<Roadmap | null>('/roadmap'),
    updateTask: (taskId: string, status: 'not_started' | 'in_progress' | 'completed') =>
      request<Roadmap>(`/roadmap/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    regenerate: () =>
      request<Roadmap>('/roadmap/regenerate', {
        method: 'POST',
      }),
  },

  projects: {
    getRecommended: () => request<Project[]>('/projects/recommended'),
  },

  courses: {
    getRecommended: (category?: string) =>
      request<CourseResource[]>(`/courses/recommended${category ? `?category=${category}` : ''}`),
  },

  progress: {
    get: () => request<UserProgressData>('/progress'),
  },

  ai: {
    getRecommendation: () =>
      request<{
        title: string;
        message: string;
        targetSkill: string;
        suggestedTask: string;
        estimatedMinutes: number;
      }>('/ai/recommendation'),
    chatCoach: (message: string, chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>) =>
      request<{ reply: string; quickPrompts: string[] }>('/ai/coach', {
        method: 'POST',
        body: JSON.stringify({ message, chatHistory }),
      }),
  },

};
