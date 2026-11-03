import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './mysql.js';
import {
  User,
  Profile,
  UserSkill,
  Career,
  CareerMatch,
  SkillGapItem,
  Roadmap,
  RoadmapTask,
  Project,
  CourseResource,
  ResumeAnalysis,
  AssessmentQuestion,
  AssessmentResult,
  UserProgressData
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../.data_store.json');

// Initial Careers Catalog (10 key tech careers)
const INITIAL_CAREERS: Career[] = [
  {
    id: 'car_frontend',
    slug: 'frontend-developer',
    title: 'Frontend Developer',
    category: 'Web Development',
    description: 'Specializes in creating responsive, accessible, and high-performance user interfaces for modern web applications using HTML, CSS, JavaScript, and frameworks like React.',
    averageSalary: '$75,000 - $115,000 / yr',
    growthOutlook: '+16% (Faster than average)',
    difficultyLevel: 'Moderate',
    requiredSkills: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'React', 'Git & GitHub', 'REST APIs', 'TypeScript', 'Tailwind CSS'],
    recommendedSkills: ['Next.js', 'State Management (Redux/Zustand)', 'Web Performance', 'Testing (Jest/Playwright)', 'UI/UX Basics'],
    typicalResponsibilities: [
      'Translate design wireframes and Figma specs into clean, responsive React code',
      'Optimize web pages for maximum performance, mobile responsiveness, and SEO',
      'Integrate with backend REST APIs and manage client-side state',
      'Collaborate with product managers and backend engineers in Agile sprints'
    ],
    toolsAndTechnologies: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Git', 'Chrome DevTools', 'Postman', 'Figma']
  },
  {
    id: 'car_backend',
    slug: 'backend-developer',
    title: 'Backend Developer',
    category: 'Software Engineering',
    description: 'Designs and builds server-side architectures, database schemas, authentication systems, and scalable APIs that power web and mobile clients.',
    averageSalary: '$82,000 - $125,000 / yr',
    growthOutlook: '+14% (High Demand)',
    difficultyLevel: 'Moderate',
    requiredSkills: ['Node.js', 'Express.js', 'SQL (MySQL/PostgreSQL)', 'REST APIs', 'Git', 'Authentication & JWT', 'Data Modeling'],
    recommendedSkills: ['Docker', 'Redis Caching', 'Microservices', 'GraphQL', 'System Design'],
    typicalResponsibilities: [
      'Develop robust RESTful and GraphQL API services',
      'Architect relational database schemas and optimize query indexes',
      'Implement secure user authentication and authorization logic',
      'Monitor server health, logging, and background task queues'
    ],
    toolsAndTechnologies: ['Node.js', 'Express', 'MySQL', 'PostgreSQL', 'Docker', 'Redis', 'Postman', 'Linux']
  },
  {
    id: 'car_fullstack',
    slug: 'full-stack-developer',
    title: 'Full Stack Developer',
    category: 'Software Engineering',
    description: 'Handles end-to-end web application development, bridging the gap between interactive user experiences and resilient server/database systems.',
    averageSalary: '$88,000 - $130,000 / yr',
    growthOutlook: '+18% (Very High Demand)',
    difficultyLevel: 'Challenging',
    requiredSkills: ['JavaScript / TypeScript', 'React', 'Node.js', 'SQL / NoSQL', 'REST APIs', 'Git', 'HTML/CSS', 'System Architecture'],
    recommendedSkills: ['Next.js', 'CI/CD Pipelines', 'Cloud Deployment (AWS/GCP)', 'Docker', 'Testing'],
    typicalResponsibilities: [
      'Lead full lifecycle feature development from UI components to database migrations',
      'Design cohesive API contracts between frontend and backend teams',
      'Manage CI/CD deployments and cloud hosting',
      'Debug cross-tier issues spanning browser network tabs to database locks'
    ],
    toolsAndTechnologies: ['React', 'Node.js', 'Express', 'MySQL', 'MongoDB', 'Docker', 'AWS', 'Git']
  },
  {
    id: 'car_data_analyst',
    slug: 'data-analyst',
    title: 'Data Analyst',
    category: 'Data & Analytics',
    description: 'Gathers, cleans, and analyzes complex business data to uncover actionable trends, creating intuitive dashboards that guide executive decision-making.',
    averageSalary: '$70,000 - $105,000 / yr',
    growthOutlook: '+23% (Much faster than average)',
    difficultyLevel: 'Moderate',
    requiredSkills: ['SQL', 'Python / R', 'Data Visualization (PowerBI / Tableau)', 'Excel / Sheets', 'Statistics & Probability'],
    recommendedSkills: ['Pandas / NumPy', 'Storytelling with Data', 'Business Intelligence', 'Data Wrangling'],
    typicalResponsibilities: [
      'Write complex SQL queries, joins, and window functions to query business data',
      'Build automated dashboards and metric reporting pipelines',
      'Conduct exploratory data analysis to identify churn and conversion patterns',
      'Present findings and strategy recommendations to stakeholders'
    ],
    toolsAndTechnologies: ['SQL', 'Python', 'Power BI', 'Tableau', 'Excel', 'Jupyter', 'PostgreSQL']
  },
  {
    id: 'car_data_scientist',
    slug: 'data-scientist',
    title: 'Data Scientist',
    category: 'Data & Analytics',
    description: 'Leverages statistical modeling, machine learning algorithms, and deep domain analysis to predict outcomes and automate complex data insights.',
    averageSalary: '$98,000 - $145,000 / yr',
    growthOutlook: '+28% (Explosive Growth)',
    difficultyLevel: 'Challenging',
    requiredSkills: ['Python', 'Machine Learning (Scikit-Learn)', 'Advanced Statistics', 'SQL', 'Data Preprocessing', 'Git'],
    recommendedSkills: ['Deep Learning (PyTorch)', 'Feature Engineering', 'Big Data (Spark)', 'Model Deployment'],
    typicalResponsibilities: [
      'Develop predictive machine learning models to solve business challenges',
      'Cleanse messy datasets and extract high-signal feature matrices',
      'Validate model efficacy with cross-validation and error analysis',
      'Package models into consumable REST endpoints for engineering teams'
    ],
    toolsAndTechnologies: ['Python', 'Scikit-Learn', 'PyTorch', 'Pandas', 'Jupyter', 'Docker', 'SQL']
  },
  {
    id: 'car_ai_ml',
    slug: 'ai-ml-engineer',
    title: 'AI/ML Engineer',
    category: 'Artificial Intelligence',
    description: 'Builds, fine-tunes, and deploys scalable artificial intelligence systems, large language models (LLMs), and machine learning pipelines into production environments.',
    averageSalary: '$110,000 - $165,000 / yr',
    growthOutlook: '+35% (Massive Demand)',
    difficultyLevel: 'Challenging',
    requiredSkills: ['Python', 'Deep Learning (PyTorch/TensorFlow)', 'LLMs & Prompt Engineering', 'RAG & Vector Databases', 'APIs & Microservices', 'Git'],
    recommendedSkills: ['MLOps (MLflow, Kubeflow)', 'Model Quantization', 'LangChain/LlamaIndex', 'GPU Optimization'],
    typicalResponsibilities: [
      'Implement Retrieval-Augmented Generation (RAG) pipelines over proprietary data',
      'Fine-tune open-weights models and orchestrate LLM API calls',
      'Deploy low-latency AI inference services on cloud infrastructure',
      'Benchmark and evaluate model accuracy and hallucination rates'
    ],
    toolsAndTechnologies: ['Python', 'PyTorch', 'Gemini API', 'ChromaDB/Pinecone', 'Docker', 'FastAPI', 'Hugging Face']
  },
  {
    id: 'car_cybersecurity',
    slug: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    category: 'Security & Infrastructure',
    description: 'Safeguards an organization’s applications, networks, and confidential data against malicious breaches, vulnerabilities, and digital intrusions.',
    averageSalary: '$85,000 - $128,000 / yr',
    growthOutlook: '+32% (Critical Need)',
    difficultyLevel: 'Challenging',
    requiredSkills: ['Computer Networks & TCP/IP', 'Linux Fundamentals', 'Security Principles (CIA Triad)', 'Vulnerability Assessment', 'Firewalls & SIEM'],
    recommendedSkills: ['Penetration Testing', 'Wireshark', 'Python Scripting', 'Incident Response', 'OWASP Top 10'],
    typicalResponsibilities: [
      'Monitor security information and event management (SIEM) consoles for anomalies',
      'Audit web application code against OWASP Top 10 vulnerabilities',
      'Perform regular port scanning, patch management, and vulnerability drills',
      'Formulate incident containment plans in the event of unauthorized access'
    ],
    toolsAndTechnologies: ['Wireshark', 'Linux', 'Metasploit', 'Nmap', 'Splunk', 'Burp Suite', 'Snort']
  },
  {
    id: 'car_uiux',
    slug: 'ui-ux-designer',
    title: 'UI/UX Designer',
    category: 'Product Design',
    description: 'Researches user behaviors and crafts intuitive user journeys, wireframes, visual design systems, and clickable prototypes for digital products.',
    averageSalary: '$72,000 - $110,000 / yr',
    growthOutlook: '+13% (Steady Demand)',
    difficultyLevel: 'Entry',
    requiredSkills: ['Figma', 'User Research & Personas', 'Wireframing & Prototyping', 'Design Systems & Typography', 'Usability Testing'],
    recommendedSkills: ['HTML/CSS basics', 'Micro-interactions', 'Accessibility (WCAG)', 'Information Architecture'],
    typicalResponsibilities: [
      'Conduct user interviews to identify usability friction and user pain points',
      'Design comprehensive Figma component libraries with auto-layout and variants',
      'Build interactive prototypes to validate workflows with customers',
      'Collaborate closely with developers to ensure pixel-perfect production fidelity'
    ],
    toolsAndTechnologies: ['Figma', 'FigJam', 'Miro', 'Adobe Creative Cloud', 'Maze', 'Notion']
  },
  {
    id: 'car_cloud',
    slug: 'cloud-engineer',
    title: 'Cloud Engineer',
    category: 'Cloud & Infrastructure',
    description: 'Architects, provisions, and maintains resilient cloud environments, serverless computing services, and distributed storage infrastructure.',
    averageSalary: '$95,000 - $140,000 / yr',
    growthOutlook: '+24% (Very High Demand)',
    difficultyLevel: 'Challenging',
    requiredSkills: ['Cloud Provider (AWS / GCP / Azure)', 'Linux Administration', 'Networking & VPCs', 'Terraform (IaC)', 'Docker'],
    recommendedSkills: ['Kubernetes', 'Serverless (Lambda/Cloud Functions)', 'Cost Optimization', 'CI/CD Pipelines'],
    typicalResponsibilities: [
      'Automate cloud infrastructure provisioning using declarative code (IaC)',
      'Design high-availability, multi-zone architectures with automatic failover',
      'Implement IAM role-based access control and security best practices',
      'Manage cloud cost budgets, autoscaling rules, and disaster recovery'
    ],
    toolsAndTechnologies: ['AWS', 'Google Cloud', 'Terraform', 'Docker', 'Linux', 'Bash', 'CloudWatch']
  },
  {
    id: 'car_devops',
    slug: 'devops-engineer',
    title: 'DevOps Engineer',
    category: 'Cloud & Infrastructure',
    description: 'Unifies software development and IT operations through automated build systems, continuous deployment pipelines, and proactive observability.',
    averageSalary: '$98,000 - $142,000 / yr',
    growthOutlook: '+22% (High Demand)',
    difficultyLevel: 'Challenging',
    requiredSkills: ['Docker & Containers', 'CI/CD (GitHub Actions / GitLab)', 'Linux & Bash Scripting', 'Git', 'Cloud Fundamentals', 'Kubernetes'],
    recommendedSkills: ['Prometheus & Grafana', 'Ansible', 'Security (DevSecOps)', 'Helm'],
    typicalResponsibilities: [
      'Maintain reliable CI/CD pipelines for automated testing, linting, and release packaging',
      'Orchestrate containerized microservices across Kubernetes clusters',
      'Set up proactive monitoring, alerting, and distributed tracing',
      'Partner with developer teams to reduce deployment lead time and downtime'
    ],
    toolsAndTechnologies: ['Docker', 'Kubernetes', 'GitHub Actions', 'Terraform', 'Prometheus', 'Grafana', 'Linux']
  }
];

