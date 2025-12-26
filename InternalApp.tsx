import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Welcome } from './tools/Welcome';
import { JetBiz } from './tools/JetBiz';
import { JetViz } from './tools/JetViz';
import { JetPost } from './tools/JetPost';
import { JetReply } from './tools/JetReply';
import { JetTrust } from './tools/JetTrust';
import { JetLeads } from './tools/JetLeads';
import { JetContent } from './tools/JetContent';
import { JetAds } from './tools/JetAds';
import { JetCompete } from './tools/JetCompete';
import { JetEvents } from './tools/JetEvents';
import { JetKeywords } from './tools/JetKeywords';
import { JetImage } from './tools/JetImage';
import { JetCreate } from './tools/JetCreate';
import { GrowthPlan } from './tools/GrowthPlan';
import type { Tool, GrowthPlanTask, ProfileData, ReadinessState, AuditReport, LiveWebsiteAnalysis, SavedKeyword, KeywordData } from './types';
import { BusinessDetails } from './tools/profile/BusinessDetails';
import { GrowthScoreHistory } from './tools/profile/GrowthScoreHistory';
import { ReportsDownloads } from './tools/profile/ReportsDownloads';
import { WeeklyProgress } from './tools/WeeklyProgress';
import { KnowledgeBase } from './tools/KnowledgeBase';
import { Account } from './tools/Account';
import { AdminPanel } from './tools/AdminPanel';
import UserSupportTickets from './tools/UserSupportTickets';
import SupportChatbot from './components/SupportChatbot';
import { ALL_TOOLS } from './constants';
import { EyeIcon } from './components/icons/MiniIcons';

interface InternalAppProps {
    onLogout: () => void;
    userEmail: string;
}

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';

const createInitialProfile = (email: string, firstName: string, lastName: string): ProfileData => ({
    user: { firstName, lastName, email, phone: '', role: 'Owner' },
    business: { name: '', category: '', description: '', websiteUrl: '', location: '', serviceArea: '', phone: '', email: '', dna: { logo: '', colors: [], fonts: '', style: '' }, isDnaApproved: false, dnaLastUpdatedAt: undefined },
    googleBusiness: { profileName: '', mapsUrl: '', status: 'Not Created' },
    isProfileActive: false,
    brandDnaProfile: undefined,
});

