# Stripe Billing Implementation - Complete Guide

## ✅ Implementation Status: COMPLETE

All Stripe billing and subscription management features have been successfully implemented.

---

## 📦 What's Included

### 1. Stripe Checkout Session (Dynamic Line Items)

**Endpoint:** `POST /api/stripe/create-checkout-session`

**Features:**
- ✅ Automatically creates or finds existing Stripe customer
- ✅ Stores customer ID in Supabase `billing_accounts` table
- ✅ Builds dynamic subscription line items:
  - Base Plan: $149/month (qty: 1)
  - Additional Business Profiles: $49/month each
  - Team Seats: $15/month each
- ✅ Attaches metadata (userId, workspaceId, counts)
- ✅ Success redirect: `/billing/success?session_id={CHECKOUT_SESSION_ID}`
- ✅ Cancel redirect: `/pricing`

**Usage Example:**
```typescript
import { createCheckoutSession } from './services/stripeService';

const { url } = await createCheckoutSession({
  userId: 'user_123',
  email: 'user@example.com',
  seatCount: 2,              // +$30/mo
  additionalBusinessCount: 1  // +$49/mo
  // Total: $149 + $49 + $30 = $228/mo
});

window.location.href = url; // Redirect to Stripe Checkout
```

---

### 2. Customer Portal Session

**Endpoint:** `POST /api/stripe/create-portal-session`

**Features:**
- ✅ Allows users to manage their subscription
- ✅ Update payment method
- ✅ View invoices
- ✅ Cancel subscription
- ✅ Download receipts

**Usage Example:**
```typescript
import { createPortalSession } from './services/stripeService';

const { url } = await createPortalSession(customerId);
window.location.href = url; // Redirect to Stripe Customer Portal
```

---

### 3. Webhook Handler (Comprehensive Event Processing)

**Endpoint:** `POST /api/stripe/webhook`

**Security:**
- ✅ Signature verification with `STRIPE_WEBHOOK_SECRET`
- ✅ Raw body parsing for signature validation
- ✅ Automatic rejection of invalid signatures

**Handled Events:**

#### `checkout.session.completed`
- Stores customer ID in `billing_accounts`
- Records seat count and business count
- Links subscription to user

#### `customer.subscription.created`
- Stores subscription ID
- Sets initial subscription status
- Records billing period dates

#### `customer.subscription.updated`
- Updates subscription status (active, past_due, canceled, etc.)
- Updates billing period end date
- Updates cancel_at_period_end flag

#### `customer.subscription.deleted`
- Marks subscription as canceled
- Revokes user access immediately

#### `invoice.payment_succeeded`
- Confirms subscription is active after successful payment
- Updates current_period_end to new billing cycle
- Ensures uninterrupted access

#### `invoice.payment_failed`
- Marks subscription as past_due
- Revokes user access via SubscriptionGuard
- Stripe handles automatic retry logic

**See `/api/stripe/WEBHOOK_EVENTS.md` for complete documentation**

---

### 4. Billing Database (Supabase)

**Table:** `billing_accounts`

**Schema:**
```sql
CREATE TABLE billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  user_email TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status subscription_status_enum,
  subscription_plan TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  seat_count INTEGER DEFAULT 0,
  business_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Features:**
- ✅ Row Level Security (RLS) policies
- ✅ Automatic `updated_at` trigger
- ✅ Server-side only access (service role key)

**API Endpoints:**
- `GET /api/billing/get-account?userId={userId}`
- `GET /api/billing/get-by-customer?customerId={customerId}`
- `POST /api/billing/upsert-account`

---

### 5. Access Control System

**Service:** `subscriptionService.ts`

**Core Function:** `checkSubscriptionAccess(userId)`

**Returns:**
```typescript
{
  hasAccess: boolean,
  status: SubscriptionStatus,
  reason?: string,
  redirectTo?: string
}
```

**Access Rules:**

| Status | Access | Redirect |
|--------|--------|----------|
| `active` | ✅ Full access | - |
| `trialing` | ✅ Full access | - |
| `past_due` | ❌ Denied | `/account` |
| `unpaid` | ❌ Denied | `/account` |
| `canceled` | ❌ Denied | `/pricing` |
| `incomplete` | ❌ Denied | `/pricing` |
| `incomplete_expired` | ❌ Denied | `/pricing` |
| `paused` | ❌ Denied | `/account` |
| `null` (no subscription) | ❌ Denied | `/pricing` |

**Helper Functions:**
- `getSubscriptionStatusLabel(status)` - Returns user-friendly label
- `getSubscriptionStatusColor(status)` - Returns Tailwind color class

---

### 6. Subscription Guard Component

**Component:** `SubscriptionGuard.tsx`

**Usage:**
```tsx
import { SubscriptionGuard } from './components/SubscriptionGuard';