// Initial Projects Catalog
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    title: 'Modern Responsive Developer Portfolio',
    careerCategory: 'Frontend Developer',
    difficulty: 'Beginner',
    estimatedHours: 12,
    skillsLearned: ['Semantic HTML', 'CSS Flexbox/Grid', 'Responsive Breakpoints', 'Clean Typography'],
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'GitHub Pages'],
    description: 'Build a personal developer portfolio featuring light/dark theme toggle, project showcase with live demo links, downloadable resume button, and working contact form.',
    deliverables: ['Custom domain or GitHub Pages deployment', 'Lighthouse mobile accessibility score >= 95', 'Interactive contact modal']
  },
  {
    id: 'proj_2',
    title: 'Real-Time Weather & Air Quality Dashboard',
    careerCategory: 'Frontend Developer',
    difficulty: 'Intermediate',
    estimatedHours: 18,
    skillsLearned: ['Asynchronous JavaScript', 'REST API Fetch', 'Debounced Search', 'Error & Loading States'],
    technologies: ['JavaScript ES6+', 'OpenWeather API', 'CSS Grid', 'Tailwind CSS'],
    description: 'Create an interactive weather dashboard that searches cities worldwide, displays 5-day forecasts, handles geolocation coordinates, and visualizes UV index and humidity.',
    deliverables: ['Responsive card layout for 5-day outlook', 'Search history stored in localStorage', 'Graceful network error states']
  },
  {
    id: 'proj_3',
    title: 'Full-Featured React Task & Project Manager',
    careerCategory: 'Frontend Developer',
    difficulty: 'Intermediate',
    estimatedHours: 25,
    skillsLearned: ['React Hooks (useState, useEffect, useMemo)', 'Component Architecture', 'Drag-and-Drop Kanban', 'Local Persistence'],
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Lucide Icons'],
    description: 'Develop a Kanban-style task board with columns for Todo, In Progress, and Completed. Support task priorities, due date filters, search, and drag-and-drop column reordering.',
    deliverables: ['Draggable task cards with priority badges', 'Full filter by category/tag', 'Persistent state in browser storage']
  },
  {
    id: 'proj_4',
    title: 'RESTful E-Commerce Product & Order API',
    careerCategory: 'Backend Developer',
    difficulty: 'Intermediate',
    estimatedHours: 30,
    skillsLearned: ['Express Route Handlers', 'Relational Schema Design', 'JWT Authentication', 'Input Validation & Hashing'],
    technologies: ['Node.js', 'Express', 'MySQL', 'JWT', 'Bcrypt'],
    description: 'Architect a robust REST API backend for an online storefront with customer registration, secure login, role-based admin endpoints, product inventory management, and cart checkout.',
    deliverables: ['Complete OpenAPI / Postman collection', 'Password hashing & Bearer token middleware', 'SQL migration script and relational joins']
  },
  {
    id: 'proj_5',
    title: 'AI Resume & Document Question Answering App',
    careerCategory: 'AI/ML Engineer',
    difficulty: 'Advanced',
    estimatedHours: 35,
    skillsLearned: ['Gemini API Integration', 'Document Parsing', 'Prompt Engineering', 'Structured JSON Output'],
    technologies: ['Node.js', 'Gemini 3.8 Flash', 'PDF Parsing', 'React'],
    description: 'Build an end-to-end full stack application that parses uploaded student resumes and runs AI-powered analysis to provide scores, skill detection, and instant interview question generation.',
    deliverables: ['Multi-page PDF upload handler', 'Streaming AI response UI', 'Downloadable structured PDF audit report']
  },
  {
    id: 'proj_6',
    title: 'Enterprise Vulnerability Scanner & Audit Tool',
    careerCategory: 'Cybersecurity Analyst',
    difficulty: 'Advanced',
    estimatedHours: 28,
    skillsLearned: ['Port Scanning Basics', 'Security Header Auditing', 'OWASP Top 10 Checks', 'Executive Reporting'],
    technologies: ['Python', 'Bash', 'Linux', 'Markdown Exporter'],
    description: 'Develop a security audit script that checks target web servers for missing HTTPS security headers (HSTS, CSP, X-Frame-Options), open test ports, and outdated SSL certificates.',
    deliverables: ['Automated command-line scan script', 'Formatted HTML/Markdown audit scorecard', 'Remediation guide for found warnings']
  }
];

