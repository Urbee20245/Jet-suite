import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';

// Pricing constants for MRR calculation (based on standard pricing and assumed founder discount)
const STANDARD_BASE_PRICE = 149;
const FOUNDER_BASE_PRICE = 99; // Assuming $50 discount for founder tier
const BUSINESS_ADDON_PRICE = 49;
const SEAT_ADDON_PRICE = 15;

interface SubscriptionData {
  user_email: string;
  subscription_plan: string; // Should contain 'founder' or 'standard' tier info
  seat_count: number;
  business_count: number;
  is_founder: boolean;
  subscription_status: string;
}

/**
 * Calculates the monthly value of a subscription based on counts and tier.
 */
const calculateMonthlyValue = (sub: SubscriptionData): number => {
    const isFounder = sub.is_founder;
    const base = isFounder ? FOUNDER_BASE_PRICE : STANDARD_BASE_PRICE;
    
    // Calculate additional business cost (subtract 1 for the base business)
    const additionalBusinessCount = Math.max(0, sub.business_count - 1);
    const additionalBusinessCost = additionalBusinessCount * BUSINESS_ADDON_PRICE;
    
    // Calculate additional seat cost (subtract 1 for the base seat included in the base price)
    const additionalSeatCount = Math.max(0, sub.seat_count - 1);
    const additionalSeatCost = additionalSeatCount * SEAT_ADDON_PRICE;
    
    return base + additionalBusinessCost + additionalSeatCost;
};


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userEmail } = req.query;

    // 1. Admin Check (Assuming userEmail is passed from the client)
    if (userEmail !== ADMIN_EMAIL) {
      return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    // 2. Query active subscriptions, excluding admin test accounts
    const ADMIN_EMAILS_TO_EXCLUDE = ['theivsightcompany@gmail.com', 'kage.holmes@gmail.com'];

    const { data: subscriptions, error } = await supabase
      .from('billing_accounts')
      .select('user_email, subscription_plan, seat_count, business_count, is_founder, subscription_status')
      .eq('subscription_status', 'active')
      .not('user_email', 'in', `(${ADMIN_EMAILS_TO_EXCLUDE.map(e => `"${e}"`).join(',')})`);

    if (error) {
      throw error;
    }

    let totalActiveSubscriptions = 0;
    let monthlyRecurringRevenue = 0;
    let founderRevenue = 0;
    let standardRevenue = 0;
    const activeSubscriptions: any[] = [];

    // 3. Calculate Metrics
    (subscriptions as SubscriptionData[]).forEach(sub => {
      totalActiveSubscriptions++;
      
      const monthlyValue = calculateMonthlyValue(sub);
      monthlyRecurringRevenue += monthlyValue;
      
      const tier = sub.is_founder ? 'founder' : 'standard';
      
      if (sub.is_founder) {
        founderRevenue += monthlyValue;
      } else {
        standardRevenue += monthlyValue;
      }

      activeSubscriptions.push({
        user_email: sub.user_email,
        subscription_plan: tier,
        seat_count: sub.seat_count,
        business_count: sub.business_count,
        monthly_value: monthlyValue,
        status: sub.subscription_status,
      });
    });

    // 4. Return structured response
    return res.status(200).json({
      totalActiveSubscriptions,
      monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue),
      founderRevenue: Math.round(founderRevenue),
      standardRevenue: Math.round(standardRevenue),
      subscriptions: activeSubscriptions,
    });
  } catch (error: any) {
    console.error('Admin revenue error:', error);
    return res.status(500).json({
      error: 'Failed to fetch revenue metrics',
      message: error.message,
    });
  }
}