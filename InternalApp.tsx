import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from './integrations/supabase/client';
import { syncToSupabase, loadFromSupabase } from './utils/syncService';
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
import { BusinessProfile, ProfileData, GrowthPlanTask, SavedKeyword, KeywordData, AuditReport, LiveWebsiteAnalysis, Tool, ReadinessState, GoogleBusinessProfile, BrandDnaProfile, BusinessDna, UserProfile } from './types';
import { ALL_TOOLS } from './constants';
import { EyeIcon } from './components/icons/MiniIcons';
import SupportChatbot from './components/SupportChatbot';

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
      google_business_profile: null,
      brand_dna_profile: null,
      is_dna_approved: false,
      dna_last_updated_at: undefined,
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
  const [impersonatedProfile, setImpersonatedProfile] = useState<ProfileData | null>(null);
  const activeUserId = impersonatedProfile?.user.id || userId;
  const isAdmin = userEmail === ADMIN_EMAIL;

  const [growthPlanTasks, setGrowthPlanTasks] = useState<GrowthPlanTask[]>([]);
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>([]);
  const [jetContentInitialProps, setJetContentInitialProps] = useState<{keyword: KeywordData, type: string} | null>(null);
  
  const [growthScore, setGrowthScore] = useState(150);
  
  // NEW: State for all profiles (used only by Admin Panel)
  const [allAdminProfiles, setAllAdminProfiles] = useState<ProfileData[]>([]);

  // Initialize allProfiles with default structure (only current user's profile)
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>(() => {
      // Initialize with the current user's basic profile structure
      return [createInitialProfile(userId, userEmail, 'Loading', 'User')];
  });
  
  const activeProfile = allProfiles.find(p => p.user.id === activeUserId) || allProfiles[0];

  // Function to fetch all businesses for the current user
  const fetchBusinesses = async () => {
    if (!supabase || !activeUserId) return;
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', activeUserId);

      if (error) throw error;
      
      const loadedBusinesses = data as BusinessProfile[];
      setBusinesses(loadedBusinesses);

      // Set active business ID if not set, prioritizing primary or the first one
      if (!activeBusinessId && loadedBusinesses.length > 0) {
        const primaryBiz = loadedBusinesses.find(b => b.is_primary)?.id || loadedBusinesses[0].id;
        setActiveBusinessId(primaryBiz);
        localStorage.setItem('jetsuite_active_biz_id', primaryBiz);
      } else if (activeBusinessId && !loadedBusinesses.find(b => b.id === activeBusinessId)) {
        // If the active ID is no longer valid, reset to primary or first
        const primaryBiz = loadedBusinesses.find(b => b.is_primary)?.id || loadedBusinesses[0]?.id;
        if (primaryBiz) {
          setActiveBusinessId(primaryBiz);
          localStorage.setItem('jetsuite_active_biz_id', primaryBiz);
        }
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

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
      
      // The profile object from Supabase contains all columns, including JSONB fields.
      const loadedBusiness = profile as unknown as BusinessProfile;
      
      // Map JSONB fields to the ProfileData structure
      const loadedGbp = loadedBusiness.google_business_profile || { profileName: '', mapsUrl: '', status: 'Not Created' } as GoogleBusinessProfile;
      const loadedBrandDnaProfile = loadedBusiness.brand_dna_profile || undefined;
      
      // 2. Update the active profile data
      setAllProfiles(prev => {
        const updated = [...prev];
        const index = updated.findIndex(p => p.user.id === activeUserId);
        if (index !== -1) {
          const currentProfile = updated[index];
          
          const syncedProfile: ProfileData = {
            ...currentProfile,
            business: {
              ...loadedBusiness,
              location: `${loadedBusiness.city}, ${loadedBusiness.state}`,
              isDnaApproved: loadedBusiness.is_dna_approved,
              dnaLastUpdatedAt: loadedBusiness.dna_last_updated_at,
              // Ensure the simple DNA structure is also populated if needed by old components
              dna: loadedBusiness.dna || { logo: '', colors: [], fonts: '', style: '' } as BusinessDna, 
            } as BusinessProfile,
            googleBusiness: loadedGbp, // Map GBP data
            brandDnaProfile: loadedBrandDnaProfile, // Map detailed DNA
            isProfileActive: !!loadedBusiness.is_complete,
          };
          updated[index] = syncedProfile;
        }
        return updated;
      });
      
      // 3. Load tasks from Supabase
      const tasks = await loadFromSupabase(activeUserId, businessId, 'tasks');
      setGrowthPlanTasks(tasks || []); // <-- SET TASKS HERE
      
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
            updated[index] = { ...updated[index], jetbizAnalysis: jetbizReport as AuditReport };
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
            updated[index] = { ...updated[index], jetvizAnalysis: jetvizReport as LiveWebsiteAnalysis };
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

  // Function to fetch all profiles for Admin Panel
  const fetchAllAdminProfiles = async () => {
    if (!isAdmin) return;
    
    try {
        const response = await fetch('/api/admin/get-all-profiles', {
            headers: {
                'x-user-email': userEmail // Pass admin email for authorization
            }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch all admin profiles:', response.status);
            return;
        }
        
        const data = await response.json();
        
        // Map fetched profiles to ProfileData structure
        const fetchedProfiles: ProfileData[] = data.profiles.map((p: any) => {
            const userProfile: UserProfile = {
                id: p.user.id,
                firstName: p.user.firstName,
                lastName: p.user.lastName,
                email: p.user.email,
                phone: p.user.phone || '',
                role: p.user.role || 'Owner',
            };
            
            const businessProfile: BusinessProfile = {
                ...p.business,
                isDnaApproved: !!p.business.brandDnaProfile,
                dnaLastUpdatedAt: p.business.dna_last_updated_at,
                googleBusiness: p.business.google_business_profile,
                brandDnaProfile: p.business.brand_dna_profile,
                is_dna_approved: !!p.business.brandDnaProfile,
                dna_last_updated_at: p.business.dna_last_updated_at,
                // Fill in missing fields from the simplified API response
                business_website: p.business.business_website || '',
                business_description: p.business.business_description || '',
                service_area: p.business.service_area || '',
                phone: p.business.phone || '',
                email: p.business.email || '',
                is_primary: p.business.is_primary || false,
                is_complete: p.business.is_complete || false,
                created_at: p.business.created_at || new Date().toISOString(),
                updated_at: p.business.updated_at || new Date().toISOString(),
                google_business_profile: p.business.google_business_profile || null,
                dna: p.business.dna || { logo: '', colors: [], fonts: '', style: '' },
                location: p.business.location || '',
                city: p.business.city || '',
                state: p.business.state || '',
            };
            
            return {
                user: userProfile,
                business: businessProfile,
                googleBusiness: businessProfile.google_business_profile || { profileName: '', mapsUrl: '', status: 'Not Created' },
                isProfileActive: businessProfile.is_complete,
                brandDnaProfile: businessProfile.brand_dna_profile,
            } as ProfileData;
        });
        
        setAllAdminProfiles(fetchedProfiles);
        
    } catch (error) {
        console.error('Error fetching all admin profiles:', error);
    }
  };

// Initial Profile Load (Updated to only load current user's profile)
  useEffect(() => {
    const loadProfiles = async () => {
        const currentUserProfile = await fetchAndMergeProfile(userId, userEmail, true);
        
        // Initialize allProfiles with the current user's profile
        setAllProfiles([currentUserProfile]);
        
        // Fetch all businesses for the current user
        await fetchBusinesses();
        
        // If admin, fetch all profiles immediately
        if (isAdmin) {
            fetchAllAdminProfiles();
        }
    };
    
    loadProfiles();
  }, [userId, userEmail, isAdmin]); // Added isAdmin dependency

  // Load data for the active business whenever the activeBusinessId changes
  useEffect(() => {
    if (activeBusinessId) {
      loadBusinessData(activeBusinessId);
    }
  }, [activeBusinessId]);

  // Business Switching
  const handleBusinessSwitch = async (businessId: string) => {
    if (activeBusinessId === businessId) return;
    
    localStorage.setItem('jetsuite_active_biz_id', businessId);
    setActiveBusinessId(businessId);
    // loadBusinessData will be triggered by the useEffect above
    
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

  const handleImpersonate = (profileToImpersonate: ProfileData | null) => {
    if (profileToImpersonate) {
        setImpersonatedProfile(profileToImpersonate);
        // Also switch the active business to the impersonated user's primary business
        if (profileToImpersonate.business.id !== 'no-business') {
            handleBusinessSwitch(profileToImpersonate.business.id);
        }
    } else {
        setImpersonatedProfile(null);
        // Revert to current user's primary business
        const currentUserPrimaryBiz = businesses.find(b => b.is_primary)?.id || businesses[0]?.id;
        if (currentUserPrimaryBiz) {
            handleBusinessSwitch(currentUserPrimaryBiz);
        }
    }
  };

  const setProfileData = (newProfileData: ProfileData, persist: boolean = true) => {
    setAllProfiles(prev => {
        const isSelf = newProfileData.user.id === userId;
        const index = isSelf ? 0 : prev.findIndex(p => p.user.id === newProfileData.user.id);
        const updatedProfiles = [...prev];
        if (index !== -1) {
            updatedProfiles[index] = newProfileData;
        } else if (!isSelf) {
            // If impersonating a user not in the list (shouldn't happen if fetched correctly)
            updatedProfiles.push(newProfileData);
        }
        return updatedProfiles;
    });
  };

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
              googleBusiness: activeBiz.google_business_profile || { profileName: '', mapsUrl: '', status: 'Not Created' },
              brandDnaProfile: activeBiz.brand_dna_profile || undefined,
              isProfileActive: !!activeBiz.is_complete,
            };
          }
          return updated;
        });
      }
    }
  }, [activeBusinessId, businesses, activeUserId]);

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
    const { business, googleBusiness } = activeProfile;
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
  }, [activeProfile, growthPlanTasks]);

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
    const newProfileData = { ...activeProfile, [`${type}Analysis`]: report };
    handleUpdateProfileData(newProfileData, true);
    
    if (report && activeBusinessId) {
      await syncToSupabase(activeUserId, activeBusinessId, type, report);
    }
  };
  
  const isStep1Complete = !!activeProfile.business.business_name && !!activeProfile.business.location && !!activeProfile.business.business_website;
  const isStep2Complete = activeProfile.business.isDnaApproved;

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
        return <AdminPanel 
            allProfiles={allAdminProfiles} 
            setAllProfiles={setAllAdminProfiles} 
            onDataChange={fetchAllAdminProfiles}
            currentUserProfile={activeProfile} 
            setCurrentUserProfile={setProfileData} 
            onImpersonate={handleImpersonate} 
        />;
    }
    if (!activeTool || activeTool.id === 'home') {
      return <Welcome setActiveTool={setActiveTool} profileData={activeProfile} readinessState={readinessState} plan={plan} />;
    }
    switch (activeTool.id) {
      case 'businessdetails': return <BusinessDetails 
        profileData={activeProfile} 
        onUpdate={handleUpdateProfileData} 
        setActiveTool={setActiveTool} 
        onBusinessUpdated={fetchBusinesses} 
      />;
      case 'planner': return <Planner userId={activeUserId} growthPlanTasks={growthPlanTasks} />;
      case 'growthscore': return <GrowthScoreHistory growthScore={growthScore} profileData={activeProfile} />;
      case 'account': return <Account plan={plan} profileData={activeProfile} onLogout={onLogout} onUpdateProfile={handleUpdateProfileData} userId={userId} setActiveTool={setActiveTool} />;
      case 'knowledgebase': return <KnowledgeBase setActiveTool={setActiveTool} initialArticleId={activeKbArticle} />;
      case 'jetbiz': return <JetBiz 
        tool={activeTool} 
        addTasksToGrowthPlan={addTasksToGrowthPlan} 
        onSaveAnalysis={(report) => handleSaveAnalysis('jetbiz', report)} 
        profileData={activeProfile} 
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
        profileData={activeProfile} 
        setActiveTool={setActiveTool} 
        growthPlanTasks={growthPlanTasks} 
        onTaskStatusChange={handleTaskStatusChange} 
        userId={activeUserId}
        activeBusinessId={activeBusinessId}
      />;
      case 'jetcompete': return <JetCompete tool={activeTool} addTasksToGrowthPlan={addTasksToGrowthPlan} profileData={activeProfile} setActiveTool={setActiveTool} />;
      case 'jetkeywords': return <JetKeywords tool={activeTool} profileData={activeProfile} setActiveTool={setActiveTool} />;
      case 'jetpost': return <JetPost tool={activeTool} profileData={activeProfile} setActiveTool={setActiveTool} />;
      case 'jetcontent': return <JetContent tool={activeTool} initialProps={jetContentInitialProps} profileData={activeProfile} setActiveTool={setActiveTool} />;
      case 'jetimage': return <JetImage tool={activeTool} profileData={activeProfile} />;
      case 'jetcreate': return <JetCreate tool={activeTool} profileData={activeProfile} setActiveTool={setActiveTool} onUpdateProfile={handleUpdateProfileData} />;
      case 'jetreply': return <JetReply tool={activeTool} profileData={activeProfile} readinessState={readinessState} setActiveTool={setActiveTool} />;
      case 'jettrust': return <JetTrust tool={activeTool} profileData={activeProfile} setActiveTool={setActiveTool} />;
      case 'jetleads': return <JetLeads tool={activeTool} profileData={activeProfile} setActiveTool={setActiveTool} />;
      case 'jetevents': return <JetEvents tool={activeTool} />;
      case 'jetads': return <JetAds tool={activeTool} />;
      case 'growthplan': return <GrowthPlan 
        tasks={growthPlanTasks} 
        setTasks={setGrowthPlanTasks} 
        setActiveTool={setActiveTool} 
        onTaskStatusChange={handleTaskStatusChange} 
        growthScore={growthScore} 
        userId={activeUserId}
        activeBusinessId={activeBusinessId}
      />;
      case 'support': return <UserSupportTickets />;
      default: return <Welcome setActiveTool={setActiveTool} profileData={activeProfile} readinessState={readinessState} plan={plan} />;
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
        {impersonatedProfile && ( 
          <div className="bg-red-600 text-white text-center py-2 font-bold flex items-center justify-center gap-2"> 
            <EyeIcon className="w-5 h-5"/> 
            Viewing as {impersonatedProfile.user.email}. 
            <button onClick={() => handleImpersonate(null)} className="underline ml-2">Return to Admin</button> 
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
            business_name: activeProfile.business.business_name,
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