// Initial Learning Courses Catalog
const INITIAL_COURSES: CourseResource[] = [
  {
    id: 'crs_1',
    title: 'MDN Web Docs: Modern JavaScript Handbook',
    category: 'frontend',
    skillName: 'JavaScript (ES6+)',
    difficulty: 'Intermediate',
    duration: '25 Hours',
    resourceType: 'Documentation',
    provider: 'Mozilla Developer Network',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    description: 'The definitive guide to JavaScript covering closures, asynchronous promises, async/await, array higher-order methods, and the DOM.'
  },
  {
    id: 'crs_2',
    title: 'Official React Documentation & Interactive Guides',
    category: 'frontend',
    skillName: 'React',
    difficulty: 'Intermediate',
    duration: '20 Hours',
    resourceType: 'Interactive Course',
    provider: 'React.dev',
    url: 'https://react.dev/learn',
    description: 'Learn modern React with pure functional components, hooks, state preservation, effects, and best practices.'
  },
  {
    id: 'crs_3',
    title: 'TypeScript for JavaScript Programmers',
    category: 'frontend',
    skillName: 'TypeScript',
    difficulty: 'Intermediate',
    duration: '15 Hours',
    resourceType: 'Documentation',
    provider: 'TypeScriptLang.org',
    url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html',
    description: 'Master static typing, interfaces, type aliases, union types, and generic functions for building bug-resistant web apps.'
  },
  {
    id: 'crs_4',
    title: 'RESTful API Design & Express.js In-Depth',
    category: 'backend',
    skillName: 'REST APIs',
    difficulty: 'Intermediate',
    duration: '18 Hours',
    resourceType: 'Interactive Course',
    provider: 'freeCodeCamp',
    url: 'https://www.freecodecamp.org/news/how-to-build-a-restful-api/',
    description: 'Understand HTTP methods, status codes, query parameters, controller structure, middleware error handlers, and security headers.'
  },
  {
    id: 'crs_5',
    title: 'MySQL Relational Database Design & SQL Querying',
    category: 'database',
    skillName: 'SQL',
    difficulty: 'Beginner',
    duration: '16 Hours',
    resourceType: 'Hands-on Lab',
    provider: 'W3Schools & MySQL Docs',
    url: 'https://www.w3schools.com/sql/',
    description: 'Covers table normalization (1NF-3NF), primary/foreign keys, inner/outer joins, aggregation, grouping, indexing, and subqueries.'
  },
  {
    id: 'crs_6',
    title: 'Tailwind CSS: From Zero to Production Mastery',
    category: 'frontend',
    skillName: 'Tailwind CSS',
    difficulty: 'Beginner',
    duration: '10 Hours',
    resourceType: 'Documentation',
    provider: 'Tailwind CSS Official',
    url: 'https://tailwindcss.com/docs',
    description: 'Learn utility-first styling, responsive prefixes, dark mode toggles, and custom design token configurations.'
  },
  {
    id: 'crs_7',
    title: 'Git & GitHub Hands-on Collaborative Workflow',
    category: 'tools',
    skillName: 'Git & GitHub',
    difficulty: 'Beginner',
    duration: '8 Hours',
    resourceType: 'Interactive Course',
    provider: 'GitHub Skills',
    url: 'https://skills.github.com/',
    description: 'Branching strategies, pull requests, merge conflict resolution, rebasing, and GitHub Actions CI basics.'
  },
  {
    id: 'crs_8',
    title: 'Google Generative AI SDK & Prompt Engineering Guide',
    category: 'ai_ml',
    skillName: 'Gemini API',
    difficulty: 'Intermediate',
    duration: '12 Hours',
    resourceType: 'Documentation',
    provider: 'Google AI Studio Docs',
    url: 'https://ai.google.dev/docs',
    description: 'Learn how to integrate Gemini models into web apps with structured JSON schemas, multimodal prompts, and chat sessions.'
  }
];

