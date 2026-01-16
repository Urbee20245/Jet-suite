import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';

const STANDARD_BASE_PRICE = 149;
const FOUNDER_BASE_PRICE = 99;
const BUSINESS_ADDON_PRICE = 49;
const SEAT_ADDON_PRICE = 15;

interface SubscriptionData {
  user_email: string;
  subscription_plan: string;
  seat_count: number;
  business_count: number;
  is_founder: boolean;
  subscription_status: string;
}

const calculateMonthlyValue = (sub: SubscriptionData): number => {
    // 1. Check if it's a free tier
    if (sub.subscription_plan === 'admin_granted_free' || sub.subscription_plan === 'free_tier') {
        return 0;
    }

    const isFounder = sub.is_founder;
    const base = isFounder ? FOUNDER_BASE_PRICE : STANDARD_BASE_PRICE;
    
    const additionalBusinessCount = Math.max(0, sub.business_count - 1);
    const additionalBusinessCost = additionalBusinessCount * BUSINESS_ADDON_PRICE;
    
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

    if (userEmail !== ADMIN_EMAIL) {
      return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    const ADMIN_EMAILS_TO_EXCLUDE = ['theivsightcompany@gmail.com', 'kage.holmes@gmail.com'];

    const { data: subscriptions, error } = await supabase
      .from('billing_accounts')
      .select('user_email, subscription_plan, seat_count, business_count, is_founder, subscription_status')
      .eq('subscription_status', 'active')
      .not('user_email', 'in', `(${ADMIN_EMAILS_TO_EXCLUDE.map(e => `"${e}"`).join(',')})`);

    if (error) throw error;

    let totalActiveSubscriptions = 0;
    let monthlyRecurringRevenue = 0;
    let founderRevenue = 0;
    let standardRevenue = 0;
    const activeSubscriptions: any[] = [];

    (subscriptions as SubscriptionData[]).forEach(sub => {
      totalActiveSubscriptions++;
      
      const monthlyValue = calculateMonthlyValue(sub);
      monthlyRecurringRevenue += monthlyValue;
      
      // Determine display tier
      let tierLabel = sub.is_founder ? 'founder' : 'standard';
      if (sub.subscription_plan === 'admin_granted_free') tierLabel = 'free (admin)';
      if (sub.subscription_plan === 'free_tier') tierLabel = 'free';
      
      if (sub.is_founder) {
        founderRevenue += monthlyValue;
      } else if (monthlyValue > 0) {
        standardRevenue += monthlyValue;
      }

      activeSubscriptions.push({
        user_email: sub.user_email,
        subscription_plan: tierLabel,
        seat_count: sub.seat_count,
        business_count: sub.business_count,
        monthly_value: monthlyValue,
        status: sub.subscription_status,
      });
    });

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