-- Cal.com Integration Settings
-- Run this SQL in your Supabase SQL Editor

-- Create the calcom_settings table (admin-only, single row)
CREATE TABLE IF NOT EXISTS calcom_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    calcom_api_key TEXT DEFAULT '',
    calcom_event_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calcom_settings ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for API routes)
CREATE POLICY "Service role full access on calcom_settings"
    ON calcom_settings
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_calcom_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcom_settings_updated_at
    BEFORE UPDATE ON calcom_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_calcom_settings_updated_at();

-- Insert default row
INSERT INTO calcom_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