// Initial Assessment Questions (12 targeted questions)
const INITIAL_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1',
    category: 'coding',
    question: 'When building a web project, which part do you enjoy the most?',
    options: [
      { label: 'Designing interactive visual components, animations, and responsive layouts', points: { frontend: 4, uiux: 3, fullstack: 2 } },
      { label: 'Architecting database tables, API routes, and secure authentication logic', points: { backend: 4, fullstack: 3, cloud: 2 } },
      { label: 'Analyzing datasets, calculating metrics, and building charts or dashboards', points: { data_analyst: 4, data_scientist: 3 } },
      { label: 'Investigating vulnerabilities, firewalls, and securing systems against hacks', points: { cybersecurity: 4, devops: 2 } }
    ]
  },
  {
    id: 'q2',
    category: 'problem_solving',
    question: 'How do you approach a complex technical bug or puzzle?',
    options: [
      { label: 'Inspect the browser DOM and network tab to pinpoint visual state issues', points: { frontend: 3, fullstack: 2 } },
      { label: 'Trace SQL queries, server logs, and request headers systematically', points: { backend: 4, devops: 2 } },
      { label: 'Run statistical distributions and look for anomalous data patterns', points: { data_scientist: 4, data_analyst: 3 } },
      { label: 'Review access permissions, packet captures, and audit trails', points: { cybersecurity: 4 } }
    ]
  },
  {
    id: 'q3',
    category: 'creativity',
    question: 'How important is visual aesthetics and user empathy to you?',
    options: [
      { label: 'Extremely important: I love crafting clean layouts, colors, and micro-interactions', points: { uiux: 4, frontend: 4 } },
      { label: 'Somewhat important: As long as the interface is clear and communicates data well', points: { data_analyst: 3, fullstack: 2 } },
      { label: 'Low priority: I care far more about performance, reliability, and security', points: { backend: 4, cybersecurity: 3, cloud: 3 } },
      { label: 'Data accuracy and statistical validity matter most to me', points: { data_scientist: 4, ai_ml: 3 } }
    ]
  },
  {
    id: 'q4',
    category: 'data_interest',
    question: 'What is your level of interest in working with Big Data and Machine Learning models?',
    options: [
      { label: 'High: I want to train, evaluate, and deploy AI models or LLM apps', points: { ai_ml: 4, data_scientist: 4 } },
      { label: 'Moderate: I like querying data and building executive visual reports', points: { data_analyst: 4 } },
      { label: 'I prefer using AI via APIs to enhance real-world web apps', points: { fullstack: 3, frontend: 3 } },
      { label: 'I prefer systems, servers, networks, and low-level code', points: { devops: 3, cybersecurity: 3 } }
    ]
  },
  {
    id: 'q5',
    category: 'cloud_infra',
    question: 'How do you feel about servers, containers, and deployment automation?',
    options: [
      { label: 'Fascinated: I want to master Docker, Kubernetes, CI/CD, and AWS infrastructure', points: { cloud: 4, devops: 4 } },
      { label: 'I know how to deploy my Node/Express apps, but prefer coding features', points: { backend: 3, fullstack: 3 } },
      { label: 'I like automated Vercel/Netlify deployments and focus on frontend code', points: { frontend: 4 } },
      { label: 'I focus on hardening server configurations and preventing breach vectors', points: { cybersecurity: 4, cloud: 2 } }
    ]
  },
  {
    id: 'q6',
    category: 'security',
    question: 'When writing software, how often do you think about security and vulnerabilities?',
    options: [
      { label: 'Always: I actively study SQL injection, XSS, CSRF, and pen-testing tools', points: { cybersecurity: 5 } },
      { label: 'Regularly: I ensure passwords are hashed and endpoints have auth middleware', points: { backend: 3, fullstack: 3 } },
      { label: 'Occasionally: I validate form inputs and sanitize user HTML', points: { frontend: 2 } },
      { label: 'My main focus is algorithmic accuracy and clean business logic', points: { data_scientist: 3, data_analyst: 2 } }
    ]
  },
  {
    id: 'q7',
    category: 'work_preferences',
    question: 'What kind of impact gives you the biggest sense of accomplishment?',
    options: [
      { label: 'Seeing users interact with a fast, gorgeous, intuitive product I built', points: { frontend: 4, uiux: 4 } },
      { label: 'Knowing that a system handled 100,000 transactions with zero downtime', points: { backend: 4, cloud: 3 } },
      { label: 'Discovering a hidden business pattern that saves the company money', points: { data_analyst: 4, data_scientist: 3 } },
      { label: 'Stopping a simulated cyber intrusion and securing user privacy', points: { cybersecurity: 4 } }
    ]
  },
  {
    id: 'q8',
    category: 'learning_style',
    question: 'How do you prefer to spend your learning hours?',
    options: [
      { label: 'Building mini web apps and testing UI component libraries', points: { frontend: 3, fullstack: 3 } },
      { label: 'Designing SQL relational schemas, database indexes, and APIs', points: { backend: 4 } },
      { label: 'Writing Python scripts to scrape data and experiment with Jupyter notebooks', points: { data_analyst: 3, data_scientist: 4 } },
      { label: 'Configuring Linux VMs, network firewalls, and bash automation scripts', points: { devops: 4, cybersecurity: 3 } }
    ]
  }
];

class DatabaseRepository {
  private users: Map<string, User> = new Map();
  private profiles: Map<string, Profile> = new Map();
  private userSkills: Map<string, UserSkill[]> = new Map();
  private careers: Map<string, Career> = new Map();
  private careerMatches: Map<string, CareerMatch[]> = new Map();
  private skillGaps: Map<string, SkillGapItem[]> = new Map();
  private roadmaps: Map<string, Roadmap> = new Map();
  private projects: Project[] = [];
  private courses: CourseResource[] = [];
  private resumes: Map<string, ResumeAnalysis> = new Map();
  private assessments: Map<string, AssessmentResult> = new Map();
  private userProgress: Map<string, UserProgressData> = new Map();

  constructor() {
}

  // User methods
  async getUserById(id: string): Promise<User | undefined> {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );

  const users = rows as any[];

  if (users.length === 0) {
    return undefined;
  }

  const user = users[0];

