import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Welcome } from './tools/Welcome';
import { GrowthPlan } from './tools/GrowthPlan';
import { GrowthScoreHistory } from './tools/profile/GrowthScoreHistory';
import { JetBiz } from './tools/JetBiz';
import { JetViz } from './tools/JetViz';
import { JetPost } from './tools/JetPost';
import { JetReply } from './tools/JetReply';
import { JetLeads } from './tools/JetLeads';
import { JetContent } from './tools/JetContent';
import { JetAds } from './tools/JetAds';
import { JetCompete } from './tools/JetCompete';
import { JetEvents } from './tools/JetEvents';
import { JetKeywords } from './tools/JetKeywords';
import { JetImage } from './tools/JetImage';
import { JetCreate } from './tools/JetCreate';
import { JetDna } from './tools/JetDna';
import { JetTrust } from './tools/JetTrust';
import { WeeklyProgress } from './tools/WeeklyProgress';
import { ActivityHistory } from './tools/ActivityHistory';
import { BusinessDetails } from './tools/BusinessDetails';
import { KnowledgeBase } from './tools/KnowledgeBase';
import { Account } from './tools/Account';
import { ReportsDownloads } from './tools/profile/ReportsDownloads';
import { Planner } from './tools/Planner';
import UserSupportTickets from './tools/UserSupportTickets';
import AdminPanel from './pages/Admin';
import type { Tool, GrowthPlanTask, ProfileData, SavedKeyword, KeywordData, AuditReport, LiveWebsiteAnalysis } from './types';
import { syncToSupabase, loadFromSupabase } from './utils/syncService';
import { getSupabaseClient } from './integrations/supabase/client';

interface InternalAppProps {
    onLogout: () => void;
    userEmail: string;
    userId: string;
}

