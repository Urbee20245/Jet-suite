# Admin Inbox Setup Guide

This guide explains how to set up the admin inbox feature to receive and manage emails sent to `support@getjetsuite.com`.

## Features

- View all emails sent to support@getjetsuite.com in the admin panel
- Read full email content (HTML and text)
- Delete unwanted emails
- Auto-refresh inbox
- Mark emails as new/read

## Database Migration

Run the database migration to create the `admin_inbox` table:

```bash
# Apply the migration in Supabase
psql -h your-supabase-host -U postgres -d your-database -f supabase/migrations/20260215_admin_inbox.sql
```

Or apply it directly in your Supabase SQL editor.

## Resend Webhook Configuration

### 1. Configure Inbound Email in Resend

1. Go to your Resend dashboard: https://resend.com/domains
2. Click on your domain (getjetsuite.com)
3. Navigate to the "Inbound" or "Webhooks" section
4. Add your webhook URL:
   ```
   https://your-production-domain.com/api/webhooks/resend-inbound
   ```

### 2. Configure Email Routing

In Resend, you need to set up email forwarding/routing for `support@getjetsuite.com`:

1. Go to Resend dashboard → Domains → Your domain
2. Find the "Inbound" or "Email Forwarding" section
3. Add a new rule:
   - **Email address**: `support@getjetsuite.com`
   - **Forward to**: Webhook URL (created above)

### 3. Verify Webhook

Resend will send a verification request to your webhook endpoint. The endpoint is already set up to handle this automatically.

## Using the Admin Inbox

1. Log in to the admin panel with your admin email
2. Click on the "Inbox" tab
3. You'll see all emails sent to support@getjetsuite.com
4. Click on any email to view its full content
5. Use the "Delete" button to remove emails

## API Endpoints

### Get Inbox Messages
```
GET /api/admin/inbox
Headers: { 'x-user-email': 'theivsightcompany@gmail.com' }

Response:
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "from_email": "user@example.com",
      "from_name": "John Doe",
      "to_email": "support@getjetsuite.com",
      "subject": "Need help",
      "html_body": "<p>Email content</p>",
      "text_body": "Email content",
      "received_at": "2026-02-15T10:00:00Z",
      "read": false,
      "created_at": "2026-02-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Delete Email
```
DELETE /api/admin/inbox?id=<message-id>
Headers: { 'x-user-email': 'theivsightcompany@gmail.com' }

Response:
{
  "success": true,
  "message": "Email deleted successfully"
}
```

### Mark as Read (Optional)
```
PATCH /api/admin/inbox
Headers: { 'x-user-email': 'theivsightcompany@gmail.com' }
Body: { "id": "<message-id>", "read": true }

Response:
{
  "success": true,
  "message": "Email updated successfully"
}
```

## Webhook Endpoint

The webhook endpoint receives POST requests from Resend:

```
POST /api/webhooks/resend-inbound

Payload (from Resend):
{
  "from": "User Name <user@example.com>",
  "to": "support@getjetsuite.com",
  "subject": "Email subject",
  "html": "<p>HTML content</p>",
  "text": "Plain text content"
}
```

## Testing

To test the setup:

1. Send a test email to support@getjetsuite.com from your personal email
2. Wait a few seconds
3. Check the admin inbox tab - your email should appear
4. Click to view the full content
5. Test the delete functionality

## Troubleshooting

### Emails not appearing in inbox

1. Check Resend dashboard → Logs to see if the email was received
2. Check if the webhook is configured correctly
3. Verify the webhook URL is accessible
4. Check your server logs for any errors in `/api/webhooks/resend-inbound`

### Webhook errors

1. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in your environment variables
2. Check that the `admin_inbox` table exists in your database
3. Verify Row Level Security policies allow service_role access

### Can't delete emails

1. Ensure you're logged in with the admin email (theivsightcompany@gmail.com)
2. Check browser console for any errors
3. Verify the API endpoint is accessible

## Security Notes

- Only admin users (authenticated with the admin email) can access the inbox
- The webhook endpoint is public but doesn't expose sensitive data
- All database operations use Row Level Security with service_role bypass
- Emails are stored with proper sanitization

## Future Enhancements

Potential improvements:
- Reply to emails directly from the inbox
- Archive emails instead of deleting
- Search and filter functionality
- Attachments support
- Email labels/tags
- Multi-user admin access with roles