  return {
    id: user.id,
    email: user.email,
    passwordHash: user.password_hash,
    fullName: user.full_name,
    education: user.education,
    currentRole: user.current_role,
    createdAt: user.created_at
  };
}
  async getUserByEmail(email: string): Promise<User | undefined> {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
    [email]
  );

  const users = rows as any[];

  if (users.length === 0) {
    return undefined;
  }

  const user = users[0];

  return {
    id: user.id,
    email: user.email,
    passwordHash: user.password_hash,
    fullName: user.full_name,
    education: user.education,
    currentRole: user.current_role,
    createdAt: user.created_at
  };
}
  async createUser(user: User): Promise<User> {
  await pool.query(
    `INSERT INTO users
      (id, email, password_hash, full_name, education, current_role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.email,
      user.passwordHash,
      user.fullName,
      user.education,
      user.currentRole
    ]
  );

  return user;
}
async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
  const existing = await this.getUserById(id);

  if (!existing) {
    return undefined;
  }

  const updated = { ...existing, ...updates };

  await pool.query(
    `UPDATE users
     SET email = ?,
         password_hash = ?,
         full_name = ?,
         education = ?,
         current_role = ?
     WHERE id = ?`,
    [
      updated.email,
      updated.passwordHash,
      updated.fullName,
      updated.education,
      updated.currentRole,
      id
    ]
  );

  return updated;
}

  // Profile methods
async getProfile(userId: string): Promise<Profile | undefined> {
  const [rows] = await pool.query(
    'SELECT * FROM profiles WHERE user_id = ?',
    [userId]
  );

  const profiles = rows as any[];

  if (profiles.length === 0) {
    return undefined;
  }

  const profile = profiles[0];

  return {
    id: profile.id,
    userId: profile.user_id,
    bio: profile.bio,
    targetCareer: profile.target_career,
    experienceLevel: profile.experience_level,
    learningHoursPerDay: profile.learning_hours_per_day,
    learningStreakDays: profile.learning_streak_days,
    lastActiveDate: profile.last_active_date,
    githubUrl: profile.github_url,
    linkedinUrl: profile.linkedin_url,
    portfolioUrl: profile.portfolio_url
  };
}
  async saveProfile(profile: Profile): Promise<Profile> {
  const existing = await this.getProfile(profile.userId);

  if (existing) {
    await pool.query(
      `UPDATE profiles
       SET bio = ?,
           target_career = ?,
           experience_level = ?,
           learning_hours_per_day = ?,
           learning_streak_days = ?,
           last_active_date = ?,
           github_url = ?,
           linkedin_url = ?,
           portfolio_url = ?
       WHERE user_id = ?`,
      [
        profile.bio,
        profile.targetCareer,
        profile.experienceLevel,
        profile.learningHoursPerDay,
        profile.learningStreakDays,
        profile.lastActiveDate,
        profile.githubUrl ?? null,
        profile.linkedinUrl ?? null,
        profile.portfolioUrl ?? null,
        profile.userId
      ]
    );
  } else {
    await pool.query(
      `INSERT INTO profiles
       (id, user_id, bio, target_career, experience_level,
        learning_hours_per_day, learning_streak_days, last_active_date,
        github_url, linkedin_url, portfolio_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.userId,
        profile.bio,
        profile.targetCareer,
        profile.experienceLevel,
        profile.learningHoursPerDay,
        profile.learningStreakDays,
        profile.lastActiveDate,
        profile.githubUrl ?? null,
        profile.linkedinUrl ?? null,
        profile.portfolioUrl ?? null
      ]
    );
  }

  return profile;
}

  // Skills methods
 async getUserSkills(userId: string): Promise<UserSkill[]> {
  const [rows] = await pool.query(
    'SELECT * FROM user_skills WHERE user_id = ? ORDER BY created_at ASC',
    [userId]
  );

  const skills = rows as any[];

  return skills.map((skill) => ({
    id: skill.id,
    userId: skill.user_id,
    skillName: skill.skill_name,
    proficiency: skill.proficiency,
    source: skill.source,
    verified: Boolean(skill.verified)
  }));
}

   async addUserSkill(
  userId: string,
  skill: Omit<UserSkill, 'id' | 'userId'>
): Promise<UserSkill> {
  const [existingRows] = await pool.query(
    'SELECT * FROM user_skills WHERE user_id = ? AND LOWER(skill_name) = LOWER(?) LIMIT 1',
    [userId, skill.skillName]
  );

  const existingSkills = existingRows as any[];

  if (existingSkills.length > 0) {
    const existing = existingSkills[0];

    await pool.query(
      `UPDATE user_skills
       SET skill_name = ?,
           proficiency = ?,
           source = ?,
           verified = ?
       WHERE id = ?`,
      [
        skill.skillName,
        skill.proficiency,
        skill.source,
        skill.verified,
        existing.id
      ]
    );

    return {
      id: existing.id,
      userId: existing.user_id,
      skillName: skill.skillName,
      proficiency: skill.proficiency,
      source: skill.source,
      verified: Boolean(skill.verified)
    };
  }

  const newSkill: UserSkill = {
    id: `usk_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    ...skill
  };

  await pool.query(
    `INSERT INTO user_skills
     (id, user_id, skill_name, proficiency, source, verified)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      newSkill.id,
      newSkill.userId,
      newSkill.skillName,
      newSkill.proficiency,
      newSkill.source,
      newSkill.verified
    ]
  );

  return newSkill;
}
  async removeUserSkill(userId: string, skillId: string): Promise<boolean> {
  const [result] = await pool.query(
    'DELETE FROM user_skills WHERE id = ? AND user_id = ?',
    [skillId, userId]
  );

  const deleteResult = result as { affectedRows: number };

  return deleteResult.affectedRows > 0;
}

  // Careers methods
async getCareers(): Promise<Career[]> {
  const [rows] = await pool.query(`
    SELECT
      c.*,
      COALESCE(
        JSON_ARRAYAGG(
          CASE WHEN cs.is_required = TRUE THEN cs.skill_name END
        ),
        JSON_ARRAY()
      ) AS required_skills,
      COALESCE(
        JSON_ARRAYAGG(
          CASE WHEN cs.is_required = FALSE THEN cs.skill_name END
        ),
        JSON_ARRAY()
      ) AS recommended_skills
    FROM careers c
    LEFT JOIN career_skills cs ON c.id = cs.career_id
    GROUP BY c.id
    ORDER BY c.title ASC
  `);

  const careers = rows as any[];

  return careers.map((career) => ({
    id: career.id,
    slug: career.slug,
    title: career.title,
    category: career.category,
    description: career.description,
    averageSalary: career.average_salary,
    growthOutlook: career.growth_outlook,
    difficultyLevel: career.difficulty_level,
    // JSON_ARRAYAGG over the LEFT JOIN produces NULL entries for skills of
    // the opposite type (and a lone [null] when a career has no skills yet),
    // so strip anything that is not an actual skill name.
    requiredSkills: Array.isArray(career.required_skills)
      ? career.required_skills.filter((s: unknown): s is string => typeof s === 'string')
      : [],
    recommendedSkills: Array.isArray(career.recommended_skills)
      ? career.recommended_skills.filter((s: unknown): s is string => typeof s === 'string')
      : [],
    typicalResponsibilities: career.typical_responsibilities || [],
    toolsAndTechnologies: career.tools_and_technologies || []
  }));
}

async getCareerBySlug(slug: string): Promise<Career | undefined> {
  const careers = await this.getCareers();

  return careers.find(
    (career) => career.slug.toLowerCase() === slug.toLowerCase()
  );
}
  // Career Matches methods
async getCareerMatches(userId: string): Promise<CareerMatch[]> {
  const [rows] = await pool.query(
    `SELECT * FROM career_matches
     WHERE user_id = ?
     ORDER BY match_percentage DESC`,
    [userId]
  );

  const matches = rows as any[];

  return matches.map((match) => ({
    id: match.id,
    userId: match.user_id,
    careerTitle: match.career_title,
    slug: match.career_slug || '',
    matchPercentage: match.match_percentage,
    whyMatches: match.why_matches,
    currentMatchingSkills: match.matching_skills || [],
    missingSkills: match.missing_skills || [],
    learningDifficulty: match.learning_difficulty,
    recommendedNextStep: match.recommended_next_step
  }));
}

