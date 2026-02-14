# Google Business Profile OAuth with Refresh Tokens - Setup Guide

This guide will help you implement and deploy Google Business Profile OAuth with automatic token refresh functionality for JetSuite.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Google Cloud Console Setup](#google-cloud-console-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Deploy Supabase Edge Functions](#deploy-supabase-edge-functions)
7. [Frontend Implementation](#frontend-implementation)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This implementation provides:
- ✅ Persistent OAuth with refresh tokens
- ✅ Automatic token refresh 5 minutes before expiration
- ✅ Graceful handling of expired refresh tokens
- ✅ Support for both www.getjetsuite.com and getjetsuite.com domains
- ✅ Secure token storage with AES-256-CBC encryption
- ✅ Multi-business support

### Architecture

```
User clicks "Connect Google"
  → Frontend initiates OAuth (/api/auth/google/authorize)
  → Google OAuth consent screen
  → Callback to Edge Function (google-oauth-callback)
  → Tokens encrypted and stored in database
  → User redirected back to app

When making Google API calls:
  → getValidGoogleToken() checks token expiration
  → If expires within 5 minutes:
    → Calls refresh-google-token Edge Function
    → Updates database with new token
  → Returns valid token for API call
```

---

## Prerequisites

- Supabase project with database access
- Google Cloud Platform account
- Supabase CLI installed: `npm install -g supabase`
- Access to Supabase dashboard for secrets management

---

## Google Cloud Console Setup

### 1. Create OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable **Google Business Profile API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Business Profile API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Web application**
   - Name: "JetSuite Google Business Profile"

5. Add authorized redirect URIs:
   ```
   https://www.getjetsuite.com/api/auth/google/callback
   http://localhost:5173/api/auth/google/callback
   ```

6. Save your credentials:
   - **Client ID**: `1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ`

### 2. Configure OAuth Consent Screen

1. Go to "OAuth consent screen"
2. User Type: **External** (or Internal for workspace)
3. Fill in required fields:
   - App name: "JetSuite"
   - User support email: your@email.com
   - Developer contact: your@email.com

4. Add scopes:
   ```
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   https://www.googleapis.com/auth/business.manage
   ```

5. Add test users (for testing phase)
6. Submit for verification (required for production)

---

## Environment Variables

### Local Development (.env)

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Token Encryption (32 bytes hex string for AES-256-CBC)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Application URL
APP_URL=http://localhost:5173
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

### Production (Supabase Secrets)

Add secrets to Supabase Edge Functions:

```bash
# Set Google OAuth credentials
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret

# Set encryption key
supabase secrets set ENCRYPTION_KEY=your_32_byte_hex_key

# Set app URL
supabase secrets set APP_URL=https://www.getjetsuite.com
```

### Generate Encryption Key

```bash
# Generate a random 32-byte hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

The database schema is already set up with the necessary tables. Verify these exist:

### Tables

#### `oauth_states` - CSRF protection for OAuth flow
```sql
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  platform TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `social_connections` - OAuth tokens storage
```sql
CREATE TABLE IF NOT EXISTS public.social_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT,          -- Encrypted
  refresh_token TEXT,          -- Encrypted
  token_expires_at TIMESTAMPTZ,
  platform_user_id TEXT,
  platform_username TEXT,
  platform_page_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Deploy Supabase Edge Functions

### 1. Link to Supabase Project

```bash
# Navigate to project directory
cd /path/to/Jet-suite

# Link to your Supabase project
supabase link --project-ref your-project-ref
```

### 2. Deploy Edge Functions

```bash
# Deploy google-oauth-callback function
supabase functions deploy google-oauth-callback

# Deploy refresh-google-token function
supabase functions deploy refresh-google-token
```

### 3. Verify Deployment

Check the Supabase dashboard:
- Go to "Edge Functions" section
- Verify both functions are listed and active
- Check logs for any deployment errors

### 4. Test Edge Functions

```bash
# Test google-oauth-callback (simulate OAuth callback)
curl -X GET "https://your-project.supabase.co/functions/v1/google-oauth-callback?code=test&state=test"

# Test refresh-google-token
curl -X POST "https://your-project.supabase.co/functions/v1/refresh-google-token" \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "test-uuid"}'
```

---

## Frontend Implementation

### 1. OAuth Flow (Already Implemented)

The OAuth flow is initiated in `components/SocialConnectionsManager.tsx`:

```typescript
const handleConnectOAuth = (platform: SocialPlatform) => {
  // This redirects to /api/auth/google/authorize
  // which already includes access_type=offline and prompt=consent
  window.location.href = `/api/auth/${authPath}/authorize?userId=${userId}&businessId=${businessId}`;
};
```

### 2. Using the Token Helper

Before making any Google Business Profile API calls, use the `getValidGoogleToken()` helper:

```typescript
import { getValidGoogleToken } from '../services/socialMediaService';

// In your component or service
async function postToGoogleBusiness(userId: string, businessId: string, content: string) {
  try {
    // Get valid token (auto-refreshes if needed)
    const googleConnection = await getValidGoogleToken(userId, businessId);

    if (!googleConnection) {
      throw new Error('No Google Business Profile connected');
    }

    // Make API call (token is encrypted in DB, you'll need to decrypt it server-side)
    const response = await fetch('/api/google-business/create-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId: googleConnection.id,
        content: content,
      }),
    });

    return await response.json();
  } catch (error) {
    if (error.message.includes('reconnect')) {
      // Show UI to reconnect Google account
      alert('Please reconnect your Google Business Profile');
    }
    throw error;
  }
}
```

### 3. Handle Expired Refresh Tokens

When a refresh token expires or is revoked, prompt the user to reconnect:

```typescript
try {
  const connection = await getValidGoogleToken(userId, businessId);
} catch (error) {
  if (error.message.includes('reconnect')) {
    // Show modal or notification
    showReconnectModal('Google Business Profile');
  }
}
```

---

## Testing

### 1. Test OAuth Flow

1. Run your local development server
2. Navigate to social connections page
3. Click "Connect Google Business Profile"
4. Complete OAuth flow
5. Verify connection appears in database:

```sql
SELECT
  platform,
  platform_username,
  token_expires_at,
  refresh_token IS NOT NULL as has_refresh_token,
  is_active
