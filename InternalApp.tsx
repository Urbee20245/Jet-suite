import React, { useState, useEffect } from 'react';
import { MarketingWebsite } from './pages/MarketingWebsite';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { OnboardingPage } from './pages/OnboardingPage';
import { SubscriptionGuard } from './components/SubscriptionGuard';
import { checkSubscriptionAccess } from './services/subscriptionService';
import { fetchRealDateTime } from './utils/realTime';
import { getSupabaseClient } from './integrations/supabase/client'; // Import centralized client function
import { Sidebar } from './components/Sidebar'; // Import Sidebar
import { Header } from './components/Header'; // Import Header

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
    business: { id: 'temp-biz-id', name: '', category: '', description: '', websiteUrl: '', location: '', serviceArea: '', phone: '', email: '', dna: { logo: '', colors: [], fonts: '', style: '' }, isDnaApproved: false, dnaLastUpdatedAt: undefined },
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

  const [growthPlanTasks, setGrowthPlanTasks] = useState<GrowthPlanTask[]>(() => {
      try { const savedTasks = localStorage.getItem(`jetsuite_growthPlanTasks_${activeUserId}`); return savedTasks ? JSON.parse(savedTasks) : []; } catch (e) { return []; }
  });
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>(() => {
      try { const saved = localStorage.getItem(`jetsuite_savedKeywords_${activeUserId}`); return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
  });
  const [jetContentInitialProps, setJetContentInitialProps] = useState<{keyword: KeywordData, type: string} | null>(null);
  
  const [growthScore, setGrowthScore] = useState(150);
  
  // Initialize allProfiles with default structure, will be updated in useEffect
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>(() => {
      const adminProfile = createInitialProfile(userId, userEmail, 'The Ivsight', 'Company');
      const testProfile = createInitialProfile('test-user-uuid', 'test.user@example.com', 'Test', 'User');
      return [adminProfile, testProfile];
  });

  // Function to fetch profile from DB and merge with local/default state
  const fetchAndMergeProfile = async (uid: string, email: string, isCurrentUser: boolean) => {
    let defaultProfile: ProfileData;
    // Use generic defaults for current user or test defaults
    defaultProfile = createInitialProfile(uid, email, isCurrentUser ? 'Owner' : 'Test', isCurrentUser ? 'User' : 'User');

    try {
        // 1. Fetch profile from the new API endpoint
        const response = await fetch(`/api/user/get-profile?userId=${uid}`);
        if (!response.ok) throw new Error('Failed to fetch profile from API');
        
        const { profile: dbProfile } = await response.json();
        
        let mergedProfile = defaultProfile;
        
        if (dbProfile) {
            // Merge DB data into the user part of the profile
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
        
        // 2. Attempt to load other data (business, dna, etc.) from localStorage
        try {
            const savedLocal = localStorage.getItem(`jetsuite_profile_${uid}`);
            if (savedLocal) {
                const localProfile = JSON.parse(savedLocal);
                // Merge DB user data with local business/dna data
                mergedProfile = {
                    ...localProfile,
                    user: mergedProfile.user, // Prioritize fresh DB user data
                };
            }
        } catch (e) {
            console.warn(`Failed to parse local storage for user ${uid}`);
        }
        
        return mergedProfile;

    } catch (error) {
        console.error(`Error fetching profile for ${uid}:`, error);
        // Fallback to local storage or default if DB fetch fails
        try {
            const savedLocal = localStorage.getItem(`jetsuite_profile_${uid}`);
            return savedLocal ? JSON.parse(savedLocal) : defaultProfile;
        } catch (e) {
            return defaultProfile;
        }
    }
  };

  // 0. Initial Profile Load (DB + Local Storage)
  useEffect(() => {
    const loadProfiles = async () => {
        // Load current user profile
        const currentUserProfile = await fetchAndMergeProfile(userId, userEmail, true);
        
        // Load test user profile (for admin impersonation)
        const testUserEmail = 'test.user@example.com';
        const testUserId = 'test-user-uuid';
        const testUserProfile = await fetchAndMergeProfile(testUserId, testUserEmail, false);
        
        setAllProfiles([currentUserProfile, testUserProfile]);
    };
    
    loadProfiles();
  }, [userId, userEmail]); // Only run once on mount/user change

  // 1. Fetch all accessible businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!userId || !supabase) return;

      // Fetch owned businesses + shared seats
      const { data: dbProfiles } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId);

      if (dbProfiles && dbProfiles.length > 0) {
        const formatted = dbProfiles.map(p => ({
          id: p.id,
          name: p.business_name,
          category: p.industry,
          websiteUrl: p.business_website,
          location: `${p.city}, ${p.state}`,
          description: '',
          serviceArea: '',
          phone: '',
          email: '',
          dna: { logo: '', colors: [], fonts: '', style: '' },
          isDnaApproved: false
        }));

        setBusinesses(formatted);
        
        // Default to primary or first available
        if (!activeBusinessId) {
          const primary = dbProfiles.find(p => p.is_primary) || dbProfiles[0];
          setActiveBusinessId(primary.id);
          localStorage.setItem('jetsuite_active_biz_id', primary.id);
        }
      }
    };

    fetchBusinesses();
  }, [userId, supabase, activeBusinessId]);

  // 🔄 Sync Active Business Details into Profile State
  useEffect(() => {
    const syncActiveBusiness = async () => {
      if (!activeBusinessId || !userId || !supabase) return;

      const { data: biz } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', activeBusinessId)
        .maybeSingle();

      if (biz) {
        setAllProfiles(prev => {
          const updated = [...prev];
          const index = updated.findIndex(p => p.user.id === userId);
          if (index !== -1) {
            const syncedProfile = {
              ...updated[index],
              business: {
                ...updated[index].business,
                id: biz.id,
                name: biz.business_name,
                websiteUrl: biz.business_website,
                category: biz.industry,
                location: `${biz.city}, ${biz.state}`
              },
              isProfileActive: !!biz.is_complete
            };
            updated[index] = syncedProfile;
          }
          return updated;
        });
      }
    };

    syncActiveBusiness();
  }, [activeBusinessId, userId, supabase]);

  const handleSwitchBusiness = (id: string) => {
    setActiveBusinessId(id);
    localStorage.setItem('jetsuite_active_biz_id', id);
    // Tool UI will naturally refresh via profileData changes
  };

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
      case 'account': return <Account plan={plan} profileData={profileData} onLogout={onLogout} onUpdateProfile={handleUpdateProfileData} userId={userId} setActiveTool={setActiveTool} />;
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
        {!isJetCreateActive && (
          <Header 
            activeTool={activeTool} 
            growthScore={growthScore} 
            businesses={businesses}
            activeBusinessId={activeBusinessId}
            onSwitchBusiness={handleSwitchBusiness}
          />
        )}
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