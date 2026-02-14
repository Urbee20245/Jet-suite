# Blog Publishing API Examples

Complete API examples for testing all Edge Functions in the blog publishing system.

## 📋 Prerequisites

Before testing, you need:
1. Your Supabase project URL
2. Your Supabase Anon Key (for authenticated requests)
3. A user UUID (from auth.users table)
4. A business UUID (from business_profiles table)

```bash
# Set these as environment variables for easier testing
export SUPABASE_URL="https://your-project.supabase.co"
export ANON_KEY="your-anon-key"
export USER_ID="user-uuid"
export BUSINESS_ID="business-uuid"
```

---

## 1. WordPress Connection

### Connect WordPress Website

**Endpoint**: `POST /wordpress-connect`

**Description**: Validates WordPress credentials and saves connection.

**Request**:
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/wordpress-connect" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "user_id": "'${USER_ID}'",
    "business_id": "'${BUSINESS_ID}'",
    "website_url": "https://myblog.com",
    "username": "admin",
    "app_password": "xxxx xxxx xxxx xxxx xxxx xxxx"
  }'
```

**Response (Success)**:
```json
{
  "success": true,
  "connection_id": "550e8400-e29b-41d4-a716-446655440000",
  "site_name": "My Awesome Blog",
  "site_url": "https://myblog.com",
  "categories": 5
}
```

**Response (Error)**:
```json
{
  "error": "Invalid username or Application Password"
}
```

---

## 2. WordPress Publishing

### Publish Blog Post to WordPress

**Endpoint**: `POST /wordpress-publish`

**Description**: Publishes a blog post to WordPress.

First, create a blog publication record:
```sql
INSERT INTO blog_publications (
  user_id,
  business_id,
  website_connection_id,
  title,
  content,
  excerpt,
  slug,
  featured_image_url,
  categories,
  tags,
  status
) VALUES (
  'user-uuid',
  'business-uuid',
  'connection-uuid',
  'How to Boost Your Productivity',
  '<p>Here are 10 tips to boost your productivity...</p>',
  'Learn 10 proven tips to boost your productivity at work.',
  'boost-productivity-tips',
  'https://example.com/image.jpg',
  ARRAY['1', '5'],  -- WordPress category IDs
  ARRAY['productivity', 'tips'],
  'draft'
);
```

**Request**:
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/wordpress-publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "publication_id": "publication-uuid"
  }'
```

**Response (Success)**:
```json
{
  "success": true,
  "post_id": 123,
  "post_url": "https://myblog.com/boost-productivity-tips",
  "published_at": "2025-02-15T10:30:00Z"
}
```

**Response (Already Published)**:
```json
{
  "success": true,
  "already_published": true,
  "post_id": "123",
  "post_url": "https://myblog.com/boost-productivity-tips",
  "published_at": "2025-02-15T10:30:00Z"
}
```

---

## 3. Squarespace OAuth

### Step 1: Create OAuth State

Create a state token in your frontend/backend:
```sql
INSERT INTO oauth_states (
  state,
  platform,
  user_id,
  business_id,
  expires_at,
  metadata
) VALUES (
  'random-state-token-123',
  'squarespace',
  'user-uuid',
  'business-uuid',
  NOW() + INTERVAL '10 minutes',
  '{"redirect_url": "/blog-settings"}'::jsonb
);
```

### Step 2: Redirect User to Squarespace

Redirect user to Squarespace OAuth URL:
```
https://login.squarespace.com/api/1/login/oauth/provider/authorize?
  client_id=YOUR_CLIENT_ID
  &redirect_uri=https://your-project.supabase.co/functions/v1/squarespace-oauth-callback
  &scope=website.blog,website.blog.read
  &state=random-state-token-123
  &response_type=code
```

### Step 3: Squarespace Redirects to Callback

Squarespace will redirect to:
```
https://your-project.supabase.co/functions/v1/squarespace-oauth-callback?
  code=AUTH_CODE
  &state=random-state-token-123
```

The callback function handles this automatically and redirects back to your app:
```
https://www.getjetsuite.com/blog-settings?success=squarespace_connected
```

---

## 4. Squarespace Publishing

### Publish Blog Post to Squarespace

**Endpoint**: `POST /squarespace-publish`