async saveCareerMatches(
  userId: string,
  matches: CareerMatch[]
): Promise<CareerMatch[]> {
  await pool.query(
    'DELETE FROM career_matches WHERE user_id = ?',
    [userId]
  );

  for (const match of matches) {
    await pool.query(
      `INSERT INTO career_matches
       (id, user_id, career_title, career_slug, match_percentage, why_matches,
        matching_skills, missing_skills, learning_difficulty,
        recommended_next_step)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        match.id,
        userId,
        match.careerTitle,
        match.slug,
        match.matchPercentage,
        match.whyMatches,
        JSON.stringify(match.currentMatchingSkills),
        JSON.stringify(match.missingSkills),
        match.learningDifficulty,
        match.recommendedNextStep
      ]
    );
  }

  return matches;
}
  // Skill Gaps methods
  async getSkillGaps(userId: string): Promise<SkillGapItem[]> {
  const [rows] = await pool.query(
    `SELECT * FROM skill_gaps
     WHERE user_id = ?
     ORDER BY
       CASE priority
         WHEN 'high' THEN 1
         WHEN 'medium' THEN 2
         WHEN 'low' THEN 3
       END,
       skill_name ASC`,
    [userId]
  );

  const gaps = rows as any[];

  return gaps.map((gap) => ({
    id: gap.id,
    userId: gap.user_id,
    targetCareer: gap.target_career,
    skillName: gap.skill_name,
    currentProficiencyPct: gap.current_proficiency_pct,
    targetProficiencyPct: gap.target_proficiency_pct,
    priority: gap.priority,
    aiAdvice: gap.ai_advice,
    updatedAt: gap.updated_at
  }));
}
async saveSkillGaps(
  userId: string,
  gaps: SkillGapItem[]
): Promise<SkillGapItem[]> {
  const connection = await pool.getConnection();

  // Generate unique IDs for every saved skill gap
  const uniqueGaps = gaps.map((gap) => ({
    ...gap,
    id: randomUUID()
  }));

  try {
    await connection.beginTransaction();

    await connection.query(
      'DELETE FROM skill_gaps WHERE user_id = ?',
      [userId]
    );

    for (const gap of uniqueGaps) {
      await connection.query(
        `INSERT INTO skill_gaps
         (id, user_id, target_career, skill_name,
          current_proficiency_pct, target_proficiency_pct,
          priority, ai_advice)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          gap.id,
          userId,
          gap.targetCareer,
          gap.skillName,
          gap.currentProficiencyPct,
          gap.targetProficiencyPct,
          gap.priority,
          gap.aiAdvice ?? null
        ]
      );
    }

    await connection.commit();
    return uniqueGaps;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


  // Roadmap methods
 async getRoadmap(userId: string): Promise<Roadmap | undefined> {
  const [roadmapRows] = await pool.query(
    'SELECT * FROM roadmaps WHERE user_id = ? LIMIT 1',
    [userId]
  );

  const roadmaps = roadmapRows as any[];
  if (roadmaps.length === 0) return undefined;

  const roadmap = roadmaps[0];

  const [taskRows] = await pool.query(
    'SELECT * FROM roadmap_tasks WHERE roadmap_id = ? ORDER BY phase_number ASC, id ASC',
    [roadmap.id]
  );

  const tasks = (taskRows as any[]).map((task) => ({
    id: task.id,
    roadmapId: task.roadmap_id,
    phaseNumber: task.phase_number,
    phaseName: task.phase_name,
    title: task.title,
    description: task.description,
    skillFocus: task.skill_focus,
    estimatedHours: task.estimated_hours,
    difficulty: task.difficulty,
    resources: task.learning_resources || [],
    recommendedProject: task.recommended_project,
    status: task.status,
    completedAt: task.completed_at
  }));

  return {
    id: roadmap.id,
    userId: roadmap.user_id,
    careerTitle: roadmap.career_title,
    totalPhases: roadmap.total_phases,
    currentPhase: roadmap.current_phase,
    overallProgressPct: roadmap.overall_progress_pct,
    tasks
  };
}
async saveRoadmap(roadmap: Roadmap): Promise<Roadmap> {
  // Check whether this user already has a roadmap
  const [existingRows] = await pool.query(
    `SELECT id FROM roadmaps
     WHERE user_id = ?
     LIMIT 1`,
    [roadmap.userId]
  );

  const existingRoadmaps = existingRows as any[];

  let roadmapId = roadmap.id;

  if (existingRoadmaps.length > 0) {
    // Use the existing database roadmap ID
    roadmapId = existingRoadmaps[0].id;

    await pool.query(
      `UPDATE roadmaps
       SET career_title = ?,
           total_phases = ?,
           current_phase = ?,
           overall_progress_pct = ?
       WHERE id = ?`,
      [
        roadmap.careerTitle,
        roadmap.totalPhases,
        roadmap.currentPhase,
        roadmap.overallProgressPct,
        roadmapId
      ]
    );
  } else {
    // Create the parent roadmap first
    await pool.query(
      `INSERT INTO roadmaps
       (id, user_id, career_title, total_phases,
        current_phase, overall_progress_pct)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        roadmapId,
        roadmap.userId,
        roadmap.careerTitle,
        roadmap.totalPhases,
        roadmap.currentPhase,
        roadmap.overallProgressPct
      ]
    );
  }

  // Remove old tasks for this roadmap
  await pool.query(
    `DELETE FROM roadmap_tasks
     WHERE roadmap_id = ?`,
    [roadmapId]
  );

  // Insert new tasks using the ACTUAL database roadmap ID
  for (const task of roadmap.tasks) {
    await pool.query(
      `INSERT INTO roadmap_tasks
       (id, roadmap_id, phase_number, phase_name, title, description,
        skill_focus, estimated_hours, difficulty, learning_resources,
        recommended_project, status, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        roadmapId,
        task.phaseNumber,
        task.phaseName,
        task.title,
        task.description,
        task.skillFocus,
        task.estimatedHours,
        task.difficulty,
        JSON.stringify(task.resources || []),
        task.recommendedProject || null,
        task.status,
        task.completedAt || null
      ]
    );
  }

  return {
    ...roadmap,
    id: roadmapId,
    tasks: roadmap.tasks.map((task) => ({
      ...task,
      roadmapId
    }))
  };
}async updateRoadmapTask(
  userId: string,
  taskId: string,
  updates: Partial<RoadmapTask>
): Promise<Roadmap | undefined> {
  const roadmap = await this.getRoadmap(userId);

  if (!roadmap) return undefined;

  const taskIndex = roadmap.tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) return undefined;

  const updatedTask = {
    ...roadmap.tasks[taskIndex],
    ...updates
  };

  const completedAt = updatedTask.completedAt
    ? new Date(updatedTask.completedAt)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ')
    : null;

  await pool.query(
    `UPDATE roadmap_tasks
     SET phase_number = ?,
         phase_name = ?,
         title = ?,
         description = ?,
         skill_focus = ?,
         estimated_hours = ?,
         difficulty = ?,
         learning_resources = ?,
         recommended_project = ?,
         status = ?,
         completed_at = ?
     WHERE id = ? AND roadmap_id = ?`,
    [
      updatedTask.phaseNumber,
      updatedTask.phaseName,
      updatedTask.title,
      updatedTask.description,
      updatedTask.skillFocus,
      updatedTask.estimatedHours,
      updatedTask.difficulty,
      JSON.stringify(updatedTask.resources || []),
      updatedTask.recommendedProject || null,
      updatedTask.status,
      completedAt,
      taskId,
      roadmap.id
    ]
  );

  const completedCount = roadmap.tasks.filter((t, index) =>
    index === taskIndex
      ? updatedTask.status === 'completed'
      : t.status === 'completed'
  ).length;

  const progress = roadmap.tasks.length > 0
    ? Math.round((completedCount / roadmap.tasks.length) * 100)
    : 0;

  await pool.query(
    `UPDATE roadmaps
     SET overall_progress_pct = ?
     WHERE id = ? AND user_id = ?`,
    [progress, roadmap.id, userId]
  );

  return await this.getRoadmap(userId);
}

  // Projects & Courses
