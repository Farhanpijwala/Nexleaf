import React, { useState, useEffect } from 'react';
import { AppProvider, useApp, ActivePage } from './context/AppContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { ToastContainer } from './components/ui/ToastContainer.tsx';

// Public Pages
import { LandingPage } from './pages/public/LandingPage.tsx';
import { AboutPage } from './pages/public/AboutPage.tsx';
import { HowItWorksPage } from './pages/public/HowItWorksPage.tsx';
import { FeaturesPage } from './pages/public/FeaturesPage.tsx';
import { CareersPublicPage } from './pages/public/CareersPublicPage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { OnboardingPage } from './pages/auth/OnboardingPage.tsx';

// Authenticated Pages
import { DashboardPage } from './pages/app/DashboardPage.tsx';
import { ProfilePage } from './pages/app/ProfilePage.tsx';
import { ResumeAnalyzerPage } from './pages/app/ResumeAnalyzerPage.tsx';
import { CareerAssessmentPage } from './pages/app/CareerAssessmentPage.tsx';
import { CareerMatchesPage } from './pages/app/CareerMatchesPage.tsx';
import { CareerDetailPage } from './pages/app/CareerDetailPage.tsx';
import { SkillGapPage } from './pages/app/SkillGapPage.tsx';
import { RoadmapPage } from './pages/app/RoadmapPage.tsx';
import { ProjectsPage } from './pages/app/ProjectsPage.tsx';
import { CoursesPage } from './pages/app/CoursesPage.tsx';
import { ProgressPage } from './pages/app/ProgressPage.tsx';
import { AiCoachPage } from './pages/app/AiCoachPage.tsx';
import { SettingsPage } from './pages/app/SettingsPage.tsx';

const AppContent: React.FC = () => {
 const { activePage, user, isLoading, setActivePage } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Determine if current page is public or authenticated
  const isPublicPage = [
    'landing',
    'about',
    'how-it-works',
    'features',
    'careers-public',
    'career-detail',
    'login',
    'register',
    'onboarding'
  ].includes(activePage);

  const renderCurrentPage = () => {
    switch (activePage) {
      // Public
      case 'landing':
        return <LandingPage />;
      case 'about':
        return <AboutPage />;
      case 'how-it-works':
        return <HowItWorksPage />;
      case 'features':
        return <FeaturesPage />;
      case 'careers-public':
        return <CareersPublicPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'onboarding':
        return <OnboardingPage />;

      // Authenticated
      case 'dashboard':
        return <DashboardPage />;
      case 'profile':
        return <ProfilePage />;
      case 'resume-analyzer':
        return <ResumeAnalyzerPage />;
      case 'career-assessment':
        return <CareerAssessmentPage />;
      case 'career-matches':
        return <CareerMatchesPage />;
      case 'career-detail':
        return <CareerDetailPage />;
      case 'skill-gap':
        return <SkillGapPage />;
      case 'roadmap':
        return <RoadmapPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'courses':
        return <CoursesPage />;
      case 'progress':
        return <ProgressPage />;
      case 'ai-coach':
        return <AiCoachPage />;
      case 'settings':
        return <SettingsPage />;

      default:
        return <LandingPage />;
    }
  };
// Prevent logged-out users from accessing protected pages. The redirect
// must run in an effect — calling setActivePage during render is a React
// anti-pattern that triggers "cannot update a component while rendering".
useEffect(() => {
  if (!isPublicPage && !isLoading && !user) {
    setActivePage('login');
  }
}, [isPublicPage, isLoading, user, setActivePage]);

if (!isPublicPage && !isLoading && !user) {
  return null;
}
  if (isPublicPage) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{renderCurrentPage()}</main>
        <Footer />
        <ToastContainer />
      </div>
    );
  }

  // Authenticated App Shell with Persistent Sidebar and Top Header
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex selection:bg-indigo-500 selection:text-white">
      {/* Sidebar navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 overflow-y-auto">{renderCurrentPage()}</main>
      </div>

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