<SubscriptionGuard 
  userId={currentUser.id}
  onAccessDenied={(status, redirectTo) => {
    console.log('Access denied:', status);
    // User will be redirected automatically after 2 seconds
  }}
>
  <InternalApp />
</SubscriptionGuard>
```

**Features:**
- ✅ Shows loading state while checking subscription
- ✅ Displays professional access denied screen
- ✅ Status-specific messaging (payment issue vs. no subscription)
- ✅ Auto-redirects to `/pricing` or `/account` after 2 seconds
- ✅ Integrates with `subscriptionService.ts`

**Access Denied Screen Includes:**
- Status badge (e.g., "⚠️ Payment Past Due")
- Clear explanation of the issue
- CTA button to resolve ("Update Payment Method" or "View Pricing Plans")
- Countdown timer before redirect

---

### 7. Billing Success Page

**Page:** `BillingSuccessPage.tsx`

**Route:** `/billing/success?session_id={CHECKOUT_SESSION_ID}`

**Features:**
- ✅ Success confirmation with checkmark icon
- ✅ "What happens next" checklist
- ✅ CTA to dashboard and billing details
- ✅ Link to Knowledge Base
- ✅ Displays session ID for debugging

---

## 🔐 Environment Variables Required

Add these to your `.env` file and Vercel dashboard:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs
STRIPE_PRICE_BASE_149=price_xxxxx
STRIPE_PRICE_BUSINESS_49=price_xxxxx
STRIPE_PRICE_SEAT_15=price_xxxxx

# Application URL (for redirects)
APP_URL=https://your-app.vercel.app

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

---

## 🚀 Deployment Checklist

### 1. Create Stripe Products & Prices

**In Stripe Dashboard:**
1. Go to **Products** → **Add Product**
2. Create three products:
   - JetSuite Base Plan - $149/month (recurring)
   - Additional Business Profile - $49/month (recurring)
   - Team Seat - $15/month (recurring)
3. Copy the **Price IDs** (e.g., `price_xxxxx`)
4. Add to environment variables

### 2. Set Up Stripe Webhook

**In Stripe Dashboard:**
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter: `https://your-app.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing secret** (starts with `whsec_`)
6. Add to `STRIPE_WEBHOOK_SECRET` environment variable

### 3. Set Up Supabase Database

**In Supabase Dashboard:**
1. Go to **SQL Editor**
2. Run the schema from `/supabase/schema.sql`
3. Verify table was created
4. Copy **Project URL** and **Service Role Key**
5. Add to environment variables

### 4. Deploy to Vercel

```bash
# Set environment variables in Vercel dashboard
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_BASE_149
vercel env add STRIPE_PRICE_BUSINESS_49
vercel env add STRIPE_PRICE_SEAT_15
vercel env add APP_URL
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy
git push origin main
```

### 5. Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:5173/api/stripe/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
```

---

## 🧪 Testing Flow

### 1. Test Checkout

```typescript
// In your pricing page component
const handleSubscribe = async () => {
  try {
    const { url } = await createCheckoutSession({
      userId: 'test_user_123',
      email: 'test@example.com',
      seatCount: 1,
      additionalBusinessCount: 0
    });
    
    window.location.href = url;
  } catch (error) {
    console.error('Checkout failed:', error);
  }
};
```

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

### 2. Test Access Control

```typescript
// After checkout, verify access
const { hasAccess, status } = await checkSubscriptionAccess('test_user_123');
console.log('Access granted:', hasAccess);
console.log('Status:', status); // Should be 'active'
```

### 3. Test Failed Payment

1. Use Stripe Dashboard to trigger failed payment
2. Go to **Subscriptions** → Select subscription → **...** → **Trigger payment failure**
3. Verify:
   - Subscription status changes to 'past_due'
   - User loses access immediately
   - Access denied screen appears

### 4. Test Customer Portal

```typescript
const { url } = await createPortalSession(customerId);
window.location.href = url;

