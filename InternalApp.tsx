import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Welcome } from './tools/Welcome';
import { BusinessDetails } from './tools/BusinessDetails';
import { JetBiz } from './tools/JetBiz';
import { JetViz } from './tools/JetViz';
import { JetKeywords } from './tools/JetKeywords';
import { JetCompete } from './tools/JetCompete';
import { JetCreate } from './tools/JetCreate';
import { JetPost } from './tools/JetPost';
import { JetContent } from './tools/JetContent';
import { JetImage } from './tools/JetImage';
import { JetReply } from './tools/JetReply';
import { JetTrust } from './tools/JetTrust';
import { JetLeads } from './tools/JetLeads';
import { JetEvents } from './tools/JetEvents';
import { JetAds } from './tools/JetAds';
import { GrowthPlan } from './tools/GrowthPlan';
import { KnowledgeBase } from './tools/KnowledgeBase';
import { Account } from './tools/Account';
import { AdminPanel } from './tools/AdminPanel';
import { Planner } from './tools/Planner';
import { GrowthScoreHistory } from './tools/profile/GrowthScoreHistory';
import type { Tool, GrowthPlanTask, ProfileData, ReadinessState } from './types';
import { syncToSupabase, loadFromSupabase } from './utils/syncService';
import { getSupabaseClient } from './integrations/supabase/client';

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';

interface InternalAppProps {
  onLogout: () => void;
  userEmail: string;
  userId: string;
}