async getProjects(category?: string): Promise<Project[]> {
  let query = 'SELECT * FROM projects';
  const params: any[] = [];

  if (category && category !== 'All') {
    query += ' WHERE LOWER(career_category) LIKE LOWER(?)';
    params.push(`%${category}%`);
  }

  query += ' ORDER BY title ASC';

  const [rows] = await pool.query(query, params);
  const projects = rows as any[];

  return projects.map((project) => ({
    id: project.id,
    title: project.title,
    careerCategory: project.career_category,
    difficulty: project.difficulty,
    estimatedHours: project.estimated_hours,
    skillsLearned: project.skills_learned || [],
    technologies: project.technologies || [],
    description: project.description,
    deliverables: project.deliverables || []
  }));
}
async getCourses(category?: string): Promise<CourseResource[]> {
  let query = 'SELECT * FROM courses';
  const params: any[] = [];

  if (category && category !== 'all') {
    query += ' WHERE LOWER(category) = LOWER(?)';
    params.push(category);
  }

  query += ' ORDER BY title ASC';

  const [rows] = await pool.query(query, params);
  const courses = rows as any[];

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    category: course.category,
    skillName: course.skill_name,
    difficulty: course.difficulty,
    duration: course.duration,
    resourceType: course.resource_type,
    provider: course.provider,
    url: course.url,
    description: course.description
  }));
}

  // Resume methods
  async getResumeAnalysis(userId: string): Promise<ResumeAnalysis | undefined> {
  const [rows] = await pool.query(
    `SELECT
       r.id AS resume_id,
       r.user_id,
       r.file_name,
       r.file_size_bytes,
       r.uploaded_at,
       ra.id AS analysis_id,
       ra.resume_score,
       ra.detected_skills,
       ra.missing_skills,
       ra.strengths,
       ra.education_summary,
       ra.experience_summary,
       ra.projects_detected,
       ra.suggested_careers,
       ra.improvement_suggestions
     FROM resumes r
     INNER JOIN resume_analysis ra
       ON r.id = ra.resume_id
     WHERE r.user_id = ?
     ORDER BY r.uploaded_at DESC
     LIMIT 1`,
    [userId]
  );

  const results = rows as any[];

  if (results.length === 0) return undefined;

  const resume = results[0];

  return {
    id: resume.analysis_id,
    userId: resume.user_id,
    fileName: resume.file_name,
    fileSizeBytes: resume.file_size_bytes,
    uploadDate: resume.uploaded_at,
    resumeScore: resume.resume_score,
    detectedSkills: resume.detected_skills || [],
    experienceSummary: resume.experience_summary || '',
    educationSummary: resume.education_summary || '',
    projectsDetected: resume.projects_detected || [],
    strengths: resume.strengths || [],
    missingSkills: resume.missing_skills || [],
    suggestedCareerPaths: resume.suggested_careers || [],
    improvementSuggestions: resume.improvement_suggestions || []
  };
}
async saveResumeAnalysis(
  analysis: ResumeAnalysis,
  rawText: string
): Promise<ResumeAnalysis> {
  const resumeId = `res_${Date.now()}`;

  await pool.query(
    `INSERT INTO resumes
     (id, user_id, file_name, file_size_bytes, raw_text, upload_status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      resumeId,
      analysis.userId,
      analysis.fileName,
      analysis.fileSizeBytes,
      rawText,
      'analyzed'
    ]
  );

  await pool.query(
    `INSERT INTO resume_analysis
     (id, resume_id, user_id, resume_score, detected_skills,
      missing_skills, strengths, education_summary, experience_summary,
      projects_detected, suggested_careers, improvement_suggestions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      analysis.id,
      resumeId,
      analysis.userId,
      analysis.resumeScore,
      JSON.stringify(analysis.detectedSkills),
      JSON.stringify(analysis.missingSkills),
      JSON.stringify(analysis.strengths),
      analysis.educationSummary,
      analysis.experienceSummary,
      JSON.stringify(analysis.projectsDetected),
      JSON.stringify(analysis.suggestedCareerPaths),
      JSON.stringify(analysis.improvementSuggestions)
    ]
  );

  return analysis;
}
  // Assessment methods
  getAssessmentQuestions(): AssessmentQuestion[] {
    return INITIAL_ASSESSMENT_QUESTIONS;
  }