FROM social_connections
WHERE platform = 'google_business';
```

### 2. Test Token Refresh

Manually trigger token refresh:

```typescript
import { refreshConnectionToken } from '../services/socialMediaService';

// In browser console or test
await refreshConnectionToken('connection-id-here');
```

### 3. Test Auto-Refresh

Set token expiration to near-future and call `getValidGoogleToken()`:

```sql
-- Temporarily set token to expire in 2 minutes
UPDATE social_connections
SET token_expires_at = NOW() + INTERVAL '2 minutes'
WHERE platform = 'google_business';
```

Then in your app:
```typescript
const connection = await getValidGoogleToken(userId, businessId);
// Should automatically refresh and return new token
```

### 4. Test Expired Refresh Token

Revoke the refresh token in Google Console, then attempt to use it:

```typescript
try {
  await getValidGoogleToken(userId, businessId);
} catch (error) {
  console.log(error.message); // Should include "reconnect"
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Missing refresh_token in OAuth response"

**Cause**: Google only returns refresh tokens on first authorization or when `prompt=consent` is used.

**Solution**:
- Verify `/api/auth/google/authorize` includes `prompt: 'consent'`
- Revoke access in [Google Account Settings](https://myaccount.google.com/permissions)
- Reconnect to get new refresh token

#### 2. "Token refresh failed: invalid_grant"

**Cause**: Refresh token expired or revoked.

**Solution**: User must reconnect their Google account.

#### 3. "redirect_uri_mismatch"

**Cause**: Redirect URI in code doesn't match Google Cloud Console.

**Solution**:
- Verify redirect URI exactly matches: `https://www.getjetsuite.com/api/auth/google/callback`
- Check for trailing slashes
- Ensure protocol (http/https) matches

#### 4. "insufficient_permissions"

**Cause**: Missing required OAuth scopes.

**Solution**: Add required scopes in Google Cloud Console:
```
https://www.googleapis.com/auth/business.manage
```

#### 5. "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not configured or app not verified.

**Solution**: Complete OAuth consent screen setup and add test users.

### Debug Logging

Enable detailed logging:

```typescript
// In socialMediaService.ts
console.log('Token expiration:', connection.token_expires_at);
console.log('Time until expiry:', minutesUntilExpiry);
console.log('Has refresh token:', connection.has_refresh_token);
```

### Database Queries

Check token status:

```sql
-- View all Google connections
SELECT
  id,
  user_id,
  platform_username,
  token_expires_at,
  token_expires_at - NOW() as time_until_expiry,
  refresh_token IS NOT NULL as has_refresh_token,
  is_active,
  metadata
FROM social_connections
WHERE platform = 'google_business'
ORDER BY created_at DESC;

-- Count connections by status
SELECT
  CASE
    WHEN token_expires_at > NOW() + INTERVAL '72 hours' THEN 'active'
    WHEN token_expires_at > NOW() THEN 'expiring_soon'
    ELSE 'expired'
  END as status,
  COUNT(*) as count
FROM social_connections
WHERE platform = 'google_business'
  AND is_active = true
GROUP BY status;
```

---

## Migration from Vercel to Supabase Edge Functions (Optional)

If you want to completely migrate from Vercel API routes to Supabase Edge Functions:

### 1. Update OAuth Authorize Endpoint

Currently: `/api/auth/google/authorize` (Vercel)
New: Supabase Edge Function

Create `supabase/functions/google-oauth-authorize/index.ts` based on existing code.

### 2. Update Frontend References

Replace:
```typescript
window.location.href = `/api/auth/google/authorize?...`;
```

With:
```typescript
window.location.href = `${SUPABASE_URL}/functions/v1/google-oauth-authorize?...`;
```

### 3. Update Callback URL

In Google Cloud Console, update redirect URI to:
```
https://your-project.supabase.co/functions/v1/google-oauth-callback
```

---

## Security Best Practices

1. **Never log tokens**: Don't log access_token or refresh_token values
2. **Use HTTPS in production**: Always use secure connections
3. **Rotate encryption keys**: Change ENCRYPTION_KEY periodically
4. **Monitor token usage**: Track token refresh patterns for anomalies
5. **Implement rate limiting**: Prevent token refresh abuse
6. **Set up alerts**: Monitor for failed refresh attempts

---

## Additional Resources

- [Google Business Profile API Documentation](https://developers.google.com/my-business/reference/rest)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [OAuth 2.0 Refresh Token Best Practices](https://tools.ietf.org/html/rfc6749#section-10.4)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Supabase Edge Function logs
3. Check Google Cloud Console logs
4. Review database for connection status

---

**Last Updated**: 2026-02-14
**Version**: 1.0.0