const InternalApp: React.FC<InternalAppProps> = ({ onLogout, userEmail, userId }) => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [kbArticleId, setKbArticleId] = useState<string | null>(null);
  const [growthScore, setGrowthScore] = useState(35);
  const [tasks, setTasks] = useState<GrowthPlanTask[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonatedProfile, setImpersonatedProfile] = useState<ProfileData | null>(null);

  const supabase = getSupabaseClient();

  const handleSetActiveTool = (tool: Tool | null, articleId?: string) => {
    setActiveTool(tool);
    if (articleId) setKbArticleId(articleId);
    else setKbArticleId(null);
  };

  const loadData = async () => {
    if (!supabase || !userId) return;
    setIsLoading(true);
    try {
      const { data: businessData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });

      if (businessData && businessData.length > 0) {
        setBusinesses(businessData);
        const primary = businessData.find(b => b.is_primary) || businessData[0];
        setActiveBusinessId(primary.id);

        const [tasksData, prefsData] = await Promise.all([
          loadFromSupabase(userId, primary.id, 'tasks'),
          loadFromSupabase(userId, null, 'preferences')
        ]);

        if (tasksData) setTasks(tasksData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const activeBusiness = businesses.find(b => b.id === activeBusinessId);
  
  const currentProfileData: ProfileData = impersonatedProfile || {
    user: { id: userId, firstName: '', lastName: '', email: userEmail, phone: '', role: 'Owner' },
    business: activeBusiness ? {
      ...activeBusiness,
      location: activeBusiness.city ? `${activeBusiness.city}, ${activeBusiness.state}` : '',
      isDnaApproved: activeBusiness.is_dna_approved,
      dnaLastUpdatedAt: activeBusiness.dna_last_updated_at,
    } : { 
      id: '', user_id: userId, business_name: '', industry: '', business_description: '', 
      business_website: '', location: '', service_area: '', phone: '', email: '', 
      city: '', state: '', dna: { logo: '', colors: [], fonts: '', style: '' }, 
      isDnaApproved: false, is_primary: true, is_complete: false, 
      created_at: '', updated_at: '', google_business_profile: null, brand_dna_profile: null,
      is_dna_approved: false
    },
    googleBusiness: activeBusiness?.google_business_profile || { profileName: '', mapsUrl: '', status: 'Not Created' },
    isProfileActive: activeBusiness?.is_complete || false,
    brandDnaProfile: activeBusiness?.brand_dna_profile || undefined,
  };

  const calculateScore = () => {
    let score = 0;
    if (currentProfileData.isProfileActive) score += 10;
    if (currentProfileData.business.isDnaApproved) score += 10;
    if (currentProfileData.googleBusiness.status === 'Verified') score += 15;
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    score += Math.min(completedTasks * 5, 50);
    
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    score += Math.min(inProgressTasks * 2, 10);
    
    if (tasks.length > 0 && completedTasks / tasks.length >= 0.25) score += 5;
    if (tasks.length === 0) score = Math.max(0, score - 10);
    
    return Math.min(score, 99);
  };

  useEffect(() => {
    setGrowthScore(calculateScore());
  }, [tasks, currentProfileData]);

  const addTasksToGrowthPlan = (newTasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => {
    const tasksWithMetadata: GrowthPlanTask[] = newTasks.map(task => ({
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      status: 'to_do',
      createdAt: new Date().toISOString(),
    }));
    const updatedTasks = [...tasks, ...tasksWithMetadata];
    setTasks(updatedTasks);
    if (activeBusinessId) {
      syncToSupabase(userId, activeBusinessId, 'tasks', updatedTasks);
    }
  };

  const handleTaskStatusChange = (taskId: string, newStatus: GrowthPlanTask['status']) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, completionDate: newStatus === 'completed' ? new Date().toISOString() : undefined } 
        : task
    );
    setTasks(updatedTasks);
    if (activeBusinessId) {
      syncToSupabase(userId, activeBusinessId, 'tasks', updatedTasks);
    }
  };

  const handleBusinessUpdate = () => {
    loadData();
  };

  const handleSwitchBusiness = (id: string) => {
    setActiveBusinessId(id);
    const business = businesses.find(b => b.id === id);
    if (business) {
      loadFromSupabase(userId, id, 'tasks').then(data => {
        if (data) setTasks(data);
        else setTasks([]);
      });
    }
  };

  const handleAddBusiness = () => {
    setActiveTool(ALL_TOOLS['businessdetails']);
  };

  const renderActiveTool = () => {
    const toolId = activeTool?.id || 'home';
    const readiness: ReadinessState = !currentProfileData.isProfileActive ? 'Setup Incomplete' : !currentProfileData.business.isDnaApproved ? 'Foundation Weak' : 'Foundation Ready';

    switch (toolId) {
      case 'home': return <Welcome setActiveTool={handleSetActiveTool} profileData={currentProfileData} readinessState={readiness} plan={{ name: 'Complete', profileLimit: 1 }} growthScore={growthScore} />;
      case 'jetbiz': return <JetBiz tool={ALL_TOOLS.jetbiz} addTasksToGrowthPlan={addTasksToGrowthPlan} onSaveAnalysis={(report) => {}} profileData={currentProfileData} setActiveTool={handleSetActiveTool} growthPlanTasks={tasks} onTaskStatusChange={handleTaskStatusChange} userId={userId} activeBusinessId={activeBusinessId} />;
      case 'jetviz': return <JetViz tool={ALL_TOOLS.jetviz} addTasksToGrowthPlan={addTasksToGrowthPlan} onSaveAnalysis={(report) => {}} profileData={currentProfileData} setActiveTool={handleSetActiveTool} growthPlanTasks={tasks} onTaskStatusChange={handleTaskStatusChange} userId={userId} activeBusinessId={activeBusinessId} />;
      case 'jetkeywords': return <JetKeywords tool={ALL_TOOLS.jetkeywords} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetcreate': return <JetCreate tool={ALL_TOOLS.jetcreate} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetpost': return <JetPost tool={ALL_TOOLS.jetpost} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetimage': return <JetImage tool={ALL_TOOLS.jetimage} profileData={currentProfileData} />;
      case 'jetcontent': return <JetContent tool={ALL_TOOLS.jetcontent} initialProps={null} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetreply': return <JetReply tool={ALL_TOOLS.jetreply} profileData={currentProfileData} readinessState={readiness} setActiveTool={handleSetActiveTool} />;
      case 'jettrust': return <JetTrust tool={ALL_TOOLS.jettrust} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetleads': return <JetLeads tool={ALL_TOOLS.jetleads} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetevents': return <JetEvents tool={ALL_TOOLS.jetevents} />;
      case 'jetads': return <JetAds tool={ALL_TOOLS.jetads} />;
      case 'jetcompete': return <JetCompete tool={ALL_TOOLS.jetcompete} addTasksToGrowthPlan={addTasksToGrowthPlan} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'growthplan': return <GrowthPlan tasks={tasks} setTasks={setTasks} setActiveTool={handleSetActiveTool} onTaskStatusChange={handleTaskStatusChange} growthScore={growthScore} userId={userId} activeBusinessId={activeBusinessId} />;
      case 'growthscore': return <GrowthScoreHistory growthScore={growthScore} profileData={currentProfileData} />;
      case 'businessdetails': return <BusinessDetails profileData={currentProfileData} onUpdate={() => {}} setActiveTool={handleSetActiveTool} onBusinessUpdated={handleBusinessUpdate} />;
      case 'planner': return <Planner userId={userId} growthPlanTasks={tasks} />;
      case 'knowledgebase': return <KnowledgeBase initialArticleId={kbArticleId} setActiveTool={handleSetActiveTool} />;
      case 'account': return <Account plan={{ name: 'Complete', profileLimit: 1 }} profileData={currentProfileData} onLogout={onLogout} onUpdateProfile={() => {}} userId={userId} setActiveTool={handleSetActiveTool} />;
      case 'support': return <UserSupportTickets />;
      default: return <Welcome setActiveTool={handleSetActiveTool} profileData={currentProfileData} readinessState={readiness} plan={{ name: 'Complete', profileLimit: 1 }} growthScore={growthScore} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-dark">
        <Loader />
      </div>
    );
  }

  const isAdmin = userEmail === ADMIN_EMAIL;

  return (
    <div className="flex h-screen bg-brand-light overflow-hidden">
      <Sidebar 
        activeTool={activeTool} 
        setActiveTool={handleSetActiveTool} 
        isAdmin={isAdmin} 
        onLogout={onLogout} 
        toolCompletionStatus={{}} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          activeTool={activeTool} 
          growthScore={growthScore} 
          businesses={businesses}
          activeBusinessId={activeBusinessId}
          onSwitchBusiness={handleSwitchBusiness}
          onAddBusiness={handleAddBusiness}
          setActiveTool={handleSetActiveTool}
        />
        <main className="flex-1 overflow-y-auto bg-brand-light p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveTool()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default InternalApp;
export type { InternalAppProps };