async getAssessmentResult(
  userId: string
): Promise<AssessmentResult | undefined> {
  const [rows] = await pool.query(
    `SELECT *
     FROM career_assessments
     WHERE user_id = ?
     ORDER BY completed_at DESC
     LIMIT 1`,
    [userId]
  );

  const assessments = rows as any[];

  if (assessments.length === 0) return undefined;

  const assessment = assessments[0];

  return {
    id: assessment.id,
    userId: assessment.user_id,
    completedAt: assessment.completed_at,
    fitScore: assessment.fit_score || 0,
    topCareerTrack: assessment.top_recommended_track || '',
    radarScores: assessment.radar_scores || [],
    aiSummary: assessment.ai_fit_summary || '',
    nextSteps: assessment.next_steps || []
  };
}
async saveAssessmentResult(result: AssessmentResult): Promise<AssessmentResult> {
  const completedAt = new Date(result.completedAt)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  await pool.query(
    `INSERT INTO career_assessments
     (id, user_id, total_questions, status,
      ai_fit_summary, top_recommended_track,
      fit_score, radar_scores, next_steps, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      result.id,
      result.userId,
      8,
      'completed',
      result.aiSummary,
      result.topCareerTrack,
      result.fitScore,
      JSON.stringify(result.radarScores),
      JSON.stringify(result.nextSteps),
      completedAt
    ]
  );

  return result;
}
async getUserProgress(userId: string): Promise<UserProgressData> {
  // Get user's skills
  const [skillRows] = await pool.query(
    `SELECT proficiency
     FROM user_skills
     WHERE user_id = ?`,
    [userId]
  );

  const skills = skillRows as any[];

  const totalSkills = skills.length;

  const completedSkills = skills.filter(
    (skill) =>
      skill.proficiency === 'advanced' ||
      skill.proficiency === 'expert'
  ).length;

  const skillsProgressPct =
    totalSkills > 0
      ? Math.round((completedSkills / totalSkills) * 100)
      : 0;
  // Get roadmap progress from actual roadmap tasks
  const [roadmapRows] = await pool.query(
    `SELECT
       COUNT(rt.id) AS total_tasks,
       COALESCE(
         SUM(
           CASE
             WHEN rt.status = 'completed' THEN 1
             ELSE 0
           END
         ),
         0
       ) AS completed_tasks
     FROM roadmaps r
     LEFT JOIN roadmap_tasks rt
       ON rt.roadmap_id = r.id
     WHERE r.user_id = ?`,
    [userId]
  );

  const roadmapData = (roadmapRows as any[])[0];

  const totalTasks = Number(roadmapData?.total_tasks || 0);
  const completedTasks = Number(roadmapData?.completed_tasks || 0);

  const roadmapProgressPct =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;
        // Get latest real project and learning progress
  const [progressRows] = await pool.query(
    `SELECT
       projects_completed_count,
       learning_hours_total
     FROM user_progress
     WHERE user_id = ?
     ORDER BY snapshot_date DESC
     LIMIT 1`,
    [userId]
  );

  const progressData = (progressRows as any[])[0];

  const projectsCompletedCount =
    Number(progressData?.projects_completed_count || 0);

  const learningHoursTotal =
    Number(progressData?.learning_hours_total || 0);


  // Calculate overall career readiness
  const overallCareerReadiness = Math.round(
    (skillsProgressPct + roadmapProgressPct) / 2
  );


  // Get real progress history
  const [historyRows] = await pool.query(
    `SELECT
       snapshot_date,
       career_readiness_pct,
       skills_completed_count,
       learning_hours_total
     FROM user_progress
     WHERE user_id = ?
     ORDER BY snapshot_date ASC`,
    [userId]
  );

  const history = historyRows as any[];


  return {
    overallCareerReadiness,
    skillsProgressPct,
    roadmapProgressPct,
    projectsCompletedCount,
    totalProjectsTarget: 5,
    coursesCompletedCount: 0,
    learningHoursTotal,
    timelineHistory: history.map((item) => ({
      date: item.snapshot_date,
      readiness: Number(item.career_readiness_pct || 0),
      skillsCount: Number(item.skills_completed_count || 0),
      hours: Number(item.learning_hours_total || 0)
    }))
  };
}
async saveUserProgress(
  userId: string,
  data: UserProgressData
): Promise<UserProgressData> {
  const today = new Date().toISOString().slice(0, 10);

  // Snapshot the user's real skill counts instead of deriving them from a
  // hardcoded total of 10.
  const [skillCountRows] = await pool.query(
    `SELECT
       COUNT(*) AS total_skills,
       COALESCE(SUM(CASE WHEN proficiency IN ('advanced', 'expert') THEN 1 ELSE 0 END), 0) AS completed_skills
     FROM user_skills
     WHERE user_id = ?`,
    [userId]
  );
  const skillCounts = (skillCountRows as any[])[0] || {};
  const totalSkillsCount = Number(skillCounts.total_skills || 0);
  const skillsCompletedCount = Number(skillCounts.completed_skills || 0);

  await pool.query(
    `INSERT INTO user_progress
     (id, user_id, snapshot_date, career_readiness_pct,
      roadmap_progress_pct, skills_completed_count,
      total_skills_count, projects_completed_count,
      learning_hours_total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       career_readiness_pct = VALUES(career_readiness_pct),
       roadmap_progress_pct = VALUES(roadmap_progress_pct),
       skills_completed_count = VALUES(skills_completed_count),
       total_skills_count = VALUES(total_skills_count),
       projects_completed_count = VALUES(projects_completed_count),
       learning_hours_total = VALUES(learning_hours_total)`,
    [
      `prog_${userId}_${today}`,
      userId,
      today,
      data.overallCareerReadiness,
      data.roadmapProgressPct,
      skillsCompletedCount,
      totalSkillsCount,
      data.projectsCompletedCount,
      data.learningHoursTotal
    ]
  );

  return data;
}

  // ------------------------------------------------------------------
  // Startup seeding
  // ------------------------------------------------------------------
  /**
   * Inserts the built-in catalog data (careers + their skills, projects,
   * courses), but ONLY into empty tables, so restarts never duplicate or
   * overwrite real data. Failures are logged, never thrown, so a seeding
   * problem cannot crash server startup. No user accounts are seeded:
   * a demo account with a publicly known password would be a security hole.
   */
  async seedCatalogData(): Promise<void> {
    try {
      const [careerCountRows] = await pool.query('SELECT COUNT(*) AS count FROM careers');
      if (Number((careerCountRows as any[])[0]?.count || 0) === 0) {
        for (const career of INITIAL_CAREERS) {
          await pool.query(
            `INSERT INTO careers
             (id, slug, title, category, description, average_salary,
              growth_outlook, difficulty_level, typical_responsibilities,
              tools_and_technologies)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              career.id,
              career.slug,
              career.title,
              career.category,
              career.description,
              career.averageSalary,
              career.growthOutlook,
              career.difficultyLevel,
              JSON.stringify(career.typicalResponsibilities),
              JSON.stringify(career.toolsAndTechnologies)
            ]
          );

          for (const skillName of career.requiredSkills) {
            await pool.query(
              `INSERT INTO career_skills (id, career_id, skill_name, is_required)
               VALUES (?, ?, ?, ?)`,
              [randomUUID(), career.id, skillName, true]
            );
          }
          for (const skillName of career.recommendedSkills) {
            await pool.query(
              `INSERT INTO career_skills (id, career_id, skill_name, is_required)
               VALUES (?, ?, ?, ?)`,
              [randomUUID(), career.id, skillName, false]
            );
          }
        }
        console.log(`[NexLeaf] Seeded ${INITIAL_CAREERS.length} careers into the database.`);
      }

      const [projectCountRows] = await pool.query('SELECT COUNT(*) AS count FROM projects');
      if (Number((projectCountRows as any[])[0]?.count || 0) === 0) {
        for (const project of INITIAL_PROJECTS) {
          await pool.query(
            `INSERT INTO projects
             (id, title, career_category, difficulty, estimated_hours,
              skills_learned, technologies, description, deliverables)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              project.id,
              project.title,
              project.careerCategory,
              project.difficulty,
              project.estimatedHours,
              JSON.stringify(project.skillsLearned),
              JSON.stringify(project.technologies),
              project.description,
              JSON.stringify(project.deliverables)
            ]
          );
        }
        console.log(`[NexLeaf] Seeded ${INITIAL_PROJECTS.length} projects into the database.`);
      }

      const [courseCountRows] = await pool.query('SELECT COUNT(*) AS count FROM courses');
      if (Number((courseCountRows as any[])[0]?.count || 0) === 0) {
        for (const course of INITIAL_COURSES) {
          await pool.query(
            `INSERT INTO courses
             (id, title, category, skill_name, difficulty, duration,
              resource_type, provider, url, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              course.id,
              course.title,
              course.category,
              course.skillName,
              course.difficulty,
              course.duration,
              course.resourceType,
              course.provider,
              course.url,
              course.description
            ]
          );
        }
        console.log(`[NexLeaf] Seeded ${INITIAL_COURSES.length} courses into the database.`);
      }

    } catch (error) {
      console.error('[NexLeaf] Catalog seeding failed (server will continue without seed data):', error);
    }
  }
  /**
   * Generates a complete MySQL DDL and DML export script for the BCA final project
   */
  exportSqlDump(): string {
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    let schemaContent = '';
    if (fs.existsSync(schemaPath)) {
      schemaContent = fs.readFileSync(schemaPath, 'utf8');
    }

   const dataInserts = `
-- =====================================================================
-- CATALOG DATA EXPORT
-- Generated: ${new Date().toISOString()}
-- =====================================================================

-- Insert Careers Catalog
${INITIAL_CAREERS.map(
  (c) =>
    `INSERT INTO \`careers\` (\`id\`, \`slug\`, \`title\`, \`category\`, \`description\`, \`average_salary\`, \`growth_outlook\`, \`difficulty_level\`)
VALUES ('${c.id}', '${c.slug}', '${c.title.replace(/'/g, "''")}', '${c.category}', '${c.description.replace(/'/g, "''")}', '${c.averageSalary}', '${c.growthOutlook}', '${c.difficultyLevel}')
ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`);`
).join('\n')}
`;
    return `${schemaContent}\n\n${dataInserts}`;
  }
}

export const db = new DatabaseRepository();
