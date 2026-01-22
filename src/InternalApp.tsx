import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toaster, toast } from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Welcome } from './tools/Welcome';
import { BusinessDetails } from '../tools/BusinessDetails';
import { JetBiz } from '../tools/JetBiz';
import { JetViz } from '../tools/JetViz';
import { JetKeywords } from '../tools/JetKeywords';
import { JetCompete } from '../tools/JetCompete';
import { JetCreate } from '../tools/JetCreate';
import { JetSocial } from '../tools/JetSocial';
import { JetImage } from '../tools/JetImage';
import { JetContent } from '../tools/JetContent';
import { JetReply } from '../tools/JetReply';
import { JetTrust } from '../tools/JetTrust';
import { JetLeads } from '../tools/JetLeads';
import { JetEvents } from '../tools/JetEvents';
import { JetAds } from '../tools/JetAds';
import { JetProduct } from '../tools/JetProduct';
import { GrowthPlan } from '../tools/GrowthPlan';
import { KnowledgeBase } from '../tools/KnowledgeBase';
import { Account } from '../tools/Account';
import { AdminPanel } from '../tools/AdminPanel';
import { Planner } from '../tools/Planner';
import UserSupportTickets from '../tools/UserSupportTickets'; 
import { GrowthScoreHistory } from '../tools/profile/GrowthScoreHistory';
import { AskBorisPage } from '../tools/AskBoris';
import type { Tool, GrowthPlanTask, ProfileData, ReadinessState, AuditReport, LiveWebsiteAnalysis } from '../types';
import { syncToSupabase, loadFromSupabase } from '../utils/syncService';
import { getSupabaseClient } from '../integrations/supabase/client';
import { checkForNewReviews, generateBorisReplies, postBorisReplies, getBorisReplyConfirmation } from '../services/borisService';
import { ALL_TOOLS } from '../constants';
import { Confetti } from './components/Confetti';

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
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([]);
  const [reviewResponseRate, setReviewResponseRate] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Boris-related state
  const [hasNewReviews, setHasNewReviews] = useState(false);
  const [newReviewsCount, setNewReviewCount] = useState(0);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  const supabase = getSupabaseClient();
  const isAdmin = userEmail === ADMIN_EMAIL;

  const fetchAllProfiles = async () => {
    if (userEmail !== ADMIN_EMAIL) return;
    try {
      const response = await fetch('/api/admin/get-all-profiles', {
        headers: { 'x-user-email': userEmail }
      });
      if (response.ok) {
        const data = await response.json();
        setAllProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error('Failed to fetch master profile list:', error);
    }
  };

  const checkReviews = async () => {
    if (!currentProfileData?.business?.id) return;
    const result = await checkForNewReviews(userId, currentProfileData.business.id);
    setHasNewReviews(result.hasNewReviews);
    setNewReviewCount(result.count);
    setPendingReviews(result.reviews);
  };

  useEffect(() => {
    if (currentProfileData) {
      checkReviews();
      const interval = setInterval(checkReviews, 300000); // Every 5 min
      return () => clearInterval(interval);
    }
  }, [currentProfileData]);

  const handleReplyToReviews = async () => {
    if (pendingReviews.length === 0 || !currentProfileData) return;
    const loadingToast = toast.loading('Boris is crafting replies...');
    try {
      const replyResult = await generateBorisReplies(pendingReviews, currentProfileData.business.business_name);
      if (!replyResult.success) throw new Error(replyResult.error);
      const postResult = await postBorisReplies(replyResult.replies, currentProfileData.business.id);
      toast.dismiss(loadingToast);
      if (postResult.success) {
        toast.success(getBorisReplyConfirmation(postResult.posted, currentProfileData.business.business_name));
        await checkReviews();
      } else {
        toast.error(`Posted ${postResult.posted} replies, ${postResult.failed} failed`);
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to reply to reviews');
      console.error('[Boris] Review reply error:', error);
    }
  };

  const loadData = useCallback(async (isInitial = false) => {
    if (!supabase || !userId) return;
    
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsBackgroundLoading(true);
    }

    try {
      const { data: businessList } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });

      if (businessList && businessList.length > 0) {
        setBusinesses(businessList);
        const activeBiz = businessList.find(b => b.id === activeBusinessId) || businessList[0];
        
        if (activeBiz.id !== activeBusinessId) {
          setActiveBusinessId(activeBiz.id);
        }

        const locationStr = activeBiz.city && activeBiz.state 
          ? `${activeBiz.city}, ${activeBiz.state}` 
          : activeBiz.city || activeBiz.state || '';

        const profile: ProfileData = {
          user: { id: userId, firstName: '', lastName: '', email: userEmail, phone: '', role: 'Owner' },
          business: {
            ...activeBiz,
            location: locationStr,
            isDnaApproved: activeBiz.is_dna_approved,
          },
          googleBusiness: activeBiz.google_business_profile || { profileName: '', mapsUrl: '', status: 'Not Created' },
          isProfileActive: activeBiz.is_complete,
          brandDnaProfile: activeBiz.brand_dna_profile
        };
        setCurrentProfileData(profile);

        const savedTasks = await loadFromSupabase(userId, activeBiz.id, 'tasks');
        if (savedTasks) {
          setTasks(savedTasks);
        }
      }

      if (userEmail === ADMIN_EMAIL && (isInitial || activeTool?.id === 'adminpanel')) {
        await fetchAllProfiles();
      }
    } catch (error) {
      console.error('Error loading app data:', error);
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
      setIsBackgroundLoading(false);
    }
  }, [supabase, userId, activeBusinessId, userEmail, activeTool?.id]);

  useEffect(() => {
    loadData(true);
  }, [userId]);

  const handleSetActiveTool = (tool: Tool | null, articleId?: string) => {
    setActiveTool(tool);
    setKbArticleId(articleId || null);
    
    if (!tool || tool.id === 'growthplan' || tool.id === 'home') {
      loadData(false);
    }
    
    if (tool?.id === 'growthplan' && userId && activeBusinessId) {
      loadFromSupabase(userId, activeBusinessId, 'tasks')
        .then(savedTasks => {
          if (savedTasks && Array.isArray(savedTasks)) {
            console.log('✅ [Navigation] Loaded tasks for Growth Plan:', savedTasks.length);
            setTasks(savedTasks);
          }
        })
        .catch(err => console.error('❌ [Navigation] Failed to load tasks:', err));
    }
  };

  const addTasksToGrowthPlan = async (newTasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => {
    if (!activeBusinessId) {
      alert('Please select a business first');
      console.error('[InternalApp] Cannot save tasks: No business selected');
      return tasks;
    }
    
    if (newTasks.length === 0) return tasks;

    const sourceModule = newTasks[0].sourceModule;
    
    try {
        const currentTasks = await loadFromSupabase(userId, activeBusinessId, 'tasks') || [];

        const tasksWithMetadata: GrowthPlanTask[] = newTasks.map(task => ({
            ...task,
            id: uuidv4(),
            priority: task.priority || 'Medium',
            status: 'to_do' as const,
            createdAt: new Date().toISOString(),
        }));

        const otherTasks = currentTasks.filter((t: GrowthPlanTask) => t.sourceModule !== sourceModule);
        const updatedTasks = [...otherTasks, ...tasksWithMetadata];

        console.log(`💾 [InternalApp] Saving ${updatedTasks.length} tasks to Supabase...`);
        await syncToSupabase(userId, activeBusinessId, 'tasks', updatedTasks);
        console.log('✅ [InternalApp] Tasks successfully saved.');

        setTasks(updatedTasks);
        return updatedTasks;

    } catch (error) {
        console.error('❌ [InternalApp] Failed to add and save tasks:', error);
        return tasks;
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: GrowthPlanTask['status']) => {
    if (!activeBusinessId) {
      alert('Please select a business first');
      console.error('[InternalApp] Cannot update task status: No business selected');
      return;
    }
    
    const updatedTasks = tasks.map(task => 
      task.id === taskId
        ? { ...task, status: newStatus, completionDate: newStatus === 'completed' ? new Date().toISOString() : undefined } 
        : task
    );
    setTasks(updatedTasks);
    
    if (newStatus === 'completed') {
        setShowConfetti(true);
    }
    
    if (activeBusinessId) {
      try {
        await syncToSupabase(userId, activeBusinessId, 'tasks', updatedTasks);
      } catch (error) {
        console.error('❌ [InternalApp] Failed to save task status:', error);
      }
    }
  };

  const handleSaveAnalysis = async (report: AuditReport | LiveWebsiteAnalysis | null, toolId: 'jetbiz' | 'jetviz') => {
    if (report && activeBusinessId && supabase) {
        try {
            await syncToSupabase(userId, activeBusinessId, toolId, report);
            
            const { data: currentProfile } = await supabase
              .from('business_profiles')
              .select('audits')
              .eq('id', activeBusinessId)
              .single();

            const updatedAudits = {
              ...(currentProfile?.audits || {}),
              [toolId]: {
                completed: true,
                completedAt: new Date().toISOString(),
                lastRun: new Date().toISOString()
              }
            };

            await supabase
              .from('business_profiles')
              .update({ audits: updatedAudits })
              .eq('id', activeBusinessId);

            console.log(`[${toolId}] Audit completion flag set:`, updatedAudits);

            setCurrentProfileData(prev => {
                if (!prev) return null;
                const updatedBusiness = {
                    ...prev.business,
                    audits: updatedAudits
                };
                return {
                    ...prev,
                    business: updatedBusiness,
                    [`${toolId}Analysis`]: report
                };
            });
        } catch (error) {
            console.error(`Failed to save ${toolId} analysis:`, error);
        }
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
        return <BusinessDetails isAdmin={isAdmin} profileData={currentProfileData} onUpdate={setCurrentProfileData} setActiveTool={handleSetActiveTool} onBusinessUpdated={() => loadData(false)} />;
      case 'jetbiz':
        return <JetBiz tool={{ id: 'jetbiz', name: 'JetBiz', category: 'analyze' }} addTasksToGrowthPlan={addTasksToGrowthPlan} onSaveAnalysis={(report) => handleSaveAnalysis(report, 'jetbiz')} profileData={currentProfileData} setActiveTool={handleSetActiveTool} growthPlanTasks={tasks} onTaskStatusChange={handleTaskStatusChange} userId={userId} activeBusinessId={activeBusinessId} />;
      case 'jetviz':
        return <JetViz tool={{ id: 'jetviz', name: 'JetViz', category: 'analyze' }} addTasksToGrowthPlan={addTasksToGrowthPlan} onSaveAnalysis={(report) => handleSaveAnalysis(report, 'jetviz')} profileData={currentProfileData} setActiveTool={handleSetActiveTool} growthPlanTasks={tasks} onTaskStatusChange={handleTaskStatusChange} userId={userId} activeBusinessId={activeBusinessId} />;
      case 'jetkeywords':
        return <JetKeywords tool={{ id: 'jetkeywords', name: 'JetKeywords', category: 'analyze' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetcompete':
        return <JetCompete tool={{ id: 'jetcompete', name: 'JetCompete', category: 'analyze' }} addTasksToGrowthPlan={addTasksToGrowthPlan} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetcreate':
        return <JetCreate tool={{ id: 'jetcreate', name: 'JetCreate', category: 'create' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetsocial':
        return <JetSocial tool={{ id: 'jetsocial', name: 'JetSocial', category: 'create' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetimage':
        return <JetImage tool={{ id: 'jetimage', name: 'JetImage', category: 'create' }} profileData={currentProfileData} />;
      case 'jetproduct':
        return <JetProduct tool={{ id: 'jetproduct', name: 'JetProduct', category: 'create' }} profileData={currentProfileData} />;
      case 'jetcontent':
        return <JetContent tool={{ id: 'jetcontent', name: 'JetContent', category: 'create' }} initialProps={null} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetreply':
        return <JetReply tool={{ id: 'jetreply', name: 'JetReply', category: 'engage' }} profileData={currentProfileData} readinessState={readiness} setActiveTool={handleSetActiveTool} />;
      case 'jettrust':
        return <JetTrust tool={{ id: 'jettrust', name: 'JetTrust', category: 'engage' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetleads':
        return <JetLeads tool={{ id: 'jetleads', name: 'JetLeads', category: 'engage' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetevents':
        return <JetEvents tool={{ id: 'jetevents', name: 'JetEvents', category: 'engage' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'jetads':
        return <JetAds tool={{ id: 'jetads', name: 'JetAds', category: 'engage' }} profileData={currentProfileData} setActiveTool={handleSetActiveTool} />;
      case 'growthplan':
        return <GrowthPlan tasks={tasks} setTasks={setTasks} setActiveTool={handleSetActiveTool} onTaskStatusChange={handleTaskStatusChange} growthScore={calculateGrowthScore()} userId={userId} activeBusinessId={activeBusinessId} />;
      case 'planner':
        return <Planner userId={userId} growthPlanTasks={tasks} />;
      case 'growthscore':
        return <GrowthScoreHistory growthScore={calculateGrowthScore()} profileData={currentProfileData} />;
      case 'knowledgebase':
        return <KnowledgeBase initialArticleId={kbArticleId} setActiveTool={handleSetActiveTool} />;
      case 'account':
        return <Account plan={{ name: 'Pro', profileLimit: 1 }} profileData={currentProfileData} onLogout={onLogout} onUpdateProfile={setCurrentProfileData} userId={userId} setActiveTool={handleSetActiveTool} />;
      case 'adminpanel':
        return <AdminPanel 
          allProfiles={allProfiles} 
          setAllProfiles={setAllProfiles} 
          currentUserProfile={currentProfileData} 
          setCurrentUserProfile={setCurrentProfileData}
          onImpersonate={() => {}} 
          onDataChange={() => loadData(false)} 
        />;
      case 'support':
        return <UserSupportTickets />;
      case 'ask-boris':
        return <AskBorisPage
          userFirstName={currentProfileData.user.firstName || 'there'}
          profileData={currentProfileData}
          growthPlanTasks={tasks}
          hasNewReviews={hasNewReviews}
          newReviewsCount={newReviewsCount}
          onNavigate={(toolId) => {
            const tool = ALL_TOOLS[toolId];
            if (tool) handleSetActiveTool(tool);
          }}
          onReplyToReviews={handleReplyToReviews}
        />;
      default:
        return (
            <>
                {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
                <Welcome 
                  setActiveTool={handleSetActiveTool} 
                  profileData={currentProfileData} 
                  readinessState={getReadiness()} 
                  plan={{ name: 'Pro', profileLimit: 1 }} 
                  growthScore={calculateGrowthScore()} 
                  pendingTasksCount={pendingTasksCount}
                  reviewResponseRate={reviewResponseRate}
                  tasks={tasks}
                  hasNewReviews={hasNewReviews}
                  newReviewsCount={newReviewsCount}
                  onReplyToReviews={handleReplyToReviews}
                  onTaskStatusChange={handleTaskStatusChange as any}
                />
            </>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-light overflow-hidden">
      <Toaster position="top-center" />
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
          onSwitchBusiness={(id) => {
            setActiveBusinessId(id);
            loadData(false);
          }}
          onAddBusiness={() => handleSetActiveTool({ id: 'businessdetails', name: 'Business Details', category: 'foundation' })}
          setActiveTool={handleSetActiveTool}
          userId={userId}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-brand-light relative">
          {isBackgroundLoading && (
            <div className="absolute top-4 right-4 z-50">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-purple"></div>
            </div>
          )}
          {renderActiveTool()}
        </main>
      </div>
    </div>
  );
};

export default InternalApp;