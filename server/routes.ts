import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { analyzeResumeWithGemini, generateSkillGapsWithGemini, getCareerCoachResponse } from './gemini.js';
import { CareerMatch, Roadmap, RoadmapTask, UserProgressData, UserSkill } from './types.js';
import { pool } from './mysql.js';  

const router = express.Router();

// Wraps an async route handler so a rejected promise is forwarded to the
// central error middleware instead of crashing the process with an
// unhandled rejection (Express 4 does not catch async errors itself).
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (process.env.JWT_SECRET === 'MY_JWT_SECRET') {
  throw new Error('JWT_SECRET is still set to the placeholder value from .env.example; set a real secret');
}
const JWT_SECRET: string = process.env.JWT_SECRET;

// Auth middleware: extracts the user from the Bearer token
async function authenticateHandler(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await db.getUserById(decoded.userId);
      if (user) {
        (req as any).user = user;
        return next();
      }
    } catch {
      // Invalid token, fall through to demo user
    }
  }

 return res.status(401).json({ error: 'Authentication required' });
}

export const authenticate = asyncHandler(authenticateHandler);

// ------------------------------------------------------------------
// AUTH ROUTES
// ------------------------------------------------------------------
router.post('/auth/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName, education, currentRole, targetCareer, skills, learningAvailability } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  const existing = await db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const userId = `usr_${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 8);

const newUser = await db.createUser({
    id: userId,
    email,
    passwordHash,
    fullName,
    education: education || 'BCA (Bachelor of Computer Applications)',
    currentRole: currentRole || 'Student',
    createdAt: new Date().toISOString()
  });

  const chosenTargetCareer = targetCareer || 'Frontend Developer';

  await db.saveProfile({
    id: `prof_${userId}`,
    userId,
    bio: `Aspiring ${chosenTargetCareer} focused on modern technologies and industry best practices.`,
    targetCareer: chosenTargetCareer,
    experienceLevel: 'beginner',
    learningHoursPerDay: learningAvailability || '2-4 hours/day',
    learningStreakDays: 1,
    lastActiveDate: new Date().toISOString().split('T')[0]
  });

  // Add initial skills if provided
  if (Array.isArray(skills)) {
    for (const skillName of skills) {
      await db.addUserSkill(userId, {
        skillName,
        proficiency: 'intermediate',
        source: 'manual',
        verified: false
      });
    }
  }

  // Create initial roadmap for the user
  const initialRoadmap: Roadmap = {
    id: `rdm_${userId}`,
    userId,
    careerTitle: chosenTargetCareer,
    totalPhases: 5,
    currentPhase: 1,
    overallProgressPct: 15,
    tasks: [
      {
        id: `tsk_${Date.now()}_1`,
        roadmapId: `rdm_${userId}`,
        phaseNumber: 1,
        phaseName: 'Phase 1: Foundations & Core Architecture',
        title: `Master Fundamental Technologies for ${chosenTargetCareer}`,
        description: 'Understand the underlying computer science and technology prerequisites.',
        skillFocus: 'Fundamentals',
        estimatedHours: 15,
        difficulty: 'Beginner',
        resources: [{ title: 'MDN Web Developer Guide', url: 'https://developer.mozilla.org', type: 'Documentation' }],
        status: 'in_progress'
      },
      {
        id: `tsk_${Date.now()}_2`,
        roadmapId: `rdm_${userId}`,
        phaseNumber: 2,
        phaseName: 'Phase 2: Modern Frameworks & Practical Tooling',
        title: `Build Hands-On Projects with Industry Tools`,
        description: 'Implement modern application architecture patterns with component frameworks.',
        skillFocus: 'Frameworks',
        estimatedHours: 25,
        difficulty: 'Intermediate',
        resources: [{ title: 'Official Framework Tutorials', url: 'https://react.dev', type: 'Tutorial' }],
        status: 'not_started'
      }
    ]
  };
  await db.saveRoadmap(initialRoadmap);

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash: _, ...safeUser } = newUser;

  res.status(201).json({
    token,
    user: safeUser,
    profile: await db.getProfile(userId)
  });
}));

router.post('/auth/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

 const user = await db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash: _, ...safeUser } = user;

  res.json({
    token,
    user: safeUser,
    profile: await db.getProfile(user.id)
  });
}));

