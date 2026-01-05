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
import { Welcome } from './tools/Welcome'; // Import Welcome
import { BusinessDetails } from './tools/profile/BusinessDetails'; // Import BusinessDetails
import { GrowthScoreHistory } from './tools/profile/GrowthScoreHistory'; // Import GrowthScoreHistory
import { Account } from './tools/Account'; // Import Account
import { KnowledgeBase } from './tools/KnowledgeBase'; // Import KnowledgeBase
import { JetBiz } from './tools/JetBiz'; // Import JetBiz
import { JetViz } from './tools/JetViz'; // Import JetViz
import { JetCompete } from './tools/JetCompete'; // Import JetCompete
import { JetKeywords } from './tools/JetKeywords'; // Import JetKeywords
import { JetPost } from './tools/JetPost'; // Import JetPost
import { JetContent } from './tools/JetContent'; // Import JetContent
import { JetImage } from './tools/JetImage'; // Import JetImage
import { JetCreate } from './tools/JetCreate'; // Import JetCreate
import { JetReply } from './tools/JetReply'; // Import JetReply
import { JetTrust } from './tools/JetTrust'; // Import JetTrust
import { JetLeads } from './tools/JetLeads'; // Import JetLeads
import { JetEvents } from './tools/JetEvents'; // Import JetEvents
import { JetAds } from './tools/JetAds'; // Import JetAds
import { GrowthPlan } from './tools/GrowthPlan'; // Import GrowthPlan
import UserSupportTickets from './tools/UserSupportTickets'; // Import UserSupportTickets
import { AdminPanel } from './tools/AdminPanel'; // Import AdminPanel
import { Planner } from './tools/Planner'; // Import Planner
import { BusinessProfile, ProfileData, GrowthPlanTask, SavedKeyword, KeywordData, AuditReport, LiveWebsiteAnalysis, Tool, ReadinessState } from './types'; // Import types
import { ALL_TOOLS } from './constants';
import { EyeIcon } from './components/icons/MiniIcons';
import SupportChatbot from './components/SupportChatbot'; // Import SupportChatbot

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
      name: '', 
      category: '', 
      description: '', 
      websiteUrl: '', 
      location: '', 
      serviceArea: '', 
      phone: '', 
      email: '', 
      dna: { logo: '', colors: [], fonts: '', style: '' }, 
      isDnaApproved: false, 
      dnaLastUpdatedAt: undefined,
      is_primary: true, // ADDED
      is_complete: false // ADDED
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
  
  // Initialize allProfiles with default structure, will be updated in useEffect
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>(() => {
      const adminProfile = createInitialProfile(userId, userEmail, 'The Ivsight', 'Company');
      const testProfile = createInitialProfile('test-user-uuid', 'test.user@example.com', 'Test', 'User');
      return [adminProfile, testProfile];
  });

  // Helper function to load business-specific data
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
      
      // 2. Update the active profile data in allProfiles state
      setAllProfiles(prev => {
        const updated = [...prev];
        const index = updated.findIndex(p => p.user.id === activeUserId);
        if (index !== -1) {
          const syncedProfile = {
            ...updated[index],
            business: {
              ...updated[index].business,
              id: profile.id,
              name: profile.business_name,
              websiteUrl: profile.business_website,
              category: profile.industry,
              location: `${profile.city}, ${profile.state}`,
              description: profile.business_description,
              isDnaApproved: profile.is_dna_approved,
              dnaLastUpdatedAt: profile.dna_last_updated_at,
              is_primary: profile.is_primary, // ADDED
              is_complete: profile.is_complete, // ADDED
            },
            isProfileActive: !!profile.is_complete,
            // Note: brandDnaProfile, jetbizAnalysis, etc. are loaded separately or lazily
          };
          updated[index] = syncedProfile;
        }
        return updated;
      });
      
      // 3. Load business-specific saved data (tasks, keywords) from localStorage
      const savedKeywords = localStorage.getItem(`jetsuite_keywords_${businessId}`);
      const savedTasks = localStorage.getItem(`jetsuite_tasks_${businessId}`);
      
      setSavedKeywords(savedKeywords ? JSON.parse(savedKeywords) : []);
      setGrowthPlanTasks(savedTasks ? JSON.parse(savedTasks) : []);
      
    } catch (error) {
      console.error('Error loading business data:', error);
      // Fallback to empty state if loading fails
      setSavedKeywords([]);
      setGrowthPlanTasks([]);
    }
  };

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

  // 1. Fetch all accessible businesses and set active one
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!supabase || !activeUserId) return;

      console.log('[InternalApp] Fetching businesses for active user:', activeUserId);

      // Fetch owned businesses
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
        setBusinesses(dbProfiles as BusinessProfile[]);
        
        // Determine active business ID
        const savedActiveId = localStorage.getItem('jetsuite_active_biz_id');
        const primaryBusiness = dbProfiles.find(p => p.is_primary) || dbProfiles[0];
        
        const activeId = savedActiveId && dbProfiles.some(b => b.id === savedActiveId)
          ? savedActiveId
          : primaryBusiness.id;
        
        if (activeId) {
          console.log('[InternalApp] Setting active business ID:', activeId);
          setActiveBusinessId(activeId);
          localStorage.setItem('jetsuite_active_biz_id', activeId);
          loadBusinessData(activeId);
        }
      } else {
        console.log('[InternalApp] No businesses found for user');
        // If no businesses exist, ensure activeBusinessId is null
        setActiveBusinessId(null);
        setBusinesses([]);
      }
    };

    fetchBusinesses();
  }, [activeUserId, supabase]);

  // --- Business Switching Logic ---
  const handleBusinessSwitch = async (businessId: string) => {
    if (activeBusinessId === businessId) return;
    
    // 1. Save current business ID to localStorage
    localStorage.setItem('jetsuite_active_biz_id', businessId);
    
    // 2. Update active business state
    setActiveBusinessId(businessId);
    
    // 3. Reload business-specific data
    await loadBusinessData(businessId);
    
    // 4. Clear tool-specific state so it reloads for new business
    setSavedKeywords([]);
    setGrowthPlanTasks([]);
    setJetContentInitialProps(null);
  };
  
  // --- Add New Business Logic ---
  const handleAddBusiness = async () => {
    if (!supabase || !activeUserId) return;
    
    // Check if user has reached business limit (assuming billing_accounts exists)
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
      // Create new business profile
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
        // Add to businesses list
        setBusinesses(prev => [...prev, newBusiness as BusinessProfile]);
        
        // Switch to new business
        handleBusinessSwitch(newBusiness.id);
        
        // Navigate to business details to complete setup
        setActiveTool(ALL_TOOLS['businessdetails']);
      }
    } catch (error) {
      console.error('Error creating business:', error);
      alert('Failed to create new business. Please try again.');
    }
  };

  const isAdmin = userEmail === ADMIN_EMAIL;
  const profileData = impersonatedUserId === 'test-user-uuid' ? allProfiles[1] : allProfiles[0];
  
  // Ensure profileData reflects the active business if one is selected
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

  // 2. Save business-specific state to localStorage
  useEffect(() => {
      if (activeBusinessId) {
          try { localStorage.setItem(`jetsuite_tasks_${activeBusinessId}`, JSON.stringify(growthPlanTasks)); } catch(e) { console.warn("Could not save tasks", e); }
      }
  }, [growthPlanTasks, activeBusinessId]);
  
  useEffect(() => {
      if (activeBusinessId) {
          try { localStorage.setItem(`jetsuite_keywords_${activeBusinessId}`, JSON.stringify(savedKeywords)); } catch(e) { console.warn("Could not save keywords", e); }
      }
  }, [savedKeywords, activeBusinessId]);

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
      case 'planner': return <Planner userId={activeUserId} growthPlanTasks={growthPlanTasks} />;
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
            onSwitchBusiness={handleBusinessSwitch}
            onAddBusiness={handleAddBusiness} // Pass the new handler
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