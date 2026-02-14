# Supabase Edge Functions for JetSuite

This directory contains Supabase Edge Functions for handling Google OAuth operations.

## Functions

### 1. `google-oauth-callback`
Handles the OAuth callback from Google Business Profile. This function:
- Validates OAuth state (CSRF protection)
- Exchanges authorization code for access/refresh tokens
- Fetches user info and business account details
- Encrypts and stores tokens in the database
- Redirects back to the application

**Endpoint**: `https://your-project.supabase.co/functions/v1/google-oauth-callback`

**Method**: GET

**Query Parameters**:
- `code` (required): Authorization code from Google
- `state` (required): OAuth state token for CSRF protection
- `error` (optional): Error code if OAuth failed
- `error_description` (optional): Error description

**Environment Variables**:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `APP_URL`: Application URL for redirects (default: https://www.getjetsuite.com)
- `GOOGLE_REDIRECT_URI`: OAuth redirect URI (default: https://www.getjetsuite.com/api/auth/google/callback)
- `ENCRYPTION_KEY`: 32-byte hex string for AES-256-CBC encryption

### 2. `refresh-google-token`
Automatically refreshes expired Google OAuth tokens using refresh tokens.

**Endpoint**: `https://your-project.supabase.co/functions/v1/refresh-google-token`

**Method**: POST

**Request Body**:
```json
{
  "connectionId": "uuid-of-social-connection"
}
```

**Response** (Success):
```json
{
  "success": true,
  "token_expires_at": "2026-02-14T20:00:00Z",
  "message": "Token refreshed successfully"
}
```

**Response** (Error - Needs Reconnect):
```json
{
  "error": "Failed to refresh token",
  "message": "Google refresh failed: Token has been expired or revoked",
  "needs_reconnect": true
}
```

**Environment Variables**:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `ENCRYPTION_KEY`: 32-byte hex string for AES-256-CBC encryption

## Shared Utilities

### `_shared/encryption.ts`
Provides encryption and decryption functions using AES-256-CBC:
- `encrypt(plaintext: string): Promise<string>` - Encrypts text
- `decrypt(encryptedHex: string): Promise<string>` - Decrypts text

### `_shared/cors.ts`
CORS utilities for handling cross-origin requests:
- `getCorsHeaders(origin?: string): HeadersInit` - Get CORS headers
- `handleCorsPreflightRequest(req: Request): Response` - Handle OPTIONS requests
- `jsonResponse(data, status, origin)` - Create JSON response with CORS
- `errorResponse(message, status, origin)` - Create error response with CORS

**Allowed Origins**:
- `https://www.getjetsuite.com`
- `https://getjetsuite.com`
- `http://localhost:5173`
- `http://localhost:3000`

## Deployment

### Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Link to your project: `supabase link --project-ref your-project-ref`

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy google-oauth-callback
supabase functions deploy refresh-google-token

# Or deploy all at once
supabase functions deploy
```

### Set Environment Secrets

```bash
# Google OAuth
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret

# Encryption
supabase secrets set ENCRYPTION_KEY=your_32_byte_hex_key

# App configuration
supabase secrets set APP_URL=https://www.getjetsuite.com
supabase secrets set GOOGLE_REDIRECT_URI=https://www.getjetsuite.com/api/auth/google/callback

# List all secrets
supabase secrets list
```

### View Logs

```bash
# Stream logs for all functions
supabase functions logs

# Stream logs for specific function
supabase functions logs google-oauth-callback
supabase functions logs refresh-google-token

# View specific number of recent logs
supabase functions logs google-oauth-callback --tail 50
```

## Local Development

### Run Functions Locally

```bash
# Start local development server
supabase functions serve

# Test google-oauth-callback
curl "http://localhost:54321/functions/v1/google-oauth-callback?code=test&state=test"

# Test refresh-google-token
curl -X POST "http://localhost:54321/functions/v1/refresh-google-token" \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "test-uuid"}'
```

### Environment Variables for Local Development

Create `.env` file in the functions directory:

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
ENCRYPTION_KEY=your_32_byte_hex_key
APP_URL=http://localhost:5173
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback
```

## Integration with Existing Vercel API Routes

You have two options for integration:

### Option 1: Keep Vercel Routes (Recommended)
Keep your existing Vercel API routes at `/api/auth/google/authorize` and `/api/auth/google/callback`, and only use the `refresh-google-token` edge function for token refresh.

**Advantages**:
- Minimal changes to existing code
- No need to update Google OAuth redirect URI
- Edge function handles only token refresh

**Implementation**:
Update `/api/social/refresh-token.ts` to call the edge function:
```typescript
// Instead of calling refresh logic directly, call edge function
const response = await fetch(
  `${process.env.SUPABASE_URL}/functions/v1/refresh-google-token`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connectionId }),
  }
);
```

### Option 2: Full Migration to Edge Functions
Migrate both authorize and callback to Supabase Edge Functions.

**Advantages**:
- Unified OAuth implementation
- Better scalability with edge functions
- Reduced Vercel serverless function costs

**Implementation**:
1. Create `google-oauth-authorize` edge function
2. Update Google Cloud Console redirect URI to Supabase URL
3. Update frontend to call edge function URL

## Testing

### Test OAuth Flow

1. Set up test environment variables
2. Deploy functions
3. Initiate OAuth from your app
4. Monitor logs: `supabase functions logs`
5. Verify token storage in database

### Test Token Refresh

```bash
# Using curl
curl -X POST "https://your-project.supabase.co/functions/v1/refresh-google-token" \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "real-connection-uuid"}'

# Using JavaScript/TypeScript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/refresh-google-token',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connectionId: 'real-connection-uuid' }),
  }
);
const data = await response.json();
console.log(data);
```

## Troubleshooting

### Common Issues

1. **"ENCRYPTION_KEY environment variable is not set"**
   - Run: `supabase secrets set ENCRYPTION_KEY=your_key`

2. **"Invalid OAuth state"**
   - Check that state token exists in `oauth_states` table
   - Verify state hasn't expired (10 minute timeout)

3. **"Failed to get access token"**
   - Verify Google OAuth credentials
   - Check redirect URI matches Google Cloud Console
   - Ensure authorization code hasn't been used already

4. **"Connection not found"**
   - Verify connectionId is valid UUID
   - Check connection exists and is active in database

5. **CORS errors**
   - Add your domain to allowed origins in `_shared/cors.ts`
   - Redeploy functions after changes

### Debug Tips

- Check edge function logs: `supabase functions logs`
- Query database directly for connection status
- Test with curl to isolate frontend issues
- Verify environment secrets are set correctly

## Security Notes

1. **Never log sensitive data**: Tokens, secrets, or encryption keys
2. **Use HTTPS in production**: Always use secure connections
3. **Rotate keys regularly**: Change encryption keys periodically
4. **Monitor usage**: Track token refresh patterns for anomalies
5. **Set up RLS**: Ensure Row Level Security is enabled on tables

## Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Runtime Documentation](https://deno.land/manual)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

## Support

For issues:
1. Check function logs
2. Review this README
3. Consult main setup guide: `/GOOGLE_OAUTH_SETUP.md`