router.get('/auth/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { passwordHash: _, ...safeUser } = user;
  res.json({
    user: safeUser,
    profile: await db.getProfile(user.id)
  });
}));

// Recomputes the user's progress and stores today's snapshot. Best-effort:
// a snapshot failure is logged but must not fail the request that
// triggered it.
async function snapshotUserProgress(userId: string, precomputed?: UserProgressData): Promise<void> {
  try {
    const progress = precomputed ?? (await db.getUserProgress(userId));
    await db.saveUserProgress(userId, progress);
  } catch (error) {
    console.error('[NexLeaf API] Failed to save progress snapshot:', error);
  }
}

// ------------------------------------------------------------------
// PROFILE ROUTES
// ------------------------------------------------------------------
router.get('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = await db.getProfile(user.id);
 const skills = await db.getUserSkills(user.id);

  // Never send the password hash to the client
  const { passwordHash: _, ...safeUser } = user;

  res.json({ user: safeUser, profile, skills });
}));

router.put('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { fullName, education, currentRole, bio, targetCareer, experienceLevel, learningHoursPerDay, githubUrl, linkedinUrl, portfolioUrl } = req.body;

  if (fullName || education || currentRole) {
    await db.updateUser(user.id, {
      ...(fullName && { fullName }),
      ...(education && { education }),
      ...(currentRole && { currentRole })
    });
  }

const existingProfile = await db.getProfile(user.id);
  const updatedProfile = await db.saveProfile({
    id: existingProfile?.id || `prof_${user.id}`,
    userId: user.id,
    bio: bio !== undefined ? bio : existingProfile?.bio || '',
    targetCareer: targetCareer || existingProfile?.targetCareer || 'Frontend Developer',
    experienceLevel: experienceLevel || existingProfile?.experienceLevel || 'intermediate',
    learningHoursPerDay: learningHoursPerDay || existingProfile?.learningHoursPerDay || '2-4 hours/day',
    learningStreakDays: existingProfile?.learningStreakDays || 7,
    lastActiveDate: new Date().toISOString().split('T')[0],
    githubUrl: githubUrl !== undefined ? githubUrl : existingProfile?.githubUrl,
    linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : existingProfile?.linkedinUrl,
    portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : existingProfile?.portfolioUrl
  });

const updatedUser = await db.getUserById(user.id);
  const { passwordHash: _, ...safeUser } = updatedUser!;

  res.json({ user: safeUser, profile: updatedProfile });
}));

// ------------------------------------------------------------------
// SKILLS ROUTES
// ------------------------------------------------------------------
router.get('/skills', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const skills = await db.getUserSkills(user.id);
  res.json(skills);
}));

router.post('/skills', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { skillName, proficiency, source } = req.body;

  if (!skillName) {
    return res.status(400).json({ error: 'skillName is required' });
  }

  // Validate against the user_skills ENUMs: an unvalidated value makes the
  // INSERT fail at the database instead of producing a clean 400 here.
  const validProficiencies = ['beginner', 'intermediate', 'advanced'];
  const validSources = ['manual', 'resume_detected', 'assessment'];

  if (proficiency !== undefined && !validProficiencies.includes(proficiency)) {
    return res.status(400).json({ error: `proficiency must be one of: ${validProficiencies.join(', ')}` });
  }
  if (source !== undefined && !validSources.includes(source)) {
    return res.status(400).json({ error: `source must be one of: ${validSources.join(', ')}` });
  }

  const newSkill = await db.addUserSkill(user.id, {
    skillName,
    proficiency: proficiency || 'intermediate',
    source: source || 'manual',
    verified: false
  });

  res.status(201).json(newSkill);
}));

router.delete('/skills/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
 const success = await db.removeUserSkill(user.id, req.params.id);
  if (success) {
    res.json({ success: true, message: 'Skill removed' });
  } else {
    res.status(404).json({ error: 'Skill not found' });
  }
}));

// ------------------------------------------------------------------
// RESUME ROUTES
// ------------------------------------------------------------------
router.get('/resume/analysis', authenticate,async  (req: Request, res: Response) => {
  const user = (req as any).user;
  const analysis = await db.getResumeAnalysis(user.id);
  res.json(analysis || null);
});