**Request**:
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/squarespace-publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "publication_id": "publication-uuid"
  }'
```

**Response (Success)**:
```json
{
  "success": true,
  "post_id": "abc123xyz",
  "post_url": "https://mysite.squarespace.com/blog/boost-productivity",
  "published_at": "2025-02-15T10:30:00Z"
}
```

---

## 5. Wix OAuth

### Step 1: Create OAuth State

```sql
INSERT INTO oauth_states (
  state,
  platform,
  user_id,
  business_id,
  expires_at,
  metadata
) VALUES (
  'random-state-token-456',
  'wix',
  'user-uuid',
  'business-uuid',
  NOW() + INTERVAL '10 minutes',
  '{"redirect_url": "/blog-settings"}'::jsonb
);
```

### Step 2: Redirect User to Wix

```
https://www.wix.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID
  &redirect_uri=https://your-project.supabase.co/functions/v1/wix-oauth-callback
  &scope=blog.manage
  &state=random-state-token-456
  &response_type=code
```

### Step 3: Wix Redirects to Callback

Wix redirects to callback, which handles everything and redirects to:
```
https://www.getjetsuite.com/blog-settings?success=wix_connected
```

---

## 6. Wix Publishing

### Publish Blog Post to Wix

**Endpoint**: `POST /wix-publish`

**Request**:
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/wix-publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "publication_id": "publication-uuid"
  }'
```

**Response (Success)**:
```json
{
  "success": true,
  "post_id": "wix-post-id-123",
  "post_url": "https://mysite.wixsite.com/blog/boost-productivity",
  "published_at": "2025-02-15T10:30:00Z"
}
```

---

## 7. Generate Featured Image

### Generate with Stability AI

**Endpoint**: `POST /generate-featured-image`

**Request**:
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/generate-featured-image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "prompt": "A modern minimalist office workspace with laptop and coffee",
    "provider": "stability",
    "style": "photographic",
    "aspect_ratio": "16:9"
  }'
```

**Response (Success)**:
```json
{
  "success": true,
  "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "provider": "stability",
  "prompt": "A modern minimalist office workspace with laptop and coffee",
  "aspect_ratio": "16:9"
}
```

### Generate with DALL-E 3

**Request**:
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/generate-featured-image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "prompt": "Futuristic city skyline at sunset, digital art style",
    "provider": "dalle",
    "aspect_ratio": "16:9"
  }'
```

**Response (Success)**:
```json
{
  "success": true,
  "image_url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "provider": "dalle",
  "prompt": "Futuristic city skyline at sunset, digital art style",
  "aspect_ratio": "16:9"
}
```

---

## 8. Scheduled Publishing Cron

### Trigger Scheduled Publish

**Endpoint**: `POST /schedule-blog-publish`

**Description**: Checks for and publishes all scheduled blog posts.

**Request**:
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/schedule-blog-publish" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Response (Success)**:
```json
{
  "success": true,
  "timestamp": "2025-02-15T10:30:00Z",
  "posts_processed": 5,
  "posts_published": 4,
  "posts_failed": 1,
  "details": [
    {
      "post_id": "uuid-1",
      "title": "Post 1",
      "platform": "wordpress",
      "status": "published"
    },
    {
      "post_id": "uuid-2",
      "title": "Post 2",
      "platform": "squarespace",
      "status": "failed",
      "error": "Authentication failed"
    }
  ]
}
```

---

## 9. Complete End-to-End Example

### Scenario: User wants to publish a blog post to WordPress

#### Step 1: Connect WordPress Website

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/wordpress-connect" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "user_id": "'${USER_ID}'",
    "business_id": "'${BUSINESS_ID}'",
    "website_url": "https://myblog.com",
    "username": "admin",
    "app_password": "abcd efgh ijkl mnop qrst uvwx"
  }'
```

Save the `connection_id` from the response.

#### Step 2: Generate Featured Image (Optional)

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/generate-featured-image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "prompt": "Professional workspace with laptop and notebook",
    "provider": "stability",
    "aspect_ratio": "16:9"
  }'
```

Save the `image_url` from the response.

#### Step 3: Create Blog Publication Record

