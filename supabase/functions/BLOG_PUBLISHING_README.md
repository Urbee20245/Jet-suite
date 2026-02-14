# Blog Auto-Posting System for JetSuite

A complete system for publishing AI-generated blog content to WordPress, Squarespace, and Wix websites.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Edge Functions](#edge-functions)
- [API Usage Examples](#api-usage-examples)
- [OAuth Setup](#oauth-setup)
- [Cron Job Setup](#cron-job-setup)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This system enables users to:
- Connect their WordPress, Squarespace, and Wix websites
- Generate AI-powered featured images for blog posts
- Publish blog posts directly from JetSuite to their websites
- Schedule blog posts for automatic publishing
- Track publication status and retry failed publishes

## ✨ Features

### Platform Support
- **WordPress**: Application Password authentication (Basic Auth)
- **Squarespace**: OAuth 2.0 with automatic token refresh
- **Wix**: OAuth 2.0 with automatic token refresh

### Capabilities
- ✅ Secure credential storage with AES-256 encryption
- ✅ Featured image upload and generation (Stability AI, DALL-E 3)
- ✅ Blog post scheduling with timezone support
- ✅ Automatic retry logic for failed publishes
- ✅ Category and tag support
- ✅ SEO metadata (slug, meta description)
- ✅ Automatic OAuth token refresh

## 🏗️ Architecture

```
┌─────────────────┐
│   JetSuite UI   │
└────────┬────────┘
         │
         ├─── WordPress Connect ──────┐
         ├─── WordPress Publish ───────┤
         ├─── Squarespace OAuth ───────┤
         ├─── Squarespace Publish ─────┼──► Supabase Edge Functions
         ├─── Wix OAuth ───────────────┤
         ├─── Wix Publish ─────────────┤
         ├─── Generate Image ──────────┤
         └─── Schedule Cron ───────────┘
                 │
                 ▼
        ┌────────────────┐
        │   PostgreSQL   │
        │  (Supabase DB) │
        └────────────────┘
```

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Apply the SQL migration to create the required tables:

```bash
# Navigate to Supabase dashboard → SQL Editor
# Or use Supabase CLI:
supabase db push
```

Run the migration file:
```
supabase/migrations/20250215000000_blog_publishing_system.sql
```

This creates:
- `website_connections` table
- `blog_publications` table
- RLS policies
- Indexes and triggers

### Step 2: Generate Encryption Key

Generate a 32-byte (256-bit) encryption key for securing OAuth tokens:

```bash
# Generate encryption key
openssl rand -hex 32
```

Save this key securely - you'll need it for the `ENCRYPTION_KEY` environment variable.

### Step 3: Configure Environment Variables

In your Supabase dashboard, go to **Project Settings → Edge Functions** and add these environment variables:

```bash
# Required: Supabase (already configured)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required: Application URL
APP_URL=https://www.getjetsuite.com

# Required: Encryption
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# Optional: WordPress (if using WordPress)
# No additional config needed - users provide credentials

# Optional: Squarespace OAuth (if using Squarespace)
SQUARESPACE_CLIENT_ID=your-squarespace-client-id
SQUARESPACE_CLIENT_SECRET=your-squarespace-client-secret
SQUARESPACE_REDIRECT_URI=https://your-project.supabase.co/functions/v1/squarespace-oauth-callback

# Optional: Wix OAuth (if using Wix)
WIX_CLIENT_ID=your-wix-client-id
WIX_CLIENT_SECRET=your-wix-client-secret
WIX_REDIRECT_URI=https://your-project.supabase.co/functions/v1/wix-oauth-callback

# Optional: AI Image Generation
STABILITY_API_KEY=your-stability-ai-api-key
OPENAI_API_KEY=your-openai-api-key

# Optional: Cron Job Security
CRON_SECRET=your-random-secret-key-for-cron
```

### Step 4: Deploy Edge Functions

Deploy all Edge Functions to Supabase:

```bash
# Deploy all functions
supabase functions deploy wordpress-connect
supabase functions deploy wordpress-publish
supabase functions deploy squarespace-oauth-callback
supabase functions deploy squarespace-publish
supabase functions deploy wix-oauth-callback
supabase functions deploy wix-publish
supabase functions deploy generate-featured-image
supabase functions deploy schedule-blog-publish
```

Or deploy all at once:
```bash
supabase functions deploy
```

### Step 5: Set Up Cron Job (Optional)

For automatic scheduled publishing, set up a cron job:

**Option A: Supabase Cron (Recommended)**
- Go to Supabase Dashboard → Edge Functions
- Click on `schedule-blog-publish`
- Add Cron Trigger: `*/5 * * * *` (every 5 minutes)

**Option B: External Cron Service**
```bash
# Example: GitHub Actions (every 5 minutes)
curl -X POST \
  https://your-project.supabase.co/functions/v1/schedule-blog-publish \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) | `eyJhbGc...` |
| `APP_URL` | Your application URL | `https://www.getjetsuite.com` |
| `ENCRYPTION_KEY` | 32-byte hex key for token encryption | `a1b2c3d4e5f6...` |

### Optional Variables (by platform)

#### WordPress
No additional environment variables needed. Users provide:
- WordPress site URL
- WordPress username
- Application Password (generated in WordPress admin)

#### Squarespace
| Variable | Description |
|----------|-------------|
| `SQUARESPACE_CLIENT_ID` | OAuth app client ID |
| `SQUARESPACE_CLIENT_SECRET` | OAuth app client secret |
| `SQUARESPACE_REDIRECT_URI` | OAuth callback URL |

#### Wix
| Variable | Description |
|----------|-------------|
| `WIX_CLIENT_ID` | OAuth app client ID |
| `WIX_CLIENT_SECRET` | OAuth app client secret |
| `WIX_REDIRECT_URI` | OAuth callback URL |

#### AI Image Generation
| Variable | Description |
|----------|-------------|
| `STABILITY_API_KEY` | Stability AI API key (for image generation) |
| `OPENAI_API_KEY` | OpenAI API key (for DALL-E 3) |

#### Cron Security
| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Secret key for authenticating cron requests |

## 📊 Database Setup

### Tables Created

#### 1. `website_connections`
Stores website credentials and OAuth tokens (encrypted).

```sql
-- Key columns:
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- business_id: UUID (references business_profiles)
- platform: TEXT ('wordpress' | 'squarespace' | 'wix')
- website_url: TEXT
- site_name: TEXT
- wordpress_username: TEXT (for WordPress)
- wordpress_app_password: TEXT (encrypted)
- access_token: TEXT (encrypted, for OAuth)
- refresh_token: TEXT (encrypted, for OAuth)
- token_expires_at: TIMESTAMPTZ
- metadata: JSONB
- is_active: BOOLEAN
```

#### 2. `blog_publications`
Tracks blog posts and their publishing status.

```sql
-- Key columns:
- id: UUID (primary key)
- user_id: UUID
- business_id: UUID
- website_connection_id: UUID (references website_connections)
- draft_id: UUID (optional reference to content_drafts)
- title: TEXT
- content: TEXT (HTML or markdown)
- excerpt: TEXT
- slug: TEXT
- featured_image_url: TEXT
- categories: TEXT[]
- tags: TEXT[]
- status: TEXT ('draft' | 'scheduled' | 'publishing' | 'published' | 'failed')
- scheduled_publish_at: TIMESTAMPTZ
- published_at: TIMESTAMPTZ
- platform_post_id: TEXT
- platform_post_url: TEXT
- error_message: TEXT
- retry_count: INTEGER
```

### Row Level Security (RLS)

All tables have RLS enabled with these policies:
- Users can view/edit their own records
- Service role has full access (for Edge Functions)

## 🔧 Edge Functions

### 1. wordpress-connect
**Purpose**: Validate and save WordPress credentials

**Request**:
```json
{
  "user_id": "uuid",
  "business_id": "uuid",
  "website_url": "https://myblog.com",
  "username": "admin",
  "app_password": "xxxx xxxx xxxx xxxx xxxx xxxx"
}
```

### 2. wordpress-publish
**Purpose**: Publish blog post to WordPress

**Request**:
```json
{
  "publication_id": "uuid"
}
```

### 3. squarespace-oauth-callback
**Purpose**: Handle OAuth callback from Squarespace

**Query Parameters**: `code`, `state`

### 4. squarespace-publish
**Purpose**: Publish blog post to Squarespace

**Request**:
```json
{
  "publication_id": "uuid"
}
```

### 5. wix-oauth-callback
**Purpose**: Handle OAuth callback from Wix

**Query Parameters**: `code`, `state`

### 6. wix-publish
**Purpose**: Publish blog post to Wix

**Request**:
```json
{
  "publication_id": "uuid"
}
```

### 7. generate-featured-image
**Purpose**: Generate AI-powered featured images

**Request**:
```json
{
  "prompt": "A modern office workspace with laptop",
  "provider": "stability",
  "style": "photographic",
  "aspect_ratio": "16:9"
}
```

### 8. schedule-blog-publish
**Purpose**: Cron job to publish scheduled posts

**Request**: POST with Bearer token (CRON_SECRET)

## 📚 API Usage Examples

See `BLOG_PUBLISHING_API_EXAMPLES.md` for detailed API examples.

## 🔑 OAuth Setup

### Squarespace OAuth Setup

1. Go to [Squarespace Developers](https://developers.squarespace.com/)
2. Create a new OAuth app
3. Set redirect URI: `https://YOUR_PROJECT.supabase.co/functions/v1/squarespace-oauth-callback`
4. Request scopes: `website.blog`, `website.blog.read`
5. Copy Client ID and Client Secret to environment variables

### Wix OAuth Setup

1. Go to [Wix Developers](https://dev.wix.com/)
2. Create a new app
3. Enable OAuth
4. Set redirect URI: `https://YOUR_PROJECT.supabase.co/functions/v1/wix-oauth-callback`
5. Request permissions: `Manage Blog`
6. Copy App ID and Secret Key to environment variables

### WordPress Application Passwords

Users generate Application Passwords in WordPress:
1. Go to WordPress Admin → Users → Profile
2. Scroll to "Application Passwords"
3. Enter app name: "JetSuite"
4. Click "Add New Application Password"
5. Copy the generated password (format: `xxxx xxxx xxxx xxxx`)

## ⏰ Cron Job Setup

### Supabase Cron (Recommended)

```bash
# In Supabase Dashboard:
1. Go to Edge Functions
2. Click on 'schedule-blog-publish'
3. Add Cron Trigger
4. Set schedule: */5 * * * * (every 5 minutes)
```

### GitHub Actions

```yaml
name: Blog Publishing Cron
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger publish
        run: |
          curl -X POST \
            ${{ secrets.SUPABASE_URL }}/functions/v1/schedule-blog-publish \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 🧪 Testing

### Test WordPress Connection

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/wordpress-connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "user_id": "user-uuid",
    "website_url": "https://myblog.com",
    "username": "admin",
    "app_password": "xxxx xxxx xxxx xxxx"
  }'
```

### Test Image Generation

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/generate-featured-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "prompt": "Modern minimalist office workspace",
    "provider": "stability",
    "aspect_ratio": "16:9"
  }'
```

### Test Publishing

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/wordpress-publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "publication_id": "publication-uuid"
  }'
```

## 🔍 Troubleshooting

### WordPress Connection Issues

**Error: "Invalid username or Application Password"**
- Verify WordPress username is correct
- Ensure Application Password was copied correctly (no extra spaces)
- Check WordPress REST API is enabled: `https://yoursite.com/wp-json`

**Error: "WordPress REST API not found"**
- Verify WordPress is installed and running
- Check if REST API is disabled by security plugin
- Test manually: `curl https://yoursite.com/wp-json`

### OAuth Issues

**Error: "Invalid OAuth state"**
- State token may have expired (valid for 10 minutes)
- User may have clicked back button during OAuth flow
- Ensure `oauth_states` table exists and is accessible

**Error: "Token refresh failed"**
- Refresh token may be invalid or expired
- User may need to reconnect their account
- Check OAuth app credentials are correct

### Publishing Failures

**Error: "Connection not found"**
- Website connection may have been deleted
- User may need to reconnect their website
- Check `website_connections` table for the connection

**Error: "Authentication failed"**
- OAuth token may have expired
- For WordPress, Application Password may have been revoked
- Check `token_expires_at` in `website_connections`

### Image Generation Issues

**Error: "STABILITY_API_KEY not configured"**
- Add Stability AI API key to environment variables
- Or use DALL-E by setting `provider: "dalle"`

**Error: "Rate limit exceeded"**
- Check your API usage and limits
- Implement rate limiting in your frontend
- Consider caching generated images

## 📝 Notes for Beginners

### What is an Edge Function?
Edge Functions are serverless functions that run on Supabase's infrastructure. They're like mini-servers that handle specific tasks (like publishing a blog post).

### What is OAuth?
OAuth is a secure way to let users connect their accounts (like Squarespace or Wix) without sharing their password. Think of it like "Sign in with Google" - you authorize the app, but don't give it your password.

### What is Encryption?
We encrypt sensitive data (like passwords and tokens) so that even if someone accesses the database, they can't read the sensitive information. It's like putting data in a locked safe.

### What is a Cron Job?
A cron job is a scheduled task that runs automatically. For example, checking every 5 minutes if any blog posts need to be published.

### What is RLS (Row Level Security)?
RLS ensures users can only see and edit their own data in the database. It's like having separate folders for each user that they can't access each other's files.

## 🎉 Success!

Your blog auto-posting system is now set up! Users can:
1. Connect their WordPress, Squarespace, or Wix websites
2. Generate AI-powered featured images
3. Publish blog posts directly from JetSuite
4. Schedule posts for automatic publishing

For API usage examples and more details, see `BLOG_PUBLISHING_API_EXAMPLES.md`.

## 🆘 Support

If you encounter issues:
1. Check the Edge Function logs in Supabase Dashboard
2. Verify all environment variables are set correctly
3. Test each function individually
4. Review the troubleshooting section above

---

**Built with ❤️ for JetSuite**