router.post('/resume/analyze', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = await db.getProfile(user.id);
  const { resumeText, fileName } = req.body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 10) {
    return res.status(400).json({ error: 'Valid resume text content is required for analysis.' });
  }

  try {
    const analysis = await analyzeResumeWithGemini(resumeText, profile?.targetCareer || 'Frontend Developer');
    analysis.userId = user.id;
    if (fileName) analysis.fileName = fileName;

    await db.saveResumeAnalysis(analysis, resumeText);
    // Auto-sync detected skills into user skills
    for (const skillName of analysis.detectedSkills) {
      await db.addUserSkill(user.id, {
        skillName,
        proficiency: 'intermediate',
        source: 'resume_detected',
        verified: true
      });
    }

    res.json(analysis);
  } catch (error: any) {
    // The analyzer throws when the AI service is missing/failing instead of
    // returning a fabricated analysis, so surface that honestly as 503 and
    // persist nothing.
    res.status(503).json({ error: error.message || 'AI resume analysis is unavailable' });
  }
}));

// ------------------------------------------------------------------
// CAREER ASSESSMENT ROUTES
// ------------------------------------------------------------------
router.get('/assessment/questions', (req: Request, res: Response) => {
  res.json(db.getAssessmentQuestions());
});

router.get('/assessment/result', authenticate,async  (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await db.getAssessmentResult(user.id);
  res.json(result || null);
});

