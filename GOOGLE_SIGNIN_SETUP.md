# Google Sign-In Authentication Setup Guide

This guide explains how to set up Google Sign-In for **user authentication** in JetSuite using Supabase Auth.

> **Note**: This is different from the Google Business Profile OAuth (documented in `GOOGLE_OAUTH_SETUP.md`), which is used for social media connections, not user login.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Google Cloud Console Setup](#google-cloud-console-setup)
4. [Supabase Dashboard Configuration](#supabase-dashboard-configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Overview

This implementation provides:
- ✅ Google Sign-In button on LoginPage
- ✅ Seamless OAuth flow via Supabase Auth
- ✅ Automatic session management
- ✅ Error handling and loading states
- ✅ Consistent UI with existing login methods

### Architecture

```
User clicks "Sign in with Google"
  → Supabase Auth initiates OAuth flow
  → Google OAuth consent screen
  → Google redirects back to app with auth code
  → Supabase Auth exchanges code for session
  → User is automatically logged in
  → App redirects to dashboard
```

---

## Prerequisites

- Supabase project with Auth enabled
- Google Cloud Platform account
- JetSuite application deployed or running locally

---

## Google Cloud Console Setup

### 1. Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
   - **Project Name**: "JetSuite Authentication" (or your preferred name)
   - **Project ID**: Will be auto-generated (e.g., `jetsuite-auth-123456`)

### 2. Create OAuth 2.0 Client ID

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first (see next section)
4. Application type: **Web application**
5. Name: "JetSuite User Authentication"

6. Add **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   https://www.getjetsuite.com
   https://getjetsuite.com
   ```

7. Add **Authorized redirect URIs**:
   ```
   http://localhost:5173/login
   https://www.getjetsuite.com/login
   https://getjetsuite.com/login
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```

   Replace `<your-supabase-project-ref>` with your actual Supabase project reference ID.
   You can find this in your Supabase project settings.

8. Click **Create**

9. Save your credentials:
   - **Client ID**: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz`

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. User Type: **External** (or **Internal** if using Google Workspace)
3. Click **Create**

4. Fill in **App Information**:
   - **App name**: JetSuite
   - **User support email**: your-email@example.com
   - **App logo**: (Optional) Upload your logo
   - **Application home page**: https://www.getjetsuite.com
   - **Application privacy policy**: https://www.getjetsuite.com/privacy
   - **Application terms of service**: https://www.getjetsuite.com/terms

5. **Developer contact information**:
   - Email: your-email@example.com

6. Click **Save and Continue**

7. **Scopes** (Optional step - default scopes are sufficient):
   - The default scopes (email, profile, openid) are automatically included
   - You don't need to add additional scopes for basic sign-in
   - Click **Save and Continue**

8. **Test users** (Required for External apps in testing):
   - Add email addresses that can test the OAuth flow
   - Example: test-user@example.com
   - Click **Save and Continue**

9. **Summary**:
   - Review your settings
   - Click **Back to Dashboard**

### 4. Publishing Your App (Production Only)

For production use, you need to verify your app:

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Submit for verification (required if you have more than 100 users)
4. Google will review your app (can take several days)

For development and testing, keep the app in **Testing** mode.

---

## Supabase Dashboard Configuration

### 1. Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list of providers
5. Toggle **Enable Sign in with Google** to ON

### 2. Configure Google OAuth Credentials

1. In the Google provider settings, add:
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console

2. Note the **Callback URL** shown:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   Make sure this URL is added to your Google OAuth Client's Authorized redirect URIs (from step 2.7 above)

3. Click **Save**

### 3. Configure Redirect URLs (Optional)

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add your allowed redirect URLs:
   ```
   http://localhost:5173/login
   https://www.getjetsuite.com/login
   https://getjetsuite.com/login
   ```

3. Set **Site URL** to:
   ```
   https://www.getjetsuite.com
   ```
   (or your primary domain)

---

## Testing

### 1. Local Development Testing

1. Start your local development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:5173/login`

3. Click the **Sign in with Google** button

4. Complete the OAuth flow:
   - Select your Google account
   - Review permissions
   - Click **Allow**

5. You should be redirected back to the app and logged in

6. Verify the session:
   - Open browser DevTools > Application > Local Storage
   - Check for `supabase.auth.token` key
   - Verify user data is present

### 2. Check Supabase Auth Logs

1. Go to Supabase Dashboard > **Authentication** > **Users**
2. Verify new user was created with Google provider
3. Check **Authentication** > **Logs** for any errors

### 3. Test Error Scenarios

Test these scenarios to ensure proper error handling:

1. **User cancels OAuth flow**:
   - Click Google Sign-In
   - Cancel at the Google consent screen
   - Verify user stays on login page with appropriate message

2. **Network failure**:
   - Simulate slow/offline network
   - Click Google Sign-In
   - Verify error message appears

3. **Invalid configuration**:
   - Temporarily disable Google provider in Supabase
   - Attempt sign-in
   - Verify error message is shown

---

## Troubleshooting

### Common Issues

#### 1. "redirect_uri_mismatch" Error

**Cause**: The redirect URI in your Google OAuth Client doesn't match the one being used.

**Solution**:
- Verify the Supabase callback URL is added to Google Cloud Console:
  ```
  https://<your-project-ref>.supabase.co/auth/v1/callback
  ```
- Check for exact matches (no trailing slashes, correct protocol)
- Wait 5 minutes after making changes in Google Cloud Console

#### 2. "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not properly configured or app not published.

**Solution**:
- Complete all required fields in OAuth consent screen
- Add your email as a test user
- Keep app in Testing mode for development
- For production, submit app for verification

#### 3. Google Sign-In Button Not Working

**Cause**: Supabase client not initialized or Google provider not enabled.

**Solution**:
- Check browser console for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in `.env`
- Verify Google provider is enabled in Supabase Dashboard
- Check that `getSupabaseClient()` returns a valid client

#### 4. User Signed In But Not Redirected

**Cause**: `onLoginSuccess` callback not being triggered.

**Solution**:
- Check `App.tsx` auth state listener (should be in place)
- Verify session is created in Supabase
- Check browser console for navigation errors

#### 5. "Authentication service is currently unavailable"

**Cause**: Missing Supabase environment variables.

**Solution**:
- Verify `.env` file exists with:
  ```bash
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```
- Restart dev server after adding variables
- Check that variables are correctly loaded: `console.log(import.meta.env.VITE_SUPABASE_URL)`

### Debug Logging

Enable detailed logging to troubleshoot issues:

```typescript
// In LoginPage.tsx handleGoogleSignIn function
console.log('Initiating Google OAuth...');
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/login`,
  },
});
console.log('OAuth response:', { data, error });
```

### Supabase Auth Logs

Check Supabase logs for detailed error information:

1. Go to Supabase Dashboard > **Logs** > **Auth Logs**
2. Filter by timestamp of your test
3. Look for errors related to Google OAuth

### Google Cloud Console Logs

Check Google OAuth logs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Check usage statistics and any error logs

---

## Security Best Practices

1. **Never commit credentials**: Don't commit `.env` files with real credentials
2. **Use HTTPS in production**: Always use secure connections for OAuth
3. **Restrict redirect URIs**: Only add legitimate redirect URIs to Google OAuth Client
4. **Monitor auth logs**: Regularly check Supabase Auth logs for suspicious activity
5. **Keep secrets secure**: Store Client Secret in Supabase Dashboard, not in frontend code
6. **Enable MFA**: Consider enabling multi-factor authentication for admin accounts

---

## Differences from Google Business Profile OAuth

This implementation (Google Sign-In) is different from the Google Business Profile OAuth:

| Feature | Google Sign-In (This Guide) | Google Business Profile OAuth |
|---------|----------------------------|-------------------------------|
| **Purpose** | User authentication/login | Social media connection |
| **OAuth Scopes** | email, profile, openid | business.manage |
| **Implementation** | Supabase Auth | Custom API routes |
| **Token Storage** | Supabase session | Encrypted in database |
| **Use Case** | Login to JetSuite | Post to Google Business Profile |
| **File** | `GOOGLE_SIGNIN_SETUP.md` | `GOOGLE_OAUTH_SETUP.md` |

---

## Additional Resources

- [Supabase Auth with Google Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth API Reference](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section above
2. Review Supabase Auth logs in dashboard
3. Check browser console for JavaScript errors
4. Verify Google Cloud Console configuration

---

**Last Updated**: 2026-02-16
**Version**: 1.0.0