```sql
INSERT INTO blog_publications (
  user_id,
  business_id,
  website_connection_id,
  title,
  content,
  excerpt,
  slug,
  featured_image_url,
  status
) VALUES (
  'user-uuid',
  'business-uuid',
  'connection-uuid-from-step-1',
  '10 Tips for Remote Work Success',
  '<h1>10 Tips for Remote Work Success</h1><p>Remote work is here to stay...</p>',
  'Discover proven strategies for thriving in remote work environments.',
  'remote-work-success-tips',
  'data:image/png;base64,iVBORw0KGgo...', -- from step 2
  'draft'
) RETURNING id;
```

Save the `id` (publication_id).

#### Step 4: Publish Immediately

```bash
export PUBLICATION_ID="publication-uuid-from-step-3"

curl -X POST "${SUPABASE_URL}/functions/v1/wordpress-publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "publication_id": "'${PUBLICATION_ID}'"
  }'
```

#### Step 5: Verify Publication

Query the database to check status:
```sql
SELECT
  id,
  title,
  status,
  platform_post_url,
  published_at,
  error_message
FROM blog_publications
WHERE id = 'publication-uuid-from-step-3';
```

---

## 10. Schedule a Blog Post

### Create Scheduled Publication

```sql
INSERT INTO blog_publications (
  user_id,
  business_id,
  website_connection_id,
  title,
  content,
  excerpt,
  slug,
  featured_image_url,
  status,
  scheduled_publish_at,
  timezone
) VALUES (
  'user-uuid',
  'business-uuid',
  'connection-uuid',
  'Future Blog Post',
  '<p>This will be published tomorrow...</p>',
  'A post scheduled for tomorrow.',
  'future-blog-post',
  'https://example.com/image.jpg',
  'scheduled', -- Important: set status to 'scheduled'
  '2025-02-16T14:00:00Z', -- Tomorrow at 2 PM UTC
  'America/New_York'
);
```

The cron job will automatically publish this post when the scheduled time arrives.

---

## 11. Error Handling Examples

### Handle Connection Not Found

```bash
# Try to publish with invalid publication_id
curl -X POST "${SUPABASE_URL}/functions/v1/wordpress-publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "publication_id": "invalid-uuid"
  }'
```

**Response**:
```json
{
  "error": "Publication not found"
}
```

### Handle Invalid Credentials

```bash
# Try to connect with invalid WordPress password
curl -X POST "${SUPABASE_URL}/functions/v1/wordpress-connect" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "user_id": "'${USER_ID}'",
    "website_url": "https://myblog.com",
    "username": "admin",
    "app_password": "wrong-password"
  }'
```

**Response**:
```json
{
  "error": "Invalid username or Application Password"
}
```

---

## 12. Testing Checklist

Use this checklist to verify all functions work:

- [ ] WordPress connection works
- [ ] WordPress publish works
- [ ] Squarespace OAuth flow works
- [ ] Squarespace publish works
- [ ] Wix OAuth flow works
- [ ] Wix publish works
- [ ] Image generation with Stability AI works
- [ ] Image generation with DALL-E works
- [ ] Scheduled publishing cron works
- [ ] Error handling works correctly
- [ ] RLS policies prevent unauthorized access
- [ ] Token refresh works for expired OAuth tokens

---

## 13. Testing with Postman

Import this Postman collection to test all endpoints:

```json
{
  "info": {
    "name": "JetSuite Blog Publishing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "supabase_url",
      "value": "https://your-project.supabase.co"
    },
    {
      "key": "anon_key",
      "value": "your-anon-key"
    },
    {
      "key": "user_id",
      "value": "user-uuid"
    }
  ],
  "item": [
    {
      "name": "WordPress Connect",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{anon_key}}"
          }
        ],
        "url": "{{supabase_url}}/functions/v1/wordpress-connect",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"user_id\": \"{{user_id}}\",\n  \"website_url\": \"https://myblog.com\",\n  \"username\": \"admin\",\n  \"app_password\": \"xxxx xxxx xxxx\"\n}"
        }
      }
    }
  ]
}
```

---

## 💡 Tips for Testing

1. **Use a test WordPress site** - Don't test on production
2. **Check logs** - View Edge Function logs in Supabase Dashboard
3. **Test incrementally** - Test one function at a time
4. **Verify database** - Check tables after each operation
5. **Test error cases** - Try invalid inputs to verify error handling

---

**Happy Testing! 🚀**
