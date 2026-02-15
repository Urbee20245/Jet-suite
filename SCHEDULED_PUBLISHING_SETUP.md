# Scheduled Publishing System - Setup Guide

Complete implementation of scheduled publishing for blog posts and social media posts in JetSuite.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Edge Functions](#edge-functions)
- [Cron Jobs](#cron-jobs)
- [Frontend Integration](#frontend-integration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This system enables automatic publishing of:
- **Blog Posts** to WordPress, Squarespace, and Wix (every 5 minutes)
- **Social Media Posts** to Facebook, Instagram, Twitter, LinkedIn, and TikTok (every minute)

All posts are optimized with **AI-powered SEO keywords, tags, and meta descriptions** using Google Gemini AI.

## ✨ Features

### Blog Publishing
- ✅ Schedule blog posts for future publication
- ✅ AI-powered SEO optimization (keywords, tags, meta description, slug)
- ✅ Automatic WordPress category/tag creation by name
- ✅ Support for WordPress, Squarespace, and Wix
- ✅ Featured image upload
- ✅ Retry logic (max 3 retries with exponential backoff)
- ✅ Timezone-aware scheduling

### Social Media Publishing
- ✅ Schedule posts to multiple platforms simultaneously
- ✅ Support for Facebook, Instagram, Twitter/X, LinkedIn, and TikTok
- ✅ Image attachment support
- ✅ Platform-specific API integration
- ✅ Retry logic for failed posts

### SEO Optimization
- ✅ Google Gemini AI integration
- ✅ 5-10 SEO-optimized keywords
- ✅ 3-5 relevant tags
- ✅ Meta description (150-160 characters)
- ✅ Optimized URL slug
- ✅ Editable suggestions in UI

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL + pg_cron                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Cron Job: schedule-blog-publish (every 5 minutes)    │  │
│  │  Cron Job: schedule-social-publish (every 1 minute)   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Edge Functions                   │
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │ schedule-blog-publish│  │ schedule-social-publish     │  │
│  │ - Queries DB         │  │ - Queries DB                │  │
│  │ - Calls publish funcs│  │ - Publishes to platforms    │  │
│  │ - Updates status     │  │ - Updates status            │  │
│  └──────────────────────┘  └─────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │ wordpress-publish    │  │ optimize-blog-keywords       │  │
│  │ - Calls optimizer    │  │ - Google Gemini AI           │  │
│  │ - Creates tags/cats  │  │ - Returns SEO data           │  │
│  │ - Publishes to WP    │  │                              │  │
│  └──────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External APIs                              │
│  WordPress REST API | Squarespace API | Wix API             │
│  Facebook Graph API | Instagram API | Twitter API           │
│  LinkedIn API | TikTok API | Google Gemini API              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Setup Instructions

### 1. Prerequisites

- Supabase project (ID: `zcaxtyodksjtcpscasnw`)
- PostgreSQL with pg_cron extension
- Node.js 18+ for frontend
- Google Gemini API key
- Social media API credentials (OAuth tokens)

### 2. Environment Variables

Add these to your Supabase Edge Functions settings:

```bash
# Supabase
SUPABASE_URL=https://zcaxtyodksjtcpscasnw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Security
CRON_SECRET=your-random-secret-key-here
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Social Media OAuth (if using)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

### 3. Database Migrations

Run migrations in order:

```bash
# 1. Enable pg_cron and update tables
supabase db push supabase/migrations/20250215100000_enable_pgcron_and_updates.sql

# 2. Setup cron jobs
supabase db push supabase/migrations/20250215110000_setup_cron_jobs.sql
```

Or run manually in Supabase SQL Editor:

1. Go to Supabase Dashboard > SQL Editor
2. Run each migration file in order
3. Verify with: `SELECT * FROM cron.job;`

### 4. Configure Service Role Key for Cron Jobs

**Option A: PostgreSQL Settings (Recommended)**

```sql
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
```

**Option B: Supabase Vault**

1. Go to Project Settings > Vault
2. Create new secret: `service_role_key`
3. Update cron jobs to use: `vault.get_secret('service_role_key')`

### 5. Deploy Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy schedule-blog-publish
supabase functions deploy schedule-social-publish
supabase functions deploy optimize-blog-keywords
supabase functions deploy wordpress-publish

# Verify deployment
supabase functions list
```

### 6. Test Edge Functions

```bash
# Test optimize-blog-keywords
curl -X POST https://zcaxtyodksjtcpscasnw.supabase.co/functions/v1/optimize-blog-keywords \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "10 Tips for Growing Your Coffee Shop",
    "content": "Running a successful coffee shop requires..."
  }'

# Test schedule-blog-publish (requires CRON_SECRET)
curl -X POST https://zcaxtyodksjtcpscasnw.supabase.co/functions/v1/schedule-blog-publish \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test schedule-social-publish (requires CRON_SECRET)
curl -X POST https://zcaxtyodksjtcpscasnw.supabase.co/functions/v1/schedule-social-publish \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 📦 Database Migrations

### Migration 1: Enable pg_cron and Update Tables
**File:** `20250215100000_enable_pgcron_and_updates.sql`

- Enables `pg_cron` extension
- Adds `retry_count` and `last_retry_at` to `scheduled_posts`
- Adds `optimized_keywords`, `optimized_tags`, `auto_optimized` to `blog_publications`
- Adds service role policies for cron job access

### Migration 2: Setup Cron Jobs
**File:** `20250215110000_setup_cron_jobs.sql`

- Creates cron job: `schedule-blog-publish` (every 5 minutes)
- Creates cron job: `schedule-social-publish` (every minute)
- Uses `net.http_post` to call edge functions
- Authenticates with service role key

## ⚙️ Edge Functions

### 1. schedule-blog-publish

**Path:** `supabase/functions/schedule-blog-publish/index.ts`

**Schedule:** Every 5 minutes (`*/5 * * * *`)

**Function:**
- Queries `blog_publications` for posts with `status='scheduled'` and `scheduled_publish_at <= NOW()`
- Calls appropriate platform publish function (wordpress-publish, squarespace-publish, wix-publish)
- Updates status to `publishing` → `published` or `failed`
- Implements retry logic (max 3 retries)

**Authentication:** Requires `CRON_SECRET` in Authorization header

### 2. schedule-social-publish

**Path:** `supabase/functions/schedule-social-publish/index.ts`

**Schedule:** Every minute (`* * * * *`)

**Function:**
- Queries `scheduled_posts` for posts with `status='scheduled'`, `scheduled_date <= TODAY`, and `scheduled_time <= NOW()`
- Publishes to each platform in `platforms` array
- Supports Facebook, Instagram, Twitter/X, LinkedIn, TikTok
- Updates status to `posting` → `posted` or `failed`
- Implements retry logic (max 3 retries with exponential backoff)

**Authentication:** Requires `CRON_SECRET` in Authorization header

**Platform APIs:**
- **Facebook:** Graph API v18.0 `/feed` endpoint
- **Instagram:** Graph API v18.0 media container → publish flow
- **Twitter/X:** API v2 `/tweets` endpoint
- **LinkedIn:** REST API v2 `/ugcPosts` endpoint
- **TikTok:** Content Posting API (requires approval)

### 3. optimize-blog-keywords

**Path:** `supabase/functions/optimize-blog-keywords/index.ts`

**Purpose:** Generate SEO-optimized keywords, tags, meta description, and slug

**Input:**
```json
{
  "title": "Blog Post Title",
  "content": "Blog post content...",
  "excerpt": "Optional excerpt"
}
```

**Output:**
```json
{
  "success": true,
  "keywords": ["keyword1", "keyword2", ...],
  "tags": ["tag1", "tag2", ...],
  "meta_description": "150-160 character description",
  "slug": "optimized-url-slug"
}
```

**AI Model:** Google Gemini 1.5 Flash (fast and efficient)

**Fallback:** Uses heuristic keyword extraction if AI fails

### 4. wordpress-publish (Updated)

**Path:** `supabase/functions/wordpress-publish/index.ts`

**Updates:**
- Calls `optimize-blog-keywords` before publishing (if not already optimized)
- Creates WordPress categories by name (uses first 3 keywords)
- Creates WordPress tags by name
- Saves optimization data to `blog_publications` table
- Includes meta description in post data

**WordPress REST API Endpoints:**
- `POST /wp-json/wp/v2/posts` - Create post
- `POST /wp-json/wp/v2/media` - Upload featured image
- `POST /wp-json/wp/v2/categories` - Create category
- `POST /wp-json/wp/v2/tags` - Create tag
- `GET /wp-json/wp/v2/categories?search=` - Search category
- `GET /wp-json/wp/v2/tags?search=` - Search tag

## 🕐 Cron Jobs

### Verify Cron Jobs

```sql
-- View all scheduled cron jobs
SELECT * FROM cron.job;

-- View cron job execution history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- View failed cron jobs
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Manually Trigger Cron Jobs

```sql
-- Trigger blog publish job
SELECT cron.schedule_run('schedule-blog-publish');

-- Trigger social publish job
SELECT cron.schedule_run('schedule-social-publish');
```

### Modify Cron Schedule

```sql
-- Change blog publish to every 10 minutes
SELECT cron.alter_job('schedule-blog-publish', schedule := '*/10 * * * *');

-- Change social publish to every 5 minutes
SELECT cron.alter_job('schedule-social-publish', schedule := '*/5 * * * *');
```

## 🖥️ Frontend Integration

### JetContent Component Updates

**File:** `tools/JetContent.tsx`

**New Features:**
1. **SEO Optimization Section**
   - "Optimize Keywords & SEO" button
   - Displays AI-generated keywords, tags, meta description, slug
   - Allows editing before scheduling
   - Shows character count for meta description

2. **Scheduling Enhancement**
   - Includes optimization data when scheduling posts
   - Sets `auto_optimized: true` flag

**User Flow:**
1. User generates blog post with AI
2. User clicks "Optimize Keywords & SEO"
3. AI generates SEO suggestions
4. User reviews and edits suggestions
5. User schedules post (optimization included automatically)
6. Cron job publishes post with optimized SEO data

## 🧪 Testing

### Test Blog Publishing

1. **Create a test blog post:**

```sql
INSERT INTO blog_publications (
  user_id,
  business_id,
  website_connection_id,
  title,
  content,
  status,
  scheduled_publish_at
) VALUES (
  'your-user-id',
  'your-business-id',
  'your-connection-id',
  'Test Blog Post',
  '<h1>Test Content</h1><p>This is a test.</p>',
  'scheduled',
  NOW() + INTERVAL '1 minute'
);
```

2. **Wait for cron job to run** (max 5 minutes)

3. **Check status:**

```sql
SELECT id, title, status, published_at, platform_post_url, error_message
FROM blog_publications
WHERE title = 'Test Blog Post';
```

### Test Social Publishing

1. **Create a test social post:**

```sql
INSERT INTO scheduled_posts (
  user_id,
  post_text,
  platforms,
  scheduled_date,
  scheduled_time,
  status
) VALUES (
  'your-user-id',
  'Test social media post #testing',
  '["facebook", "twitter"]'::jsonb,
  CURRENT_DATE,
  (NOW() + INTERVAL '1 minute')::time,
  'scheduled'
);
```

2. **Wait for cron job to run** (max 1 minute)

3. **Check status:**

```sql
SELECT id, post_text, status, posted_at, metadata
FROM scheduled_posts
WHERE post_text LIKE 'Test social%';
```

### Test SEO Optimization

1. Open JetContent tool in frontend
2. Generate a blog post
3. Click "Optimize Keywords & SEO"
4. Verify:
   - Keywords appear (5-10 items)
   - Tags appear (3-5 items)
   - Meta description shows (150-160 chars)
   - Slug is URL-safe
5. Edit suggestions and schedule post

## 🔧 Troubleshooting

### Cron Jobs Not Running

**Check if pg_cron is enabled:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

**Check cron job status:**
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'schedule-blog-publish')
ORDER BY start_time DESC LIMIT 5;
```

**Check service role key:**
```sql
SELECT current_setting('app.settings.service_role_key', true);
```

### Edge Functions Failing

**Check function logs:**
```bash
supabase functions logs schedule-blog-publish --limit 50
supabase functions logs schedule-social-publish --limit 50
```

**Common issues:**
- Missing environment variables
- Invalid CRON_SECRET
- Database connection errors
- API rate limits

### WordPress Publishing Fails

**Check connection:**
```sql
SELECT id, website_url, platform, is_active
FROM website_connections
WHERE platform = 'wordpress' AND is_active = true;
```

**Common issues:**
- Invalid application password
- WordPress REST API disabled
- SSL certificate errors
- Category/tag creation permissions

### SEO Optimization Not Working

**Check Gemini API key:**
- Verify `GEMINI_API_KEY` is set in edge function environment
- Test API key with direct API call
- Check API quota/limits

**Fallback behavior:**
- Function automatically falls back to heuristic extraction if AI fails
- Check logs for errors

### Social Media Publishing Fails

**Check social connections:**
```sql
SELECT id, platform, is_active, platform_user_id
FROM social_connections
WHERE is_active = true;
```

**Common issues:**
- Expired OAuth tokens (refresh_token needed)
- Invalid platform_page_id or platform_user_id
- API permissions not granted
- Rate limiting

**Platform-specific:**
- **Instagram:** Requires Business account and Facebook page
- **Twitter:** Requires elevated API access
- **LinkedIn:** Person URN format must be correct
- **TikTok:** Requires Content Posting API approval

## 📊 Monitoring

### Key Metrics to Monitor

```sql
-- Posts scheduled vs published today
SELECT
  COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
  COUNT(*) FILTER (WHERE status = 'published') as published,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM blog_publications
WHERE created_at::date = CURRENT_DATE;

-- Social posts by status
SELECT status, COUNT(*)
FROM scheduled_posts
GROUP BY status;

-- Failed posts needing attention
SELECT id, title, error_message, retry_count
FROM blog_publications
WHERE status = 'failed' AND retry_count >= 3;

-- Cron job success rate (last 24 hours)
SELECT
  jobname,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'succeeded') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM cron.job_run_details
WHERE start_time > NOW() - INTERVAL '24 hours'
GROUP BY jobname;
```

## 🎉 Success Indicators

✅ **Cron jobs running:**
```sql
SELECT * FROM cron.job;
-- Should show 2 jobs: schedule-blog-publish, schedule-social-publish
```

✅ **Edge functions deployed:**
```bash
supabase functions list
-- Should show all 4 functions
```

✅ **Database tables updated:**
```sql
\d blog_publications
-- Should have optimized_keywords, optimized_tags, auto_optimized columns
```

✅ **Test post publishes successfully:**
- Schedule a test post for 1 minute in the future
- Wait 5 minutes
- Check if status = 'published' and platform_post_url is set

## 🆘 Support

If you encounter issues:

1. Check edge function logs: `supabase functions logs <function-name>`
2. Check cron job history: `SELECT * FROM cron.job_run_details`
3. Verify environment variables are set
4. Test edge functions manually with curl
5. Review database constraints and policies

## 📝 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Google Gemini API](https://ai.google.dev/docs)

---

**Implementation Date:** February 15, 2025
**Status:** ✅ Complete and Ready for Production
**Version:** 1.0.0
