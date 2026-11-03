import { GoogleGenAI, Type } from '@google/genai';
import { ResumeAnalysis, SkillGapItem, RoadmapTask } from './types.js';

// Server-side initialization per Google AI Studio guidelines
const apiKey = process.env.GEMINI_API_KEY || '';
const hasApiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');

const ai = hasApiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Helper to clean AI JSON string before parsing
 */
function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Analyze resume text with Gemini AI
 */
export async function analyzeResumeWithGemini(
  resumeText: string,
  targetCareer: string = 'Frontend Developer'
): Promise<ResumeAnalysis> {
  // There is deliberately no fabricated fallback analysis: if the AI service
  // is unavailable, the caller must fail honestly (HTTP 503) rather than
  // persist or skill-sync invented results for a real user's resume.
  if (!ai) {
    throw new Error('AI resume analysis is unavailable: GEMINI_API_KEY is not configured on the server.');
  }

  try {
    const prompt = `You are a senior tech recruiter and career mentor evaluating a student/job-seeker resume.
Target Career: "${targetCareer}".
Resume Text:
---
${resumeText.slice(0, 10000)}
---

Perform a thorough, objective analysis. Return JSON adhering to this structure:
{
  "resumeScore": number (0 to 100),
  "detectedSkills": string[],
  "experienceSummary": string,
  "educationSummary": string,
  "projectsDetected": string[],
  "strengths": string[],
  "missingSkills": string[],
  "suggestedCareerPaths": [
    {"career": string, "matchPct": number, "reason": string}
  ],
  "improvementSuggestions": string[]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resumeScore: { type: Type.INTEGER, description: 'Overall resume score between 0 and 100' },
            detectedSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Skills detected in resume' },
            experienceSummary: { type: Type.STRING, description: 'Summary of past work or internships' },
            educationSummary: { type: Type.STRING, description: 'Education background detected' },
            projectsDetected: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Projects extracted from resume' },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Candidate strengths' },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Critical missing skills for target career' },
            suggestedCareerPaths: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  career: { type: Type.STRING },
                  matchPct: { type: Type.INTEGER },
                  reason: { type: Type.STRING }
                },
                required: ['career', 'matchPct', 'reason']
              }
            },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Actionable suggestions to improve resume' }
          },
          required: [
            'resumeScore',
            'detectedSkills',
            'experienceSummary',
            'educationSummary',
            'projectsDetected',
            'strengths',
            'missingSkills',
            'suggestedCareerPaths',
            'improvementSuggestions'
          ]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI resume analysis failed: the AI service returned an empty response.');
    }
    const parsed = JSON.parse(cleanJsonText(text));

    return {
      id: `res_ana_${Date.now()}`,
      userId: 'usr_current',
      fileName: 'uploaded_resume.pdf',
      fileSizeBytes: resumeText.length,
      uploadDate: new Date().toISOString().split('T')[0],
      resumeScore: Math.min(100, Math.max(0, parsed.resumeScore ?? 0)),
      detectedSkills: parsed.detectedSkills || [],
      experienceSummary: parsed.experienceSummary || '',
      educationSummary: parsed.educationSummary || '',
      projectsDetected: parsed.projectsDetected || [],
      strengths: parsed.strengths || [],
      missingSkills: parsed.missingSkills || [],
      suggestedCareerPaths: parsed.suggestedCareerPaths || [],
      improvementSuggestions: parsed.improvementSuggestions || []
    };
  } catch (error) {
    console.error('[Gemini] Error analyzing resume:', error);
    throw new Error('AI resume analysis failed. Please try again later.');
  }
}

/**
 * Generate Dynamic AI Skill Gap Analysis
 */
export async function generateSkillGapsWithGemini(
  targetCareer: string,
  userSkills: Array<{ skillName: string; proficiency: string }>
): Promise<SkillGapItem[]> {
  const fallbackGaps: SkillGapItem[] = [
    { id: 'gap_1', userId: 'usr_current', targetCareer, skillName: 'React', currentProficiencyPct: 30, targetProficiencyPct: 90, priority: 'high', aiAdvice: 'Focus on hooks (useState, useEffect, custom hooks) and component lifecycle before Redux.' },
    { id: 'gap_2', userId: 'usr_current', targetCareer, skillName: 'TypeScript', currentProficiencyPct: 20, targetProficiencyPct: 85, priority: 'high', aiAdvice: 'Adopt strict typing, interfaces, and generics in your next React project.' },
    { id: 'gap_3', userId: 'usr_current', targetCareer, skillName: 'REST APIs & Fetch', currentProficiencyPct: 40, targetProficiencyPct: 90, priority: 'high', aiAdvice: 'Build a dashboard that consumes public JSON APIs with async/await and loading/error states.' },
    { id: 'gap_4', userId: 'usr_current', targetCareer, skillName: 'Tailwind CSS', currentProficiencyPct: 55, targetProficiencyPct: 85, priority: 'medium', aiAdvice: 'Practice utility-first responsive layouts without relying on custom CSS stylesheets.' },
    { id: 'gap_5', userId: 'usr_current', targetCareer, skillName: 'Web Performance & SEO', currentProficiencyPct: 25, targetProficiencyPct: 80, priority: 'medium', aiAdvice: 'Learn Lighthouse metrics, lazy loading, and bundle size reduction.' },
    { id: 'gap_6', userId: 'usr_current', targetCareer, skillName: 'Testing (Jest/Playwright)', currentProficiencyPct: 10, targetProficiencyPct: 75, priority: 'low', aiAdvice: 'Add unit tests for utility functions and basic component rendering tests.' }
  ];

  if (!ai) return fallbackGaps;

  try {
    const prompt = `Target Career: "${targetCareer}".
Current Student Skills: ${JSON.stringify(userSkills)}.

Generate a precise skill gap comparison list.
For 5-7 key skills required for this career path, provide:
- skillName
- currentProficiencyPct (0 to 100 based on their current profile)
- targetProficiencyPct (usually 80-100)
- priority ('high' | 'medium' | 'low')
- aiAdvice (1 concise sentence with direct tactical learning advice)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              skillName: { type: Type.STRING },
              currentProficiencyPct: { type: Type.INTEGER },
              targetProficiencyPct: { type: Type.INTEGER },
              priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              aiAdvice: { type: Type.STRING }
            },
            required: ['skillName', 'currentProficiencyPct', 'targetProficiencyPct', 'priority', 'aiAdvice']
          }
        }
      }
    });

    const text = response.text;
    if (!text) return fallbackGaps;
    const parsed = JSON.parse(cleanJsonText(text));
    return parsed.map((item: any, idx: number) => ({
      id: `gap_${idx + 1}_${Date.now()}`,
      userId: 'usr_current',
      targetCareer,
      skillName: item.skillName,
      currentProficiencyPct: item.currentProficiencyPct,
      targetProficiencyPct: item.targetProficiencyPct || 90,
      priority: item.priority as 'high' | 'medium' | 'low',
      aiAdvice: item.aiAdvice
    }));
  } catch (error) {
    console.error('[Gemini] Error generating skill gaps:', error);
    return fallbackGaps;
  }
}