// User should be able to:
// - Update payment method
// - View invoices
// - Cancel subscription
```

---

## 📊 Subscription Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      NEW USER                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
                   [Visits /pricing]
                           ↓
              [Clicks "Subscribe" button]
                           ↓
         POST /api/stripe/create-checkout-session
                           ↓
            [Redirects to Stripe Checkout]
                           ↓
                   [Enters payment]
                           ↓
┌─────────────────────────────────────────────────────────────┐
│          checkout.session.completed (webhook)                │
│          → Store customer ID                                 │
│          → Store seat/business counts                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│          customer.subscription.created (webhook)             │
│          → Store subscription ID                             │
│          → Set status to 'active'                            │
│          → Store billing period                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
              [Redirect to /billing/success]
                           ↓
                [User clicks "Go to Dashboard"]
                           ↓
                    <SubscriptionGuard>
                    → checkSubscriptionAccess()
                    → status = 'active' ✅
                    → hasAccess = true
                           ↓
                   [Full app access]
                           ↓
    ┌──────────────────────┴──────────────────────┐
    ↓                                              ↓
[Monthly billing cycle]                    [User cancels]
    ↓                                              ↓
invoice.payment_succeeded           customer.subscription.updated
→ status = 'active' ✅               → cancel_at_period_end = true
→ Access continues                   → Access continues until period end
    ↓                                              ↓
    └──────────────────────┬──────────────────────┘
                           ↓
           [Subscription period ends]
                           ↓
         customer.subscription.deleted
         → status = 'canceled' ❌
         → Access immediately revoked
                           ↓
         [Redirect to /pricing]


FAILURE PATH:
┌─────────────────────────────────────────────────────────────┐
│           [Payment card expires/declines]                    │
│                        ↓                                     │
│           invoice.payment_failed (webhook)                   │
│           → status = 'past_due' ⚠️                           │
│           → Access immediately revoked                       │
│                        ↓                                     │
│           [Stripe retries automatically]                     │
│           → After 3-4 retries over 2 weeks                   │
│                        ↓                                     │
│    ┌───────────────────┴───────────────────┐                │
│    ↓                                        ↓                │
│ [Payment succeeds]                  [All retries fail]       │
│    ↓                                        ↓                │
│ invoice.payment_succeeded      customer.subscription.deleted │
│ → status = 'active' ✅           → status = 'canceled' ❌    │
│ → Access restored                → Access revoked forever    │
│                                  → Redirect to /pricing      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Implementation Details

### Why Raw Body for Webhooks?

```typescript
export const config = {
  api: {
    bodyParser: false, // REQUIRED for signature verification
  },
};
```

Stripe's signature verification requires the **raw request body** (not parsed JSON). If you parse the body first, the signature will always fail.

### Why Service Role Key for Billing API?

The billing endpoints use `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_ANON_KEY` because:

1. **Server-side only:** Billing data should never be exposed client-side
2. **Bypass RLS:** Service role key bypasses Row Level Security for trusted operations
3. **Webhook access:** Stripe webhooks need to update billing data without user authentication

### Why Two Subscription Update Webhooks?

- `customer.subscription.updated`: Fires when subscription changes (status, plan, etc.)
- `invoice.payment_succeeded`: Fires when recurring payment succeeds

Both are needed because:
- Subscription can change without payment (e.g., user upgrades plan)
- Payment success should always ensure status is 'active'

---

## 📚 Documentation Files

- `/api/stripe/README.md` - Complete Stripe API documentation
- `/api/stripe/WEBHOOK_EVENTS.md` - Detailed webhook event guide
- `/api/billing/README.md` - Billing database API documentation
- `/supabase/schema.sql` - Database schema with RLS policies

---

## ✅ Implementation Complete

**All requested features have been implemented:**
- ✅ Dynamic checkout session with line items (base, seats, businesses)
- ✅ Customer creation/lookup logic
- ✅ Webhook signature verification with STRIPE_WEBHOOK_SECRET
- ✅ All 6 webhook events handled (checkout, subscription, invoice)
- ✅ Billing database updates via Supabase
- ✅ Access control rule: only 'active' → app access
- ✅ SubscriptionGuard component for client-side enforcement
- ✅ Comprehensive documentation and testing guides

**Repository Status:** All changes committed and pushed to `main` branch.

---

## 🚨 Important Security Notes

1. **Never expose secret keys client-side**
   - Use serverless functions for all Stripe operations
   - Client-side code only calls `/api/stripe/*` endpoints

2. **Always verify webhook signatures**
   - Prevents attackers from faking subscription events
   - Use raw request body for verification

3. **Use Row Level Security (RLS)**
   - Billing data is protected at the database level
   - Only service role key can access billing_accounts

4. **Validate user input**
   - Check seatCount and additionalBusinessCount are non-negative
   - Verify userId exists before creating checkout

5. **Handle errors gracefully**
   - Always return 200 OK to Stripe webhooks (even on error)
   - Log errors for debugging
   - Show user-friendly messages client-side

---

## 📞 Support

For questions or issues:
- Check documentation in `/api/stripe/` folder
- Review Stripe webhook logs in dashboard
- Test locally with Stripe CLI
- Monitor Vercel function logs for errors
