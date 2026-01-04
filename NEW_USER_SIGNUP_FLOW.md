# New User Signup Flow - Implementation Guide

## Overview

This document details the complete, secure flow for new users signing up and paying for a subscription before they have a registered account in Supabase.

The flow ensures that a user account is automatically created upon successful payment via Stripe webhook, and the user receives their temporary credentials via email.

---

## 🎯 Complete Flow

### 1. Frontend Submission (`/get-started`)

- **Action:** User fills out personal and business details on the `/get-started` page.
- **Data Passed:** `email`, `firstName`, `lastName`, `businessName`, `seatCount`, `additionalBusinessCount`, and `isNewUser: true`.
- **Destination:** `POST /api/stripe/create-checkout-session`

### 2. Checkout Session Creation (`/api/stripe/create-checkout-session`)

- **Action:** The serverless function receives the data.
- **Stripe Action:** Creates a Stripe Checkout Session using the provided email (`customer_email`).
- **Metadata:** All user/business details are passed into the `subscription_data.metadata` field.
- **Redirect:** User is redirected to Stripe's secure payment page.

### 3. Payment Completion (Stripe)

- **Action:** User successfully completes payment on Stripe.
- **Webhook Trigger:** Stripe fires the `checkout.session.completed` event to `/api/stripe/webhook`.

### 4. Webhook Processing (`/api/stripe/webhook`)

This is the critical step where the user account is created.

| Step | Action | Outcome |
|---|---|---|
| **1. Verification** | Verify Stripe signature. | Ensures request is legitimate. |
| **2. New User Check** | Check `is_new_user: true` and missing `userId`. | Confirms user needs an account created. |
| **3. User Creation** | Generate secure `tempPassword`. | Logs temporary password to console (for testing). |
| **4. Supabase Auth** | Call `supabase.auth.admin.createUser()`. | Creates user account with auto-confirmed email. |
| **5. Database Upsert** | Upsert `billing_accounts` and `business_profiles`. | Links Stripe IDs to new `userId`. Sets `is_primary: true` and `is_complete: false` (triggers onboarding). |
| **6. Email** | Call `sendWelcomeEmail()`. | Logs email content to console (or sends via production service). |
| **7. Response** | Return `200 OK` to Stripe. | Confirms successful processing. |

### 5. Post-Payment Redirect (`/billing/success`)

- **Action:** User is redirected back to the success page.
- **UI:** The page displays a confirmation message and instructs the user to check their email for credentials.
- **Next Step:** User clicks "Go to Login" and uses the temporary password from their email to access the app.

### 6. First Login & Onboarding

- **Action:** User logs in with temporary credentials.
- **Access Control:** `SubscriptionGuard` grants access because `billing_accounts.subscription_status` is 'active'.
- **Onboarding:** User is immediately redirected to `/onboarding` because `business_profiles.is_complete` is `false`.

---

## 🔒 Security Considerations

### 1. Temporary Password Generation

- **Method:** `crypto.randomBytes` is used to generate a cryptographically secure, random password (16 characters, mixed case, numbers, and special characters).
- **Storage:** The temporary password is **never stored** in the database. It is only generated in the webhook and immediately sent via email.

### 2. Email Confirmation

- `email_confirm: true` is set during `createUser`. This bypasses the email verification step, as the user has already verified their identity via a successful payment.

### 3. Password Change

- **CRITICAL:** The welcome email explicitly instructs the user to change their temporary password immediately upon first login.

### 4. Service Role Key

- `supabase.auth.admin.createUser` requires the `SUPABASE_SERVICE_ROLE_KEY`, which is only accessible server-side (in the Vercel function). This key is never exposed to the client.

---

## 📧 Production Email Integration

The `api/utils/emailService.ts` file contains commented-out code demonstrating how to integrate a production email service like SendGrid.

**To enable live email sending:**

1.  **Choose Provider:** Select an email provider (SendGrid, AWS SES, Mailgun, etc.).
2.  **Get API Key:** Obtain the necessary API key (e.g., `SENDGRID_API_KEY`).
3.  **Set Environment Variable:** Add the API key to your Vercel environment variables.
4.  **Uncomment Code:** Uncomment the SendGrid example code in `api/utils/emailService.ts` and ensure the `from` address is verified.
5.  **Install Dependency:** If using SendGrid, install the package: `npm install @sendgrid/mail`.

---

## 🧪 Testing Instructions

To test the complete flow:

1.  **Ensure Webhook is Live:** Deploy the updated `api/stripe/webhook.ts` to Vercel.
2.  **Simulate New User:** Navigate to `/get-started` and fill out the form using a **new email address** that does not exist in your Supabase Auth table.
3.  **Checkout:** Proceed to Stripe Checkout.
4.  **Use Test Card:** Use a successful Stripe test card (e.g., `4242...`).
5.  **Check Console:** After payment, check the Vercel function logs (or local console if running locally) for the **"JETSUITE WELCOME EMAIL"** log containing the temporary password.
6.  **Login:** Navigate to `/login` and attempt to log in using the new email and the temporary password from the console log.
7.  **Verify Onboarding:** Confirm the user is successfully logged in and immediately redirected to the `/onboarding` page.
8.  **Database Check:** Verify a new user exists in `auth.users` and corresponding records exist in `billing_accounts` and `business_profiles`.

**Expected Console Output (Webhook Log):**

```
[Webhook] Detected new user signup for email: test@newuser.com. Attempting to create Supabase user.
[Webhook] Generated temporary password: [16-character secure password]
[Webhook] Successfully created new user with ID: [UUID]
[Webhook] Billing account upserted for user: [UUID]
[Webhook] Initial business profile upserted for user: [UUID]
[Webhook] Successfully logged welcome email content for test@newuser.com