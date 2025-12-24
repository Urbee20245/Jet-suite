-- JetSuite Billing Accounts Table
-- This table tracks Stripe subscription information for authenticated users

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create billing_accounts table
CREATE TABLE IF NOT EXISTS billing_accounts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference (should match your auth.users table)
  user_id UUID NOT NULL UNIQUE,
  user_email TEXT NOT NULL,
  
  -- Stripe identifiers
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  
  -- Subscription details
  subscription_status TEXT CHECK (subscription_status IN (
    'active',
    'trialing',
    'past_due',
    'canceled',
    'unpaid',
    'incomplete',
    'incomplete_expired',
    'paused'
  )),
  subscription_plan TEXT, -- e.g., 'base_149', 'business_49', 'seat_15'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Usage limits
  seat_count INTEGER DEFAULT 1 CHECK (seat_count >= 0),
  business_count INTEGER DEFAULT 1 CHECK (business_count >= 0),
  
  -- Founder pricing (lifetime-locked, non-client-editable)
  is_founder BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_billing_user_id ON billing_accounts(user_id);
CREATE INDEX idx_billing_stripe_customer_id ON billing_accounts(stripe_customer_id);
CREATE INDEX idx_billing_stripe_subscription_id ON billing_accounts(stripe_subscription_id);
CREATE INDEX idx_billing_status ON billing_accounts(subscription_status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_billing_accounts_updated_at
  BEFORE UPDATE ON billing_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own billing data
CREATE POLICY "Users can view own billing account"
  ON billing_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for server-side operations)
CREATE POLICY "Service role has full access"
  ON billing_accounts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert initial record for existing users (optional)
-- Uncomment and modify if you have existing users
-- INSERT INTO billing_accounts (user_id, user_email, subscription_status, seat_count, business_count)
-- SELECT 
--   id as user_id,
--   email as user_email,
--   'active' as subscription_status,
--   1 as seat_count,
--   1 as business_count
-- FROM auth.users
-- ON CONFLICT (user_id) DO NOTHING;

-- Grant permissions
GRANT SELECT ON billing_accounts TO authenticated;
GRANT ALL ON billing_accounts TO service_role;

-- Comments for documentation
COMMENT ON TABLE billing_accounts IS 'Stores Stripe billing and subscription information for JetSuite users';
COMMENT ON COLUMN billing_accounts.user_id IS 'Foreign key to auth.users.id';
COMMENT ON COLUMN billing_accounts.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN billing_accounts.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN billing_accounts.subscription_status IS 'Current status of Stripe subscription';
COMMENT ON COLUMN billing_accounts.current_period_end IS 'When the current billing period ends';
COMMENT ON COLUMN billing_accounts.seat_count IS 'Number of team member seats';
COMMENT ON COLUMN billing_accounts.business_count IS 'Number of business profiles allowed';
COMMENT ON COLUMN billing_accounts.is_founder IS 'Founder pricing flag - lifetime-locked once set, not client-editable';

-- Business Profiles Table
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  website_url TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for business_profiles
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business profile"
  ON business_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own business profile"
  ON business_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business profile"
  ON business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add missing columns if table exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'phone') THEN
        ALTER TABLE business_profiles ADD COLUMN phone VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'website_url') THEN
        ALTER TABLE business_profiles ADD COLUMN website_url TEXT;
    END IF;
END $$;
