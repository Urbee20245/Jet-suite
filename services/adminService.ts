import { getSupabaseClient } from '../integrations/supabase/client';

export interface AdminUpdateUserParams {
  userId: string;
  updates: {
    trial_end_date?: string | null;
    subscription_status?: string;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    [key: string]: any;
  };
}

export interface AdminUserResponse {
  success: boolean;
  profile?: any;
  error?: string;
}

/**
 * Admin service for administrative operations
 * Uses service role API endpoints to bypass RLS policies
 */
class AdminService {
  
  /**
   * Update user profile with admin privileges
   * Bypasses Row Level Security for administrative changes
   */
  async updateUser(params: AdminUpdateUserParams): Promise<AdminUserResponse> {
    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      return data;
    } catch (error) {
      console.error('Error in adminService.updateUser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all users (requires admin privileges)
   * Uses direct Supabase query
   */
  async getAllUsers() {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, users: data };
    } catch (error) {
      console.error('Error in adminService.getAllUsers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user by ID (requires admin privileges)
   */
  async getUserById(userId: string) {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { success: true, user: data };
    } catch (error) {
      console.error('Error in adminService.getUserById:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extend trial for a user
   * Helper method that wraps updateUser for common trial extension task
   */
  async extendTrial(userId: string, newTrialEndDate: string) {
    return this.updateUser({
      userId,
      updates: {
        trial_end_date: newTrialEndDate,
      },
    });
  }

  /**
   * Update subscription status for a user
   * Helper method that wraps updateUser for subscription updates
   */
  async updateSubscriptionStatus(
    userId: string, 
    status: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ) {
    const updates: any = {
      subscription_status: status,
    };

    if (stripeCustomerId) {
      updates.stripe_customer_id = stripeCustomerId;
    }

    if (stripeSubscriptionId) {
      updates.stripe_subscription_id = stripeSubscriptionId;
    }

    return this.updateUser({
      userId,
      updates,
    });
  }
}

// Export singleton instance
export const adminService = new AdminService();