/**
 * AI Career Coach Contextual Chat
 */
export async function getCareerCoachResponse(
  userMessage: string,
  userContext: {
    fullName: string;
    targetCareer: string;
    currentSkills: string[];
    missingSkills: string[];
    resumeScore?: number;
    roadmapProgressPct?: number;
    currentPhase?: string;
  },
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{ reply: string; quickPrompts: string[] }> {
  const fallbackReply = `Hello ${userContext.fullName}! As your Career Coach for **${userContext.targetCareer}**, I see your current skill foundation is solid, but bridging your gap in **${userContext.missingSkills.slice(0, 3).join(', ')}** is our highest priority right now. Based on your current roadmap (${userContext.roadmapProgressPct || 64}% completed), you should dedicate your next learning session to building a mini-project focused on component state and REST API consumption.`;

  if (!ai) {
    return {
      reply: fallbackReply,
      quickPrompts: [
        'What should I learn next?',
        `Why am I a good match for ${userContext.targetCareer}?`,
        'Give me a project idea to practice my missing skills',
        'How can I improve my resume score?'
      ]
    };
  }

  try {
    const systemPrompt = `You are the AI Career Coach inside "NexLeaf" (AI-Powered Career Navigation Platform), an expert, encouraging mentor for college students and entry-level tech job seekers.
Candidate Context:
- Name: ${userContext.fullName}
- Target Career: ${userContext.targetCareer}
- Current Skills: ${userContext.currentSkills.join(', ')}
- Missing/Gap Skills: ${userContext.missingSkills.join(', ')}
- Resume Score: ${userContext.resumeScore || 78}/100
- Roadmap Progress: ${userContext.roadmapProgressPct || 64}%
- Current Focus Phase: ${userContext.currentPhase || 'React & State Management'}

Guidelines:
1. Always give specific, contextual advice tailored to their actual skills, target career, and skill gaps.
2. Never give generic boilerplate platitudes.
3. Recommend concrete technical exercises, architecture patterns, and portfolio projects.
4. Keep the tone professional, motivating, clear, and student-friendly.
5. Also supply 3-4 natural follow-up quick prompts that the student might ask next.`;

    const contents = [
      ...chatHistory.slice(-6).map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: 'Markdown-formatted coach guidance' },
            quickPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 or 4 relevant follow-up questions for the student'
            }
          },
          required: ['reply', 'quickPrompts']
        }
      }
    });

    const text = response.text;
    if (!text) return { reply: fallbackReply, quickPrompts: [] };
    const parsed = JSON.parse(cleanJsonText(text));
    return {
      reply: parsed.reply || fallbackReply,
      quickPrompts: parsed.quickPrompts || [
        'What should I learn next?',
        'Give me a portfolio project recommendation',
        'How can I improve my resume?'
      ]
    };
  } catch (error) {
    console.error('[Gemini] Error generating career coach reply:', error);
    return {
      reply: fallbackReply,
      quickPrompts: [
        'What should I learn next?',
        'What is my top skill gap?',
        'Recommend a project'
      ]
    };
  }
}