export const InternalApp: React.FC<InternalAppProps> = ({ onLogout, userEmail }) => {
  const [activeTool, setActiveToolState] = useState<Tool | null>(null);
  const [activeKbArticle, setActiveKbArticle] = useState<string | null>(null);

  const [growthPlanTasks, setGrowthPlanTasks] = useState<GrowthPlanTask[]>(() => {
      try { const savedTasks = localStorage.getItem(`jetsuite_growthPlanTasks_${userEmail}`); return savedTasks ? JSON.parse(savedTasks) : []; } catch (e) { return []; }
  });
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>(() => {
      try { const saved = localStorage.getItem(`jetsuite_savedKeywords_${userEmail}`); return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
  });
  const [jetContentInitialProps, setJetContentInitialProps] = useState<{keyword: KeywordData, type: string} | null>(null);
  
  const [growthScore, setGrowthScore] = useState(150);
  
  // --- Admin State Simulation ---
    const [allProfiles, setAllProfiles] = useState<ProfileData[]>(() => {
        const adminProfile = createInitialProfile(ADMIN_EMAIL, 'The Ivsight', 'Company');
        const testProfile = createInitialProfile('test.user@example.com', 'Test', 'User');
        try { const savedAdmin = localStorage.getItem(`jetsuite_profile_${ADMIN_EMAIL}`); const savedTest = localStorage.getItem(`jetsuite_profile_test.user@example.com`); return [ savedAdmin ? JSON.parse(savedAdmin) : adminProfile, savedTest ? JSON.parse(savedTest) : testProfile ]; } catch(e) { return [adminProfile, testProfile]; }
    });
  const [impersonatedUserEmail, setImpersonatedUserEmail] = useState<string | null>(null);
  // --- End Admin State ---

  const currentUser = impersonatedUserEmail || userEmail;
  const isAdmin = userEmail === ADMIN_EMAIL;
  
  const profileData = allProfiles.find(p => p.user.email === currentUser) || allProfiles[0];
  
  const setProfileData = (newProfileData: ProfileData, persist: boolean = false) => {
    setAllProfiles(prev => {
        const updatedProfiles = prev.map(p => p.user.email === newProfileData.user.email ? newProfileData : p);
        if (persist) {
            try { localStorage.setItem(`jetsuite_profile_${newProfileData.user.email}`, JSON.stringify(newProfileData)); } catch (e) { console.warn("Could not save profile to localStorage", e); }
        }
        return updatedProfiles;
    });
  };

  useEffect(() => {
      try { localStorage.setItem(`jetsuite_growthPlanTasks_${currentUser}`, JSON.stringify(growthPlanTasks)); } catch(e) { console.warn("Could not save tasks to localStorage", e); }
  }, [growthPlanTasks, currentUser]);
  
  useEffect(() => {
      try { localStorage.setItem(`jetsuite_savedKeywords_${currentUser}`, JSON.stringify(savedKeywords)); } catch(e) { console.warn("Could not save keywords to localStorage", e); }
  }, [savedKeywords, currentUser]);

  const [plan] = useState({ name: 'Tier 1', profileLimit: 1 });

  const setActiveTool = (tool: Tool | null, articleId?: string) => {
    setJetContentInitialProps(null); // Reset on any navigation
    setActiveToolState(tool);
    if (tool?.id === 'knowledgebase') {
      setActiveKbArticle(articleId || 'introduction');
    }
  };

  useEffect(() => {
    if (impersonatedUserEmail && activeTool?.id === 'adminpanel') { setImpersonatedUserEmail(null); }
    if (!isAdmin && activeTool?.id === 'adminpanel') { setActiveToolState(null); }
  }, [activeTool, impersonatedUserEmail, isAdmin]);

  useEffect(() => {
    // Growth Score Calculation (0-99 max, 100 is benchmark but unachievable)
    let score = 0;
    const { business, googleBusiness } = profileData;
    const totalTasks = growthPlanTasks.length;
    const completedTasks = growthPlanTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = growthPlanTasks.filter(t => t.status === 'in_progress').length;
    
    // FOUNDATION SETUP (35 points max)
    // Basic business info - 10 points
    if (business.name && business.location && business.websiteUrl) {
      score += 10;
    } else if (business.name || business.location || business.websiteUrl) {
      // Partial credit for incomplete setup
      score += 3;
    }
    
    // Brand DNA approved - 10 points
    if (business.isDnaApproved) {
      score += 10;
    }
    
    // Google Business Profile - 15 points
    if (googleBusiness.status === 'Verified') {
      score += 15;
    } else if (googleBusiness.status === 'Not Verified') {
      score += 5; // Partial credit for connecting but not verified
    }
    
    // TASK COMPLETION (65 points max - this is the main driver)
    if (totalTasks > 0) {
      // Completed tasks worth more
      const completedPoints = Math.min(completedTasks * 5, 50); // Max 50 points from completed tasks
      score += completedPoints;
      
      // In-progress tasks worth something but much less
      const inProgressPoints = Math.min(inProgressTasks * 2, 10); // Max 10 points from in-progress tasks
      score += inProgressPoints;
      
      // Consistency bonus: If they've completed at least 25% of their tasks
      if (totalTasks >= 4 && completedTasks >= Math.ceil(totalTasks * 0.25)) {
        score += 5; // Consistency bonus
      }
    } else {
      // No tasks in growth plan at all = penalty (they haven't engaged with tools)
      score = Math.max(0, score - 10);
    }
    
    // Cap at 99 (100 is benchmark but never achievable)
    score = Math.min(score, 99);
    
    setGrowthScore(score);
  }, [profileData, growthPlanTasks]);

  const handleUpdateProfileData = (newProfileData: ProfileData, persist: boolean = true) => {
    const { name, location, websiteUrl } = newProfileData.business;
    if (name && location && websiteUrl && !newProfileData.isProfileActive) { setProfileData({ ...newProfileData, isProfileActive: true }, persist); } else { setProfileData(newProfileData, persist); }
  };

  const addTasksToGrowthPlan = (newTasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => {
    setGrowthPlanTasks(prevTasks => {
      const existingTitles = new Set(prevTasks.map(t => t.title));
      const tasksToAdd = newTasks.filter(newTask => !existingTitles.has(newTask.title)).map(task => ({ ...task, id: `${task.sourceModule.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`, status: 'to_do' as const, createdAt: new Date().toISOString() }));
      return [...prevTasks, ...tasksToAdd];
    });
  };

  const handleTaskStatusChange = (taskId: string, newStatus: GrowthPlanTask['status']) => {
      setGrowthPlanTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, status: newStatus, completionDate: newStatus === 'completed' ? new Date().toISOString() : undefined } : task ));
  };

  const handleSaveAnalysis = (type: 'jetbiz' | 'jetviz', report: AuditReport | LiveWebsiteAnalysis | null) => {
      const newProfileData = { ...profileData, [`${type}Analysis`]: report };
      handleUpdateProfileData(newProfileData, true); // Persist analysis
  };

  const isStep1Complete = !!(profileData.business.name && profileData.business.location && profileData.business.websiteUrl);
  const isStep2Complete = profileData.business.isDnaApproved;

  let readinessState: ReadinessState = 'Setup Incomplete';
  if (isStep1Complete && isStep2Complete) readinessState = 'Foundation Ready';
  else if (isStep1Complete) readinessState = 'Foundation Weak';

  const renderActiveTool = () => {
    if (isAdmin && activeTool?.id === 'adminpanel') {
        return <AdminPanel allProfiles={allProfiles} setAllProfiles={setAllProfiles} currentUserProfile={profileData} setCurrentUserProfile={setProfileData} onImpersonate={setImpersonatedUserEmail} />;
    }
    if (!activeTool || activeTool.id === 'home') {
      return <Welcome setActiveTool={setActiveTool} profileData={profileData} readinessState={readinessState} plan={plan} />;
    }
    switch (activeTool.id) {
      case 'businessdetails': return <BusinessDetails profileData={profileData} onUpdate={handleUpdateProfileData} setActiveTool={setActiveTool} />;
      case 'growthscore': return <GrowthScoreHistory growthScore={growthScore} profileData={profileData} />;
      case 'account': return <Account plan={plan} profileData={profileData} onLogout={onLogout} onUpdateProfile={handleUpdateProfileData} />;
      case 'knowledgebase': return <KnowledgeBase setActiveTool={setActiveTool} initialArticleId={activeKbArticle} />;
      
      case 'jetbiz': return <JetBiz tool={activeTool} addTasksToGrowthPlan={addTasksToGrowthPlan} onSaveAnalysis={(report) => handleSaveAnalysis('jetbiz', report)} profileData={profileData} setActiveTool={setActiveTool} growthPlanTasks={growthPlanTasks} onTaskStatusChange={handleTaskStatusChange} />;
      case 'jetviz': return <JetViz tool={activeTool} addTasksToGrowthPlan={addTasksToGrowthPlan} onSaveAnalysis={(report) => handleSaveAnalysis('jetviz', report)} profileData={profileData} setActiveTool={setActiveTool} growthPlanTasks={growthPlanTasks} onTaskStatusChange={handleTaskStatusChange} />;
      case 'jetcompete': return <JetCompete tool={activeTool} addTasksToGrowthPlan={addTasksToGrowthPlan} profileData={profileData} setActiveTool={setActiveTool} />;
      case 'jetkeywords': return <JetKeywords tool={activeTool} profileData={profileData} setActiveTool={setActiveTool} />;
      case 'jetpost': return <JetPost tool={activeTool} profileData={profileData} setActiveTool={setActiveTool} />;
      case 'jetcontent': return <JetContent tool={activeTool} initialProps={jetContentInitialProps} profileData={profileData} setActiveTool={setActiveTool} />;
      case 'jetimage': return <JetImage tool={activeTool} />;
      case 'jetcreate': return <JetCreate tool={activeTool} profileData={profileData} setActiveTool={setActiveTool} onUpdateProfile={handleUpdateProfileData} />;
      case 'jetreply': return <JetReply tool={activeTool} profileData={profileData} readinessState={readinessState} setActiveTool={setActiveTool} />;
      case 'jettrust': return <JetTrust tool={activeTool} profileData={profileData} setActiveTool={setActiveTool} />;
      case 'jetleads': return <JetLeads tool={activeTool} profileData={profileData} setActiveTool={setActiveTool} />;
      case 'jetevents': return <JetEvents tool={activeTool} />;
      case 'jetads': return <JetAds tool={activeTool} />;
      
      case 'growthplan': return <GrowthPlan tasks={growthPlanTasks} setTasks={setGrowthPlanTasks} setActiveTool={setActiveTool} onTaskStatusChange={handleTaskStatusChange} growthScore={growthScore} />;
      case 'support': return <UserSupportTickets />;
      default: return <Welcome setActiveTool={setActiveTool} profileData={profileData} readinessState={readinessState} plan={plan} />;
    }
  };
  
  const isJetCreateActive = activeTool?.id === 'jetcreate';

  return (
    <div className="flex h-screen text-brand-text font-sans bg-brand-light">
      {!isJetCreateActive && <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} isAdmin={isAdmin} onLogout={onLogout} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {impersonatedUserEmail && ( <div className="bg-red-600 text-white text-center py-2 font-bold flex items-center justify-center gap-2"> <EyeIcon className="w-5 h-5"/> Viewing as {impersonatedUserEmail}. <button onClick={() => setImpersonatedUserEmail(null)} className="underline ml-2">Return to Admin</button> </div> )}
        {!isJetCreateActive && <Header activeTool={activeTool} growthScore={growthScore} />}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${ isJetCreateActive ? 'bg-pomelli-dark' : 'bg-brand-light p-6 sm:p-8 lg:p-10' }`}>
          {renderActiveTool()}
        </main>
        
        {/* Support Chatbot - Available ONLY on Support page */}
        {activeTool?.id === 'support' && (
          <SupportChatbot context={{ 
            user_email: currentUser || undefined,
            business_name: profileData.business.name,
            current_page: activeTool?.id || 'home',
            subscription_status: 'active',
            conversation_turns: 0,
            mentioned_topics: []
          }} />
        )}
      </div>
    </div>
  );
};