import React, { useState, useEffect } from 'react';
import { InternalApp } from './InternalApp';
import { MarketingWebsite } from './pages/MarketingWebsite';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { OnboardingPage } from './pages/OnboardingPage';
import { SubscriptionGuard } from './components/SubscriptionGuard';
import { checkSubscriptionAccess } from './services/subscriptionService';
import { fetchRealDateTime } from './utils/realTime';
import { getSupabaseClient } from './integrations/supabase/client';
import { syncToSupabase, loadFromSupabase } from './utils/syncService'; // Import sync utilities
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Welcome } from './tools/Welcome';
import { BusinessDetails } from './tools/BusinessDetails';
import { GrowthScoreHistory } from './tools/profile/GrowthScoreHistory';
import { Account } from './tools/Account';
import { KnowledgeBase } from './tools/KnowledgeBase';
import { JetBiz } from './tools/JetBiz';
import { JetViz } from './tools/JetViz';
import { JetCompete } from './tools/JetCompete';
import { JetKeywords } from './tools/JetKeywords';
import { JetPost } from './tools/JetPost';
import { JetContent } from './tools/JetContent';
import { JetImage } from './tools/JetImage';
import { JetCreate } from './tools/JetCreate';
import { JetReply } from './tools/JetReply';
import { JetTrust } from './tools/JetTrust';
import { JetLeads } from './tools/JetLeads';
import { JetEvents } from './tools/JetEvents';
import { JetAds } from './tools/JetAds';
import { GrowthPlan } from './tools/GrowthPlan';
import UserSupportTickets from './tools/UserSupportTickets';
import { AdminPanel } from './tools/AdminPanel';
import { Planner } from './tools/Planner';
import { BusinessProfile, ProfileData, GrowthPlanTask, SavedKeyword, KeywordData, AuditReport, LiveWebsiteAnalysis, Tool, ReadinessState } from './types';
import { ALL_TOOLS } from './constants';
import { EyeIcon } from './components/icons/MiniIcons';
import SupportChatbot from './components/SupportChatbot';

// Fetch real current time on app load (with timeout to prevent hanging)
if (typeof window !== 'undefined') {
  const initRealTime = async () => {
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 2000)
      );
      await Promise.race([fetchRealDateTime(), timeout]);
      console.log('✅ Real date/time initialized');
    } catch (error) {
      console.warn('⚠️ Could not fetch real time, using system time');
    }
  };
  initRealTime();
}

console.log('[App] Component module loaded');

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';

interface InternalAppProps {
    onLogout: () => void;
    userEmail: string;
    userId: string;
}

