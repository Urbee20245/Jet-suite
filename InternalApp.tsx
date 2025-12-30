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
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface InternalAppProps {
    onLogout: () => void;
    userEmail: string;
    userId: string;
}

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';

const createInitialProfile = (id: string, email: string, firstName: string, lastName: string): ProfileData => ({
    user: { id, firstName, lastName, email, phone: '', role: 'Owner' },
    business: { name: '', category: '', description: '', websiteUrl: '', location: '', serviceArea: '', phone: '', email: '', dna: { logo: '', colors: [], fonts: '', style: '' }, isDnaApproved: false, dnaLastUpdatedAt: undefined },
    googleBusiness: { profileName: '', mapsUrl: '', status: 'Not Created' },
    isProfileActive: false,
    brandDnaProfile: undefined,
});

export const InternalApp: React.FC<InternalAppProps> = ({ onLogout, userEmail, userId }) => {
  const [activeTool, setActiveToolState] = useState<Tool | null>(null);
  const [activeKbArticle, setActiveKbArticle] = useState<string | null>(null);

  // --- Identity & State Management ---
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const activeUserId = impersonatedUserId || userId;

  const [growthPlanTasks, setGrowthPlanTasks] = useState<GrowthPlanTask[]>(() => {
      try { const savedTasks = localStorage.getItem(`jetsuite_growthPlanTasks_${activeUserId}`); return savedTasks ? JSON.parse(savedTasks) : []; } catch (e) { return []; }
  });
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>(() => {
      try { const saved = localStorage.getItem(`jetsuite_savedKeywords_${activeUserId}`); return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
  });
  const [jetContentInitialProps, setJetContentInitialProps] = useState<{keyword: KeywordData, type: string} | null>(null);
  
  const [growthScore, setGrowthScore] = useState(150);
  
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>(() => {
      const adminProfile = createInitialProfile(userId, userEmail, 'The Ivsight', 'Company');
      const testProfile = createInitialProfile('test-user-uuid', 'test.user@example.com', 'Test', 'User');
      
      try { 
          const savedAdmin = localStorage.getItem(`jetsuite_profile_${userId}`); 
          const savedTest = localStorage.getItem(`jetsuite_profile_test-user-uuid`); 
          return [ 
            savedAdmin ? JSON.parse(savedAdmin) : adminProfile, 
            savedTest ? JSON.parse(savedTest) : testProfile 
          ]; 
      } catch(e) { return [adminProfile, testProfile]; }
  });

  // 🔄 Sync Database Profile on Mount (Targeting Primary Business)
  useEffect(() => {
    const syncProfileWithDatabase = async () => {
      if (!userId) return;

      const { data: dbProfile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .maybeSingle();

      if (dbProfile) {
        setAllProfiles(prev => {
          const updated = [...prev];
          const index = updated.findIndex(p => p.user.id === userId);
          if (index !== -1) {
            const syncedProfile = {
              ...updated[index],
              business: {
                ...updated[index].business,
                name: dbProfile.business_name || updated[index].business.name,
                websiteUrl: dbProfile.business_website || updated[index].business.websiteUrl,
                category: dbProfile.industry || updated[index].business.category,
                location: dbProfile.city && dbProfile.state 
                  ? `${dbProfile.city}, ${dbProfile.state}` 
                  : updated[index].business.location
              },
              isProfileActive: !!dbProfile.is_complete
            };
            
            updated[index] = syncedProfile;
            localStorage.setItem(`jetsuite_profile_${userId}`, JSON.stringify(syncedProfile));
          }
          return updated;
        });
      }
    };

    syncProfileWithDatabase();
  }, [userId]);

  const isAdmin = userEmail === ADMIN_EMAIL;
  const profileData = impersonatedUserId === 'test-user-uuid' ? allProfiles[1] : allProfiles[0];
  
  const setProfileData = (newProfileData: ProfileData, persist: boolean = false) => {
    setAllProfiles(prev => {
        const isSelf = newProfileData.user.id === userId;
        const index = isSelf ? 0 : 1;
        const updatedProfiles = [...prev];
        updatedProfiles[index] = newProfileData;

        if (persist) {
            try { 
              localStorage.setItem(`jetsuite_profile_${newProfileData.user.id}`, JSON.stringify(newProfileData)); 
            } catch (e) { 
              console.warn("Could not save profile to localStorage", e); 
            }
        }
        return updatedProfiles;
    });
  };

  useEffect(() => {
      try { localStorage.setItem(`jetsuite_growthPlanTasks_${activeUserId}`, JSON.stringify(growthPlanTasks)); } catch(e) { console.warn("Could not save tasks", e); }
  }, [growthPlanTasks, activeUserId]);
  
  useEffect(() => {
      try { localStorage.setItem(`jetsuite_savedKeywords_${activeUserId}`, JSON.stringify(savedKeywords)); } catch(e) { console.warn("Could not save keywords", e); }
  }, [savedKeywords, activeUserId]);

  const [plan] = useState({ name: 'Tier 1', profileLimit: 1 });

  const setActiveTool = (tool: Tool | null, articleId?: string) => {
    setJetContentInitialProps(null); 
    setActiveToolState(tool);
    if (tool?.id === 'knowledgebase') {
      setActiveKbArticle(articleId || 'introduction');
    }
  };

  useEffect(() => {
    let score = 0;
    const { business, googleBusiness } = profileData;
    const totalTasks = growthPlanTasks.length;
    const completedTasks = growthPlanTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = growthPlanTasks.filter(t => t.status === 'in_progress').length;
    
    if (business.name && business.location && business.websiteUrl) {
      score += 10;
    } else if (business.name || business.location || business.websiteUrl) {
      score += 3;
    }
    
    if (business.isDnaApproved) {
      score += 10;
    }
    
    if (googleBusiness.status === 'Verified') {
      score += 15;
    } else if (googleBusiness.status === 'Not Verified') {
      score += 5;
    }
    
    if (totalTasks > 0) {
      const completedPoints = Math.min(completedTasks * 5, 50);
      score += completedPoints;
      const inProgressPoints = Math.min(inProgressTasks * 2, 10);
      score += inProgressPoints;
      if (totalTasks >= 4 && completedTasks >= Math.ceil(totalTasks * 0.25)) {
        score += 5;
      }
    } else {
      score = Math.max(0, score - 10);
    }
    
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
      handleUpdateProfileData(newProfileData, true); 
  };

  const isStep1Complete = !!(profileData.business.name && profileData.business.location && profileData.business.websiteUrl);
  const isStep2Complete = profileData.business.isDnaApproved;

  let readinessState: ReadinessState = 'Setup Incomplete';
  if (isStep1Complete && isStep2Complete) readinessState = 'Foundation Ready';
  else if (isStep1Complete) readinessState = 'Foundation Weak';

  const renderActiveTool = () => {
    if (isAdmin && activeTool?.id === 'adminpanel') {
        return <AdminPanel allProfiles={allProfiles} setAllProfiles={setAllProfiles} currentUserProfile={profileData} setCurrentUserProfile={setProfileData} onImpersonate={(id) => setImpersonatedUserId(id === 'test-user-uuid' ? 'test-user-uuid' : null)} />;
    }
    if (!activeTool || activeTool.id === 'home') {
      return <Welcome setActiveTool={setActiveTool} profileData={profileData} readinessState={readinessState} plan={plan} />;
    }
    switch (activeTool.id) {
      case 'businessdetails': return <BusinessDetails profileData={profileData} onUpdate={handleUpdateProfileData} setActiveTool={setActiveTool} />;
      case 'growthscore': return <GrowthScoreHistory growthScore={growthScore} profileData={profileData} />;
      case 'account': return <Account plan={plan} profileData={profileData} onLogout={onLogout} onUpdateProfile={handleUpdateProfileData} userId={userId} />;
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
        {impersonatedUserId && ( <div className="bg-red-600 text-white text-center py-2 font-bold flex items-center justify-center gap-2"> <EyeIcon className="w-5 h-5"/> Viewing as {profileData.user.email}. <button onClick={() => setImpersonatedUserId(null)} className="underline ml-2">Return to Admin</button> </div> )}
        {!isJetCreateActive && <Header activeTool={activeTool} growthScore={growthScore} />}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${ isJetCreateActive ? 'bg-pomelli-dark' : 'bg-brand-light p-6 sm:p-8 lg:p-10' }`}>
          {renderActiveTool()}
        </main>
        
        {activeTool?.id === 'support' && (
          <SupportChatbot context={{ 
            user_id: userId,
            user_email: userEmail,
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