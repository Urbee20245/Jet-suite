# Wix Dashboard - JetSuite Blog Auto-Poster

This Supabase Edge Function serves as the dashboard interface for the JetSuite Blog Auto-Poster Wix app.

## Overview

When users install the JetSuite app on their Wix site, they see this dashboard interface embedded in their Wix dashboard. The dashboard allows users to:

- Connect their Wix site to JetSuite via OAuth
- View their connection status
- See recently published blog posts
- Configure publishing settings
- View API activity logs

## Architecture

### Components

1. **Dashboard Interface** (`index.ts`)
   - Serves an HTML page with embedded React components using HTM library
   - Uses Tailwind CSS for styling
   - Fully responsive design with dark theme
   - No build step required - everything runs in the browser

2. **OAuth Integration**
   - Integrates with `wix-oauth-callback` function for OAuth flow
   - Stores Wix instanceId in connection metadata
   - Supports both authenticated and unauthenticated flows

3. **Database Integration**
   - Queries `website_connections` table for connection status
   - Queries `blog_publications` table for published posts
   - Uses Supabase client with service role for database access

### URL Structure

```
https://zcaxtyodksjtcpscasnw.supabase.co/functions/v1/wix-dashboard?instanceId={INSTANCE_ID}
```

**Query Parameters:**
- `instanceId` (required): Unique identifier for the Wix app installation

## OAuth Flow

### For Wix Dashboard (Unclaimed Installations)

1. User installs Wix app → Gets unique `instanceId`
2. Dashboard loads with `instanceId` parameter
3. User clicks "Connect to Wix" button
4. Dashboard generates OAuth state: `wix_instance_{instanceId}_{random}`
5. Redirects to Wix OAuth with this state
6. User authorizes the app on Wix
7. Wix redirects to `wix-oauth-callback` with code and state
8. Callback parses instanceId from state
9. Callback creates connection with:
   - `user_id`: `00000000-0000-0000-0000-000000000001` (system user)
   - `metadata.instance_id`: The Wix instanceId
10. Callback redirects back to dashboard
11. Dashboard shows connected state

### For Authenticated Users

When users are logged in to JetSuite, the standard OAuth flow is used:
1. OAuth state is created in `oauth_states` table with user_id
2. After OAuth, connection is linked to the actual user_id

### Claiming Unclaimed Installations

Connections created via Wix dashboard (using system user) can be claimed later:
1. User logs in to JetSuite main app
2. User navigates to blog settings
3. System detects unclaimed connection by instanceId
4. Connection's user_id is updated to the authenticated user

## Database Schema

### website_connections

```sql
{
  id: UUID,
  user_id: UUID,  -- System user (00000000-0000-0000-0000-000000000001) for unclaimed
  business_id: UUID | null,
  platform: 'wix',
  website_url: string,
  site_name: string,
  access_token: string (encrypted),
  refresh_token: string (encrypted),
  token_expires_at: timestamp,
  metadata: {
    site_id: string,
    description: string,
    instance_id: string  -- Wix app installation ID
  },
  is_active: boolean,
  last_verified_at: timestamp
}
```

### blog_publications

```sql
{
  id: UUID,
  user_id: UUID,
  website_connection_id: UUID,
  title: string,
  content: string,
  excerpt: string,
  status: 'published' | 'draft' | 'failed' | ...,
  published_at: timestamp,
  platform_post_id: string,
  platform_post_url: string
}
```

## Dashboard Features

### Connection Status Badge
- **Not Connected**: Red badge with pulse animation
- **Connected**: Green badge with site name

### Connect Card
Shown when not connected:
- Eye-catching gradient icon
- Clear call-to-action
- OAuth connect button

### Published Posts Section
- Lists last 10 published posts
- Shows title, excerpt, publish date
- Link to view post on Wix
- Empty state when no posts

### Settings Panel
- Shows connected site info
- Publish mode selector (Publish/Draft)
- Auto-publish toggle
- Disconnect button

### API Activity Log
- Shows recent API requests (coming soon)
- Error logging and debugging info

## Environment Variables

Required environment variables in Supabase:

```bash
SUPABASE_URL=https://zcaxtyodksjtcpscasnw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WIX_CLIENT_ID=your_wix_client_id
WIX_CLIENT_SECRET=your_wix_client_secret
WIX_REDIRECT_URI=https://zcaxtyodksjtcpscasnw.supabase.co/functions/v1/wix-oauth-callback
APP_URL=https://www.getjetsuite.com
```

## Deployment

### Deploy to Supabase

```bash
# Navigate to project root
cd /path/to/Jet-suite

# Deploy the function
supabase functions deploy wix-dashboard

# Set environment variables (if not already set)
supabase secrets set WIX_CLIENT_ID=your_client_id
supabase secrets set WIX_CLIENT_SECRET=your_client_secret
```

### Wix App Configuration

In your Wix Developers dashboard:

1. Go to your app settings
2. Set the Dashboard URL to:
   ```
   https://zcaxtyodksjtcpscasnw.supabase.co/functions/v1/wix-dashboard?instanceId={{instanceId}}
   ```
3. Wix will automatically replace `{{instanceId}}` with the actual instance ID

## Development

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve the function locally
supabase functions serve wix-dashboard --env-file .env.local

# Test in browser
open http://localhost:54321/functions/v1/wix-dashboard?instanceId=test-123
```

### Testing OAuth Flow

To test the complete OAuth flow:

1. Install the Wix app on a test site
2. Open the dashboard from Wix
3. Click "Connect to Wix"
4. Authorize the app
5. Verify connection shows in dashboard
6. Check database for connection record

## Styling

The dashboard uses:
- **Tailwind CSS** (via CDN) for styling
- **Dark theme** (#1a1a1a background)
- **Gradient accents** (blue to purple)
- **Responsive design** (mobile, tablet, desktop)
- **Custom animations** (pulse, hover effects)

## Security

### CSRF Protection
- OAuth state parameter prevents CSRF attacks
- State includes random component for uniqueness

### Token Security
- Access tokens are encrypted in database
- Service role key required for database access
- CORS headers properly configured

### iFrame Security
- `X-Frame-Options: ALLOWALL` for Wix embedding
- CORS allows Wix origin

## Error Handling

The dashboard handles these error scenarios:

1. **Missing instanceId**: Shows default disconnected state
2. **Database errors**: Logs error, shows disconnected state
3. **OAuth errors**: Shows error message with details
4. **Connection failures**: Graceful fallback with error UI

## Future Enhancements

- [ ] Real-time post status updates
- [ ] API activity logging and display
- [ ] Bulk post management
- [ ] Analytics and insights
- [ ] User authentication integration
- [ ] Connection claiming flow for logged-in users
- [ ] Settings persistence (auto-publish, publish mode)
- [ ] Webhook configuration
- [ ] Post scheduling from dashboard

## Troubleshooting

### Dashboard doesn't load
- Check Supabase function is deployed
- Verify environment variables are set
- Check Supabase logs: `supabase functions logs wix-dashboard`

### OAuth fails
- Verify WIX_CLIENT_ID and WIX_CLIENT_SECRET are correct
- Check WIX_REDIRECT_URI matches Wix app settings
- Ensure OAuth callback function is deployed

### Connection not showing
- Check instanceId is correct
- Verify connection exists in database
- Check metadata.instance_id matches

### Posts not appearing
- Verify website_connection_id is correct
- Check blog_publications table has published posts
- Ensure status is 'published'

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/jet-suite/issues
- Documentation: https://www.getjetsuite.com/docs
- Email: support@getjetsuite.com