const createInitialProfile = (id: string, email: string, firstName: string, lastName: string): ProfileData => ({
    user: { id, firstName, lastName, email, phone: '', role: 'Owner' },
    business: { 
      id: 'temp-biz-id', 
      user_id: id,
      business_name: '', 
      industry: '', 
      business_description: '', 
      business_website: '', 
      location: '', 
      service_area: '', 
      phone: '', 
      email: '', 
      city: '',
      state: '',
      dna: { logo: '', colors: [], fonts: '', style: '' }, 
      isDnaApproved: false, 
      dnaLastUpdatedAt: undefined,
      is_primary: true,
      is_complete: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    googleBusiness: { profileName: '', mapsUrl: '', status: 'Not Created' },
    isProfileActive: false,
    brandDnaProfile: undefined,
});

export const InternalApp: React.FC<InternalAppProps> = ({ onLogout, userEmail, userId }) => {
  const [activeTool, setActiveToolState] = useState<Tool | null>(null);
  const [activeKbArticle, setActiveKbArticle] = useState<string | null>(null);
  
  const supabase = getSupabaseClient();

  // --- Multi-Business Management ---
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(
    localStorage.getItem('jetsuite_active_biz_id')
  );

  // --- Identity & State Management ---
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const activeUserId = impersonatedUserId || userId;

  const [growthPlanTasks, setGrowthPlanTasks] = useState<GrowthPlanTask[]>([]);
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>([]);
  const [jetContentInitialProps, setJetContentInitialProps] = useState<{keyword: KeywordData, type: string} | null>(null);
  
  const [growthScore, setGrowthScore] = useState(150);
  
  // Initialize allProfiles with default structure
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>(() => {
      const adminProfile = createInitialProfile(userId, userEmail, 'The Ivsight', 'Company');
      const testProfile = createInitialProfile('test-user-uuid', 'test.user@example.com', 'Test', 'User');
      return [adminProfile, testProfile];
  });

  // UNIVERSAL LOAD FUNCTION - Loads ALL data from Supabase
  const loadBusinessData = async (businessId: string) => {
    if (!supabase || !activeUserId) return;
    
    try {
      // 1. Load business profile details
      const { data: profile, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();
      
      if (profileError) throw profileError;
      
      // 2. Update the active profile data
      setAllProfiles(prev => {
        const updated = [...prev];
        const index = updated.findIndex(p => p.user.id === activeUserId);
        if (index !== -1) {
          const syncedProfile = {
            ...updated[index],
            business: {
              ...profile,
              location: `${profile.city}, ${profile.state}`,
              isDnaApproved: profile.is_dna_approved,
              dnaLastUpdatedAt: profile.dna_last_updated_at,
            } as BusinessProfile,
            isProfileActive: !!profile.is_complete,
          };
          updated[index] = syncedProfile;
        }
        return updated;
      });
      
      // 3. Load tasks from Supabase
      const tasks = await loadFromSupabase(activeUserId, businessId, 'tasks');
      setGrowthPlanTasks(tasks || []);
      
      // 4. Load keywords from Supabase
      const keywords = await loadFromSupabase(activeUserId, businessId, 'keywords');
      setSavedKeywords(keywords || []);
      
      // 5. Load JetBiz report
      const jetbizReport = await loadFromSupabase(activeUserId, businessId, 'jetbiz');
      if (jetbizReport) {
        setAllProfiles(prev => {
          const updated = [...prev];
          const index = updated.findIndex(p => p.user.id === activeUserId);
          if (index !== -1) {
            updated[index] = { ...updated[index], jetbizAnalysis: jetbizReport };
          }
          return updated;
        });
      }
      
      // 6. Load JetViz report
      const jetvizReport = await loadFromSupabase(activeUserId, businessId, 'jetviz');
      if (jetvizReport) {
        setAllProfiles(prev => {
          const updated = [...prev];
          const index = updated.findIndex(p => p.user.id === activeUserId);
          if (index !== -1) {
            updated[index] = { ...updated[index], jetvizAnalysis: jetvizReport };
          }
          return updated;
        });
      }
      
      console.log('✅ All business data loaded from Supabase');
      
    } catch (error) {
      console.error('Error loading business data:', error);
      setSavedKeywords([]);
      setGrowthPlanTasks([]);
    }
  };

  // Function to fetch profile from DB
  const fetchAndMergeProfile = async (uid: string, email: string, isCurrentUser: boolean) => {
    let defaultProfile: ProfileData;
    defaultProfile = createInitialProfile(uid, email, isCurrentUser ? 'Owner' : 'Test', isCurrentUser ? 'User' : 'User');

    try {
        const response = await fetch(`/api/user/get-profile?userId=${uid}`);
        if (!response.ok) throw new Error('Failed to fetch profile from API');
        
        const { profile: dbProfile } = await response.json();
        
        let mergedProfile = defaultProfile;
        
        if (dbProfile) {
            mergedProfile = {
                ...defaultProfile,
                user: {
                    ...defaultProfile.user,
                    id: dbProfile.id,
                    firstName: dbProfile.first_name || defaultProfile.user.firstName,
                    lastName: dbProfile.last_name || defaultProfile.user.lastName,
                    email: dbProfile.email || defaultProfile.user.email,
                    role: dbProfile.role || defaultProfile.user.role,
                    phone: dbProfile.phone || defaultProfile.user.phone,
                }
            };
        }
        
        return mergedProfile;

    } catch (error) {
        console.error(`Error fetching profile for ${uid}:`, error);
        return defaultProfile;
    }
  };

  // Initial Profile Load
  useEffect(() => {
    const loadProfiles = async () => {
        const currentUserProfile = await fetchAndMergeProfile(userId, userEmail, true);
        const testUserEmail = 'test.user@example.com';
        const testUserId = 'test-user-uuid';
        const testUserProfile = await fetchAndMergeProfile(testUserId, testUserEmail, false);
        
        setAllProfiles([currentUserProfile, testUserProfile]);
    };
    
    loadProfiles();
  }, [userId, userEmail]);

  // Fetch all accessible businesses
  const fetchBusinesses = async () => {
    if (!supabase || !activeUserId) return;

    console.log('[InternalApp] Fetching businesses for active user:', activeUserId);

    const { data: dbProfiles, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', activeUserId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[InternalApp] Error fetching businesses:', error);
      return;
    }

    if (dbProfiles && dbProfiles.length > 0) {
      console.log('[InternalApp] Loaded businesses:', dbProfiles);
      
      const mappedBusinesses = dbProfiles.map(p => ({
          ...p,
          location: `${p.city}, ${p.state}`,
          isDnaApproved: p.is_dna_approved,
          dnaLastUpdatedAt: p.dna_last_updated_at,
      })) as BusinessProfile[];
      
      setBusinesses(mappedBusinesses);
      
      const savedActiveId = localStorage.getItem('jetsuite_active_biz_id');
      const primaryBusiness = mappedBusinesses.find(b => b.is_primary) || mappedBusinesses[0];
      
      const activeId = savedActiveId && mappedBusinesses.some(b => b.id === savedActiveId)
        ? savedActiveId
        : primaryBusiness.id;
      
      if (activeId) {
        console.log('[InternalApp] Setting active business ID:', activeId);
        setActiveBusinessId(activeId);
        localStorage.setItem('jetsuite_active_biz_id', activeId);
        loadBusinessData(activeId);
      }
    } else {
      console.log('[InternalApp] No businesses found');
      setActiveBusinessId(null);
      setBusinesses([]);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [activeUserId, supabase]);

  // Business Switching
  const handleBusinessSwitch = async (businessId: string) => {
    if (activeBusinessId === businessId) return;
    
    localStorage.setItem('jetsuite_active_biz_id', businessId);
    setActiveBusinessId(businessId);
    await loadBusinessData(businessId);
    
    setSavedKeywords([]);
    setGrowthPlanTasks([]);
    setJetContentInitialProps(null);
  };
  
  // Add New Business
  const handleAddBusiness = async () => {
    if (!supabase || !activeUserId) return;
    
    const { data: billingAccount } = await supabase
      .from('billing_accounts')
      .select('business_count')
      .eq('user_id', activeUserId)
      .maybeSingle();
    
    const limit = billingAccount?.business_count || 1;
    
    if (businesses.length >= limit) {
      alert(`You have reached your business limit (${limit}). Please upgrade your plan to add more businesses.`);
      return;
    }
    
    try {
      const { data: newBusiness, error } = await supabase
        .from('business_profiles')
        .insert({
          user_id: activeUserId,
          business_name: 'New Business Profile',
          business_website: 'https://new-business.com',
          industry: 'General',
          city: 'City',
          state: 'State',
          is_primary: false,
          is_complete: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (newBusiness) {
        setBusinesses(prev => [...prev, newBusiness as BusinessProfile]);
        handleBusinessSwitch(newBusiness.id);
        setActiveTool(ALL_TOOLS['businessdetails']);
      }
    } catch (error) {
      console.error('Error creating business:', error);
      alert('Failed to create new business. Please try again.');
    }
  };

  const isAdmin = userEmail === ADMIN_EMAIL;
  const profileData = impersonatedUserId === 'test-user-uuid' ? allProfiles[1] : allProfiles[0];
  
  // Ensure profileData reflects the active business
  useEffect(() => {
    if (activeBusinessId && businesses.length > 0) {
      const activeBiz = businesses.find(b => b.id === activeBusinessId);
      if (activeBiz) {
        setAllProfiles(prev => {
          const updated = [...prev];
          const index = updated.findIndex(p => p.user.id === activeUserId);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              business: activeBiz,
              isProfileActive: !!activeBiz.is_complete,
            };
          }
          return updated;
        });
      }
    }
  }, [activeBusinessId, businesses, activeUserId]);

  const setProfileData = (newProfileData: ProfileData, persist: boolean = false) => {
    setAllProfiles(prev => {
        const isSelf = newProfileData.user.id === userId;
        const index = isSelf ? 0 : 1;
        const updatedProfiles = [...prev];
        updatedProfiles[index] = newProfileData;
        return updatedProfiles;
    });
  };

  // UNIVERSAL AUTO-SYNC: Save tasks to Supabase whenever they change
  useEffect(() => {
    if (activeBusinessId && activeUserId && growthPlanTasks.length >= 0) {
      syncToSupabase(activeUserId, activeBusinessId, 'tasks', growthPlanTasks);
    }
  }, [growthPlanTasks, activeBusinessId, activeUserId]);

  // UNIVERSAL AUTO-SYNC: Save keywords to Supabase whenever they change
  useEffect(() => {
    if (activeBusinessId && activeUserId && savedKeywords.length >= 0) {
      syncToSupabase(activeUserId, activeBusinessId, 'keywords', savedKeywords);
    }
  }, [savedKeywords, activeBusinessId, activeUserId]);

  const [plan] = useState({ name: 'Tier 1', profileLimit: 1 });

  const setActiveTool = (tool: Tool | null, articleId?: string) => {
    setJetContentInitialProps(null); 
    setActiveToolState(tool);
    if (tool?.id === 'knowledgebase') {
      setActiveKbArticle(articleId || 'introduction');
    }
  };

  // Growth Score Calculation
  useEffect(() => {
    let score = 0;
    const { business, googleBusiness } = profileData;
    const totalTasks = growthPlanTasks.length;
    const completedTasks = growthPlanTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = growthPlanTasks.filter(t => t.status === 'in_progress').length;
    
    if (business.business_name && business.location && business.business_website) {
      score += 10;
    } else if (business.business_name || business.location || business.business_website) {
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
    const { business_name, location, business_website } = newProfileData.business;
    if (business_name && location && business_website && !newProfileData.isProfileActive) { 
      setProfileData({ ...newProfileData, isProfileActive: true }, persist); 
    } else { 
      setProfileData(newProfileData, persist); 
    }
  };

  const addTasksToGrowthPlan = (newTasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => {
    setGrowthPlanTasks(prevTasks => {
      const existingTitles = new Set(prevTasks.map(t => t.title));
      const tasksToAdd = newTasks
        .filter(newTask => !existingTitles.has(newTask.title))
        .map(task => ({ 
          ...task, 
          id: `${task.sourceModule.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`, 
          status: 'to_do' as const, 
          createdAt: new Date().toISOString() 
        }));
      return [...prevTasks, ...tasksToAdd];
    });
  };

  const handleTaskStatusChange = (taskId: string, newStatus: GrowthPlanTask['status']) => {
      setGrowthPlanTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, completionDate: newStatus === 'completed' ? new Date().toISOString() : undefined } 
            : task
        )
      );
  };

  // UNIVERSAL SAVE: Save analysis reports to Supabase
  const handleSaveAnalysis = async (type: 'jetbiz' | 'jetviz', report: AuditReport | LiveWebsiteAnalysis | null) => {
    const newProfileData = { ...profileData, [`${type}Analysis`]: report };
    handleUpdateProfileData(newProfileData, true);
    
    if (report && activeBusinessId) {
      await syncToSupabase(activeUserId, activeBusinessId, type, report);
    }
  };
  
  const activeBusinessName = businesses.find(b => b.id === activeBusinessId)?.business_name || 'Loading Business...';

  const isStep1Complete = !!(profileData.business.business_name && profileData.business.location && profileData.business.business_website);
  const isStep2Complete = profileData.business.isDnaApproved;

  let readinessState: ReadinessState = 'Setup Incomplete';
  if (isStep1Complete && isStep2Complete) readinessState = 'Foundation Ready';
  else if (isStep1Complete) readinessState = 'Foundation Weak';

  // --- Tool Completion Status ---
  // Business Details is complete if basic info is saved AND DNA is approved.
  const isBusinessDetailsComplete = isStep1Complete && isStep2Complete;
  
  const toolCompletionStatus = {
      'businessdetails': isBusinessDetailsComplete,
      // Add other tools here later if needed
  };

  const renderActiveTool = () => {
    if (isAdmin && activeTool?.id === 'adminpanel') {
        return <AdminPanel allProfiles={allProfiles} setAllProfiles={setAllProfiles} currentUserProfile={profileData} setCurrentUserProfile={setProfileData} onImpersonate={(id) => setImpersonatedUserId(id === 'test-user-uuid' ? 'test-user-uuid' : null)} />;
    }
    if (!activeTool || activeTool.id === 'home') {
      return <Welcome setActiveTool={setActiveTool} profileData={profileData} readinessState={readinessState} plan={plan} />;
    }
    switch (activeTool.id) {
      case 'businessdetails': return <BusinessDetails 
        profileData={profileData} 
        onUpdate={handleUpdateProfileData} 
        setActiveTool={setActiveTool} 
        onBusinessUpdated={fetchBusinesses} 
      />;
      case 'planner': return <Planner userId={activeUserId} growthPlanTasks={growthPlanTasks} />;
      case 'growthscore': return <GrowthScoreHistory growthScore={growthScore} profileData={profileData} />;
      case 'account': return <Account plan={plan} profileData={profileData} onLogout={onLogout} onUpdateProfile={handleUpdateProfileData} userId={userId} setActiveTool={setActiveTool} />;
      case 'knowledgebase': return <KnowledgeBase setActiveTool={setActiveTool} initialArticleId={activeKbArticle} />;
      case 'jetbiz': return <JetBiz 
        tool={activeTool} 
        addTasksToGrowthPlan={addTasksToGrowthPlan} 
        onSaveAnalysis={(report) => handleSaveAnalysis('jetbiz', report)} 
        profileData={profileData} 
        setActiveTool={setActiveTool} 
        growthPlanTasks={growthPlanTasks} 
        onTaskStatusChange={handleTaskStatusChange}
        userId={activeUserId}
        activeBusinessId={activeBusinessId}
      />;
      case 'jetviz': return <JetViz 
        tool={activeTool} 
        addTasksToGrowthPlan={addTasksToGrowthPlan} 
        onSaveAnalysis={(report) => handleSaveAnalysis('jetviz', report)} 
        profileData={profileData} 
        setActiveTool={setActiveTool} 
        growthPlanTasks={growthPlanTasks} 
        onTaskStatusChange={handleTaskStatusChange} 
        userId={activeUserId}
        activeBusinessId={activeBusinessId}
      />;
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
      {!isJetCreateActive && <Sidebar 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        isAdmin={isAdmin} 
        onLogout={onLogout} 
        toolCompletionStatus={toolCompletionStatus}
      />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {impersonatedUserId && ( 
          <div className="bg-red-600 text-white text-center py-2 font-bold flex items-center justify-center gap-2"> 
            <EyeIcon className="w-5 h-5"/> 
            Viewing as {profileData.user.email}. 
            <button onClick={() => setImpersonatedUserId(null)} className="underline ml-2">Return to Admin</button> 
          </div> 
        )}
        {!isJetCreateActive && (
          <Header 
            activeTool={activeTool} 
            growthScore={growthScore} 
            businesses={businesses}
            activeBusinessId={activeBusinessId}
            onSwitchBusiness={handleBusinessSwitch}
            onAddBusiness={handleAddBusiness}
            setActiveTool={setActiveTool}
          />
        )}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${ isJetCreateActive ? 'bg-pomelli-dark' : 'bg-brand-light p-6 sm:p-8 lg:p-10' }`}>
          {renderActiveTool()}
        </main>
        
        {activeTool?.id === 'support' && (
          <SupportChatbot context={{ 
            user_id: userId,
            user_email: userEmail,
            business_name: profileData.business.business_name,
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