router.post('/assessment/submit', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { answers } = req.body; // map of questionId -> points object

  let frontendScore = 70;
  let backendScore = 60;
  let fullstackScore = 65;
  let dataScore = 50;
  let securityScore = 45;
  let cloudScore = 40;
  let uiuxScore = 65;

  if (answers && typeof answers === 'object') {
    Object.values(answers).forEach((pts: any) => {
      if (typeof pts === 'object') {
        if (pts.frontend) frontendScore += pts.frontend * 4;
        if (pts.backend) backendScore += pts.backend * 4;
        if (pts.fullstack) fullstackScore += pts.fullstack * 4;
        if (pts.data_analyst || pts.data_scientist) dataScore += (pts.data_analyst || pts.data_scientist) * 4;
        if (pts.cybersecurity) securityScore += pts.cybersecurity * 4;
        if (pts.cloud || pts.devops) cloudScore += (pts.cloud || pts.devops) * 4;
        if (pts.uiux) uiuxScore += pts.uiux * 4;
      }
    });
  }

  // Normalize scores to max 100
  frontendScore = Math.min(96, Math.max(40, frontendScore));
  backendScore = Math.min(94, Math.max(35, backendScore));
  fullstackScore = Math.min(95, Math.max(38, fullstackScore));
  dataScore = Math.min(92, Math.max(30, dataScore));
  securityScore = Math.min(90, Math.max(25, securityScore));
  cloudScore = Math.min(90, Math.max(30, cloudScore));
  uiuxScore = Math.min(95, Math.max(40, uiuxScore));

  // The top track and fit score must consider every scored domain — using
  // only frontend vs backend mislabels users whose strength is elsewhere.
  const domainScores: Array<{ track: string; score: number }> = [
    { track: 'Frontend Developer', score: frontendScore },
    { track: 'Backend Developer', score: backendScore },
    { track: 'Full Stack Developer', score: fullstackScore },
    { track: 'Data Analyst', score: dataScore },
    { track: 'Cybersecurity Analyst', score: securityScore },
    { track: 'Cloud Engineer', score: cloudScore },
    { track: 'UI/UX Designer', score: uiuxScore }
  ];
  const topDomain = domainScores.reduce((best, cur) => (cur.score > best.score ? cur : best));
  const topCareerTrack = topDomain.track;

  const assessmentResult = {
    id: `asm_${Date.now()}`,
    userId: user.id,
    completedAt: new Date().toISOString(),
    fitScore: topDomain.score,
    topCareerTrack,
    radarScores: [
      { domain: 'Frontend Development', score: frontendScore },
      { domain: 'Backend & APIs', score: backendScore },
      { domain: 'UI/UX & Aesthetics', score: uiuxScore },
      { domain: 'Data & Analytics', score: dataScore },
      { domain: 'Security', score: securityScore },
      { domain: 'Cloud & Infrastructure', score: cloudScore }
    ],
    aiSummary: `Your assessment highlights your strongest fit as ${topCareerTrack} (${topDomain.score}% fit), based on how your answers scored across all seven domains. Pairing this strength with clean API integration will maximize your placement advantages.`,
    nextSteps: [
      'Focus on modern React functional state, hooks, and clean TypeScript types.',
      'Complete 2 full-scale portfolio projects demonstrating REST API integration.',
      'Practice technical interview problems focusing on DOM events and async JavaScript.'
    ]
  };
  await db.saveAssessmentResult(assessmentResult);
  if (answers && typeof answers === 'object') {
  for (const [questionId, points] of Object.entries(answers)) {
    if (points && typeof points === 'object') {
      const pointData = points as Record<string, unknown>;

      for (const [category, value] of Object.entries(pointData)) {
        await pool.query(
          `INSERT INTO assessment_answers
           (id, assessment_id, question_id, selected_value, category)
           VALUES (?, ?, ?, ?, ?)`,
          [
            `ans_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            assessmentResult.id,
            questionId,
            String(value),
            category
          ]
        );
      }
    }
  }
}



 
  res.json(assessmentResult);
}));

// ------------------------------------------------------------------
// CAREERS & MATCHES ROUTES
// ------------------------------------------------------------------
router.get('/careers', asyncHandler(async (req: Request, res: Response) => {
  const careers = await db.getCareers();
  res.json(careers);
}));
router.get('/careers/:slug', asyncHandler(async (req: Request, res: Response) => {
  const career = await db.getCareerBySlug(req.params.slug);
  if (!career) return res.status(404).json({ error: 'Career path not found' });
  res.json(career);
}));

router.get('/careers-matches', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  let matches = await db.getCareerMatches(user.id);

  if (matches.length === 0) {
    // Nothing stored yet: compute matches from the catalog and the user's
    // actual skills, persist them, and return the saved result.
    const [careers, skills] = await Promise.all([
      db.getCareers(),
      db.getUserSkills(user.id)
    ]);

    if (careers.length > 0) {
      const userSkillNames = new Set(skills.map((s) => s.skillName.toLowerCase()));

      const computed: CareerMatch[] = careers.map((career) => {
        const matchingSkills = career.requiredSkills.filter((skill) =>
          userSkillNames.has(skill.toLowerCase())
        );
        const missingSkills = career.requiredSkills.filter(
          (skill) => !userSkillNames.has(skill.toLowerCase())
        );
        const matchPercentage =
          career.requiredSkills.length > 0
            ? Math.round((matchingSkills.length / career.requiredSkills.length) * 100)
            : 0;

        return {
          id: randomUUID(),
          userId: user.id,
          careerTitle: career.title,
          slug: career.slug,
          matchPercentage,
          whyMatches:
            matchingSkills.length > 0
              ? `You already have ${matchingSkills.length} of the ${career.requiredSkills.length} required skills: ${matchingSkills.join(', ')}.`
              : `A fresh starting point: none of the ${career.requiredSkills.length} required skills are on your profile yet.`,
          currentMatchingSkills: matchingSkills,
          missingSkills,
          learningDifficulty: career.difficultyLevel,
          recommendedNextStep:
            missingSkills.length > 0
              ? `Start learning ${missingSkills[0]} to raise your match for ${career.title}.`
              : `Deepen your portfolio projects to showcase your ${career.title} skills.`
        };
      });

      computed.sort((a, b) => b.matchPercentage - a.matchPercentage);
      matches = await db.saveCareerMatches(user.id, computed);
    }
  }

  res.json(matches);
}));

// ------------------------------------------------------------------
// SKILL GAPS ROUTES
// ------------------------------------------------------------------
router.get('/skills/gaps', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = await db.getProfile(user.id);
  const targetCareer = profile?.targetCareer || 'Frontend Developer';
 const existingGaps = await db.getSkillGaps(user.id);
  if (existingGaps.length > 0) {
    return res.json(existingGaps);
  }

  // Generate on demand if empty
 const skills = await db.getUserSkills(user.id);
const gaps = await generateSkillGapsWithGemini(targetCareer, skills);
await db.saveSkillGaps(user.id, gaps);
res.json(gaps);
}));

router.post('/skills/gaps/refresh', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = await db.getProfile(user.id);
  const targetCareer = profile?.targetCareer || 'Frontend Developer';
  const skills = await db.getUserSkills(user.id);

  const gaps = await generateSkillGapsWithGemini(targetCareer, skills);
  await db.saveSkillGaps(user.id, gaps);
  res.json(gaps);
}));

// ------------------------------------------------------------------
// ROADMAP ROUTES
// ------------------------------------------------------------------
router.get('/roadmap', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const roadmap = await db.getRoadmap(user.id);
  res.json(roadmap || null);
}));

router.put('/roadmap/tasks/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { status } = req.body;

  if (!status || !['not_started', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid task status' });
  }

  const updatedRoadmap = await  db.updateRoadmapTask(user.id, req.params.id, {
    status,
    completedAt: status === 'completed' ? new Date().toISOString() : undefined
  });

  if (!updatedRoadmap) {
    return res.status(404).json({ error: 'Roadmap or task not found' });
  }

  // Task progress changed, so refresh today's progress snapshot too
  await snapshotUserProgress(user.id);

  res.json(updatedRoadmap);
}));

router.post('/roadmap/regenerate', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
const profile = await db.getProfile(user.id);
  const targetCareer = profile?.targetCareer || 'Frontend Developer';

  // Construct fresh dynamic roadmap for user
  const newRoadmap: Roadmap = {
    id: `rdm_${user.id}_${Date.now()}`,
    userId: user.id,
    careerTitle: targetCareer,
    totalPhases: 5,
    currentPhase: 1,
    overallProgressPct: 0,
    tasks: [
      {
        id: `tsk_${Date.now()}_1`,
        roadmapId: `rdm_${user.id}`,
        phaseNumber: 1,
        phaseName: 'Phase 1: Foundational Syntax & Algorithms',
        title: `Core Principles for ${targetCareer}`,
        description: 'Solidify your core computer science fundamentals and language mechanics.',
        skillFocus: 'Fundamentals',
        estimatedHours: 18,
        difficulty: 'Beginner',
        resources: [{ title: 'MDN Web Docs', url: 'https://developer.mozilla.org', type: 'Documentation' }],
        status: 'in_progress'
      },
      {
        id: `tsk_${Date.now()}_2`,
        roadmapId: `rdm_${user.id}`,
        phaseNumber: 2,
        phaseName: 'Phase 2: Modern Frameworks & Libraries',
        title: `Component Architecture & State Stores`,
        description: 'Build responsive components, handle life-cycle events, and manage local state.',
        skillFocus: 'Frameworks',
        estimatedHours: 24,
        difficulty: 'Intermediate',
        resources: [{ title: 'React Learn', url: 'https://react.dev/learn', type: 'Tutorial' }],
        status: 'not_started'
      },
      {
        id: `tsk_${Date.now()}_3`,
        roadmapId: `rdm_${user.id}`,
        phaseNumber: 3,
        phaseName: 'Phase 3: APIs, Networking & Asynchronous Data',
        title: 'REST Endpoints, Error Handling & Authentication',
        description: 'Connect clients to backend APIs with robust loading, debounce, and error handling.',
        skillFocus: 'APIs & Data',
        estimatedHours: 20,
        difficulty: 'Intermediate',
        resources: [{ title: 'freeCodeCamp REST APIs', url: 'https://freecodecamp.org', type: 'Guide' }],
        status: 'not_started'
      },
      {
        id: `tsk_${Date.now()}_4`,
        roadmapId: `rdm_${user.id}`,
        phaseNumber: 4,
        phaseName: 'Phase 4: Scalable Typing & Testing',
        title: 'TypeScript & Automated Unit Testing',
        description: 'Introduce static typing to minimize bugs, and write reliable component tests.',
        skillFocus: 'TypeScript & Testing',
        estimatedHours: 22,
        difficulty: 'Intermediate',
        resources: [{ title: 'TypeScript Official', url: 'https://typescriptlang.org', type: 'Documentation' }],
        status: 'not_started'
      },
      {
        id: `tsk_${Date.now()}_5`,
        roadmapId: `rdm_${user.id}`,
        phaseNumber: 5,
        phaseName: 'Phase 5: Production Capstone & Interview Portfolio',
        title: 'End-to-End Deployed Capstone Project',
        description: 'Deploy a full-stack portfolio capstone with CI/CD and interview-ready documentation.',
        skillFocus: 'Production & Deployment',
        estimatedHours: 30,
        difficulty: 'Advanced',
        resources: [{ title: 'Frontend Interview Handbook', url: 'https://frontendinterviewhandbook.com', type: 'Guide' }],
        status: 'not_started'
      }
    ]
  };

  const savedRoadmap = await db.saveRoadmap(newRoadmap);
  res.json(savedRoadmap);
}));

// ------------------------------------------------------------------
// PROJECTS & COURSES ROUTES
// ------------------------------------------------------------------
router.get('/projects/recommended', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
 const profile = await db.getProfile(user.id);
  const targetCategory = profile?.targetCareer || 'Frontend Developer';
 const projects = await db.getProjects(targetCategory);
  res.json(projects);
}));
router.get('/courses/recommended', asyncHandler(async (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const courses = await db.getCourses(category);
  res.json(courses);
}));

// ------------------------------------------------------------------
// PROGRESS ROUTES
// ------------------------------------------------------------------
router.get('/progress', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const progress = await db.getUserProgress(user.id);
  // Persist today's progress snapshot (this is where progress is computed)
  await snapshotUserProgress(user.id, progress);
  res.json(progress);
}));

// ------------------------------------------------------------------
// AI RECOMMENDATION & COACH ROUTES
// ------------------------------------------------------------------
router.get('/ai/recommendation', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
 const profile = await db.getProfile(user.id);
  const roadmap = await db.getRoadmap(user.id);
 const gaps = await db.getSkillGaps(user.id);
  const topGap = gaps.find((g) => g.priority === 'high') || gaps[0];
  const currentTask = roadmap?.tasks.find((t) => t.status === 'in_progress') || roadmap?.tasks[0];

  const recommendation = {
    title: 'Your Next High-Impact Priority',
    message: topGap
      ? `Based on your recent progress and target career (${profile?.targetCareer}), your highest priority is mastering **${topGap.skillName}**. ${topGap.aiAdvice}`
      : `Continue your current roadmap phase: "${currentTask?.title}". Dedicate 45 minutes to practicing component state.`,
    targetSkill: topGap?.skillName || 'React & Component State',
    suggestedTask: currentTask?.title || 'Build a component with state and effects',
    estimatedMinutes: 45
  };

  res.json(recommendation);
}));

router.post('/ai/coach', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = await db.getProfile(user.id);
  const skills = await db.getUserSkills(user.id);
  const gaps = await db.getSkillGaps(user.id);
  const resume = await db.getResumeAnalysis(user.id);
  const roadmap = await db.getRoadmap(user.id);
  const { message, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  const userContext = {
   fullName: user.fullName ?? 'User',
    targetCareer: profile?.targetCareer ?? 'No target career set',
    currentSkills: skills.map((s) => s.skillName),
    missingSkills: gaps.map((g) => g.skillName),
    resumeScore: resume?.resumeScore,
    roadmapProgressPct: roadmap?.overallProgressPct,
    currentPhase: roadmap?.tasks.find((t) => t.status === 'in_progress')?.title
  };

  const coachResponse = await getCareerCoachResponse(message, userContext, chatHistory || []);
  res.json(coachResponse);
}));

// ------------------------------------------------------------------
// DATABASE EXPORT FOR COLLEGE PROJECT SUBMISSION
// ------------------------------------------------------------------
router.get('/database/schema', authenticate, (req: Request, res: Response) => {
  return res.status(403).json({
    error: 'Database export is disabled.'
  });
});

// ------------------------------------------------------------------
// CENTRAL ERROR HANDLER
// ------------------------------------------------------------------
// Receives every error forwarded by asyncHandler (and any synchronous
// throw inside a handler) and always answers with a JSON 500 instead of
// letting the process die on an unhandled rejection.
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[NexLeaf API] Unhandled error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Internal server error' });
});

export default router;