const InternalApp: React.FC<InternalAppProps> = ({ onLogout, userEmail, userId }) => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [kbArticleId, setKbArticleId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<GrowthPlanTask[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [currentProfileData, setCurrentProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([]);
  const [reviewResponseRate, setReviewResponseRate] = useState(0);

  const supabase = getSupabaseClient();

  const loadData = async () => {
    if (!supabase || !userId) return;
    setIsLoading(true);

    try {
      const { data: businessList } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });

      if (businessList && businessList.length > 0) {
        setBusinesses(businessList);
        const activeBiz = businessList.find(b => b.id === activeBusinessId) || businessList[0];
        setActiveBusinessId(activeBiz.id);

        const profile: ProfileData = {
          user: { id: userId, firstName: '', lastName: '', email: userEmail, phone: '', role: 'Owner' },
          business: {
            ...activeBiz,
            isDnaApproved: activeBiz.is_dna_approved,
          },
          googleBusiness: activeBiz.google_business_profile || { profileName: '', mapsUrl: '', status: 'Not Created' },
          isProfileActive: activeBiz.is_complete,
          brandDnaProfile: activeBiz.brand_dna_profile
        };
        setCurrentProfileData(profile);

        const { data: reviews } = await supabase
          .from('business_reviews')
          .select('ai_response_sent')
          .eq('business_id', activeBiz.id);
        
        if (reviews && reviews.length > 0) {
          const responded = reviews.filter(r => r.ai_response_sent).length;
          setReviewResponseRate(Math.round((responded / reviews.length) * 100));
        }

        const savedTasks = await loadFromSupabase(userId, activeBiz.id, 'tasks');
        if (savedTasks) {
          setTasks(savedTasks);
        }
      }
    } catch (error) {
      console.error('Error loading app data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleSetActiveTool = (tool: Tool | null, articleId?: string) => {
    setActiveTool(tool);
    setKbArticleId(articleId || null);
    
    if (!tool || tool.id === 'growthplan' || tool.id === 'home') {
        loadData();
    }
  };

  const addTasksAndSave = async (newTasks: any[]) => {
    const tasksWithMetadata = newTasks.map(t => ({
      ...t,
      id: uuidv4(),
      status: 'to_do' as const,
      createdAt: new Date().toISOString()
    }));
    
    const updatedTasks = [...tasks, ...tasksWithMetadata];
    setTasks(updatedTasks);
    
    if (userId && activeBusinessId) {
        console.log('[InternalApp] Auto-saving tasks to Supabase...');
        await syncToSupabase(userId, activeBusinessId, 'tasks', updatedTasks);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: GrowthPlanTask['status']) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status, completionDate: status === 'completed' ? new Date().toISOString() : undefined } : t);
    setTasks(updatedTasks);
    if (userId && activeBusinessId) {
        await syncToSupabase(userId, activeBusinessId, 'tasks', updatedTasks);
    }
  };

  const calculateGrowthScore = () => {
    if (!currentProfileData) return 0;
    let score = 0;
    if (currentProfileData.business.is_complete) score += 10;
    if (currentProfileData.business.isDnaApproved) score += 10;
    if (currentProfileData.googleBusiness.status === 'Verified') score += 15;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    score += Math.min(completedCount * 5, 50);
    return Math.min(score, 99);
  };

  const getReadiness = (): ReadinessState => {
    if (!currentProfileData?.business.is_complete) return 'Setup Incomplete';
    if (!currentProfileData?.business.isDnaApproved) return 'Foundation Weak';
    return 'Foundation Ready';
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  const renderActiveTool = () => {
    if (!currentProfileData) return null;
    const readiness = getReadiness();

    switch (activeTool?.id) {
      case 'businessdetails':
        return <BusinessDetails profileData={currentProfileData} onUpdate={setCurrentProfileData} setActiveTool={handleSetActiveTool} onBusinessUpdated={loadData} />;
      case 'jetbiz':
        return <JetBiz tool={{ id: 'jetbiz', name: 'JetBiz', category: 'analyze' }} addTasksToGrowthPlan={addTasksAndSave} onSaveAnalysis={() => {}} profileData={currentProfileData} setActiveTool={handleSetActiveTool} growthPlanTasks={tasks} onTaskStatusChange={handleTaskStatusChange} userId={userId} activeBusinessId={activeBusinessId} />;
      case 'jetviz':
        return <JetViz tool={{ id: 'jetviz', name: 'JetViz', category: 'analyze' }} addTasksToGrowthPlan={addTasksAndSave} onSaveAnalysis={() => {}} profileData={currentProfileData} setActiveTool={handleSetActiveTool} growthPlanTasks={tasks} onTaskStatusChange={handleTaskStatusChange} userId={userId} activeBusinessId={activeBusinessId} />;
      case 'jetkeywords':
        return <JetKeywords tool={{ id: 'jetkeywords', name: 'JetKeywords', category: 'analyze' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetcreate':
        return <JetCreate tool={{ id: 'jetcreate', name: 'JetCreate', category: 'create' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetpost':
        return <JetPost tool={{ id: 'jetpost', name: 'JetPost', category: 'create' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetimage':
        return <JetImage tool={{ id: 'jetimage', name: 'JetImage', category: 'create' }} profileData={currentProfileData} />;
      case 'jetcontent':
        return <JetContent tool={{ id: 'jetcontent', name: 'JetContent', category: 'create' }} initialProps={null} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetreply':
        return <JetReply tool={{ id: 'jetreply', name: 'JetReply', category: 'engage' }} profileData={currentProfileData} readinessState={readiness} setActiveTool={handleSetActiveTool} />;
      case 'jettrust':
        return <JetTrust tool={{ id: 'jettrust', name: 'JetTrust', category: 'engage' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetleads':
        return <JetLeads tool={{ id: 'jetleads', name: 'JetLeads', category: 'engage' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetevents':
        return <JetEvents tool={{ id: 'jetevents', name: 'JetEvents', category: 'engage' }} />;
      case 'jetcompete':
        return <JetCompete tool={{ id: 'jetcompete', name: 'JetCompete', category: 'analyze' }} addTasksToGrowthPlan={addTasksAndSave} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'growthplan':
        return <GrowthPlan tasks={tasks} setTasks={setTasks} setActiveTool={handleSetActiveTool} onTaskStatusChange={handleTaskStatusChange} growthScore={calculateGrowthScore()} userId={userId} activeBusinessId={activeBusinessId} onPlanSaved={loadData} />;
      case 'planner':
        return <Planner userId={userId} growthPlanTasks={tasks} />;
      case 'growthscore':
        return <GrowthScoreHistory growthScore={calculateGrowthScore()} profileData={currentProfileData} />;
      case 'knowledgebase':
        return <KnowledgeBase initialArticleId={kbArticleId} setActiveTool={handleSetActiveTool} />;
      case 'account':
        return <Account plan={{ name: 'Pro', profileLimit: 1 }} profileData={currentProfileData} onLogout={onLogout} onUpdateProfile={setCurrentProfileData} userId={userId} setActiveTool={handleSetActiveTool} />;
      case 'adminpanel':
        return <AdminPanel allProfiles={allProfiles} setAllProfiles={setAllProfiles} currentUserProfile={currentProfileData} setCurrentUserProfile={setCurrentUserProfile} onImpersonate={() => {}} onDataChange={loadData} />;
      default:
        return <Welcome 
          setActiveTool={handleSetActiveTool} 
          profileData={currentProfileData} 
          readinessState={readiness} 
          plan={{ name: 'Pro', profileLimit: 1 }} 
          growthScore={calculateGrowthScore()} 
          pendingTasksCount={pendingTasksCount}
          reviewResponseRate={reviewResponseRate} 
        />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-light overflow-hidden">
      <Sidebar
        activeTool={activeTool}
        setActiveTool={handleSetActiveTool}
        isAdmin={userEmail === ADMIN_EMAIL}
        onLogout={onLogout}
        toolCompletionStatus={{}}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          activeTool={activeTool}
          growthScore={calculateGrowthScore()}
          businesses={businesses}
          activeBusinessId={activeBusinessId}
          onSwitchBusiness={setActiveBusinessId}
          onAddBusiness={() => handleSetActiveTool({ id: 'businessdetails', name: 'Business Details', category: 'foundation' })}
          setActiveTool={handleSetActiveTool}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-brand-light">
          {renderActiveTool()}
        </main>
      </div>
    </div>
  );
};

export default InternalApp;