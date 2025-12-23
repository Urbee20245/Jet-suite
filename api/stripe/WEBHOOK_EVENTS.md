# Stripe Webhook Events - Implementation Guide

## Overview

The webhook handler at `/api/stripe/webhook` processes Stripe events to keep your billing database in sync and enforce subscription access control.

---

## Security

### Signature Verification

**CRITICAL:** All webhook requests are verified using `STRIPE_WEBHOOK_SECRET` before processing.

```typescript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
```

❌ **Without signature verification:** Attackers could fake subscription events  
✅ **With signature verification:** Only legitimate Stripe events are processed

---

## Handled Events

### 1. `checkout.session.completed`

**Triggered:** When user completes payment checkout

**Actions:**
- Stores Stripe `customer_id` in `billing_accounts`
- Records `seat_count` and `business_count` from metadata
- Links subscription to `user_id`

**Example:**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_xxx",
      "customer": "cus_xxx",
      "customer_email": "user@example.com",
      "metadata": {
        "userId": "user_123",
        "seatCount": "2",
        "additionalBusinessCount": "1"
      }
    }
  }
}
```

**Database Update:**
```sql
UPDATE billing_accounts 
SET stripe_customer_id = 'cus_xxx',
    seat_count = 2,
    business_count = 2  -- 1 base + 1 additional
WHERE user_id = 'user_123';
```

---

### 2. `customer.subscription.created`

**Triggered:** When a new subscription is created (after checkout)

**Actions:**
- Stores `subscription_id` in `billing_accounts`
- Sets `subscription_status` to initial status (usually 'active' or 'incomplete')
- Records `current_period_start` and `current_period_end`

**Example:**
```json
{
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_xxx",
      "customer": "cus_xxx",
      "status": "active",
      "current_period_start": 1640000000,
      "current_period_end": 1642592000
    }
  }
}
```

**Database Update:**
```sql
UPDATE billing_accounts 
SET stripe_subscription_id = 'sub_xxx',
    subscription_status = 'active',
    current_period_start = '2025-01-01T00:00:00Z',
    current_period_end = '2025-02-01T00:00:00Z'
WHERE stripe_customer_id = 'cus_xxx';
```

---

### 3. `customer.subscription.updated`

**Triggered:** When subscription changes (status, plan, quantity, etc.)

**Actions:**
- Updates `subscription_status` (active → past_due, active → canceled, etc.)
- Updates `current_period_end`
- Updates `cancel_at_period_end` flag

**Common Scenarios:**
| Status Change | Reason |
|---------------|--------|
| `active` → `active` | User upgraded plan or changed seat count |
| `active` → `past_due` | Payment failed (automatically set by Stripe) |
| `active` → `canceled` | User canceled (but still active until period end) |
| `past_due` → `active` | Payment retry succeeded |

**Example:**
```json
{
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_xxx",
      "customer": "cus_xxx",
      "status": "past_due",
      "cancel_at_period_end": false
    }
  }
}
```

---

### 4. `customer.subscription.deleted`

**Triggered:** When subscription is permanently canceled (after period ends)

**Actions:**
- Sets `subscription_status` to 'canceled'
- User loses access to the app immediately

**Example:**
```json
{
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_xxx",
      "customer": "cus_xxx",
      "status": "canceled"
    }
  }
}
```

**Database Update:**
```sql
UPDATE billing_accounts 
SET subscription_status = 'canceled'
WHERE stripe_customer_id = 'cus_xxx';
```

---

### 5. `invoice.payment_succeeded`

**Triggered:** When a recurring payment succeeds (monthly billing)

**Actions:**
- Ensures `subscription_status` is 'active'
- Updates `current_period_end` to new billing cycle end date
- Confirms user has uninterrupted access

**Example:**
```json
{
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_xxx",
      "customer": "cus_xxx",
      "subscription": "sub_xxx",
      "amount_paid": 14900,  // $149.00
      "status": "paid"
    }
  }
}
```

**Why this matters:**  
Even if a subscription is 'active', a failed payment can change it to 'past_due'. This event confirms the payment went through and access should continue.

---

### 6. `invoice.payment_failed`

**Triggered:** When a payment fails (card declined, insufficient funds, etc.)

**Actions:**
- Subscription status automatically changes to 'past_due' (handled by Stripe)
- Webhook updates database to reflect 'past_due' status
- User access is immediately revoked by `SubscriptionGuard`

**Stripe's Automatic Retry Logic:**
- Stripe retries failed payments automatically (customizable in dashboard)
- After all retries fail, subscription becomes 'unpaid' or 'canceled'

**Example:**
```json
{
  "type": "invoice.payment_failed",
  "data": {
    "object": {
      "id": "in_xxx",
      "customer": "cus_xxx",
      "subscription": "sub_xxx",
      "attempt_count": 2,
      "status": "open"
    }
  }
}
```

**Database Update:**
```sql
UPDATE billing_accounts 
SET subscription_status = 'past_due'
WHERE stripe_customer_id = 'cus_xxx';
```

---

## Access Control Rules

### ✅ Allowed Statuses (Full App Access)
- `active` - Subscription is active and paid
- `trialing` - User is in trial period (if enabled)

### ❌ Denied Statuses (No App Access)
- `past_due` - Payment failed, awaiting retry
- `unpaid` - Payment failed multiple times
- `canceled` - Subscription was canceled
- `incomplete` - Initial payment not completed
- `incomplete_expired` - Checkout session expired
- `paused` - Subscription paused (future feature)
- `null` - No subscription exists

### Implementation

**Client-Side (React):**
```tsx
import { SubscriptionGuard } from './components/SubscriptionGuard';

<SubscriptionGuard 
  userId={currentUser.id}
  onAccessDenied={(status, redirectTo) => {
    // User will be redirected after 2 seconds
    console.log('Access denied:', status);
  }}
>
  <InternalApp />
</SubscriptionGuard>
```

**Server-Side (API):**
```typescript
import { checkSubscriptionAccess } from './services/subscriptionService';

const { hasAccess, status } = await checkSubscriptionAccess(userId);

if (!hasAccess) {
  return res.status(403).json({ 
    error: 'Subscription required',
    status: status 
  });
}
```

---

## Testing Webhooks

### 1. Use Stripe CLI for Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:5173/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

### 2. Test in Stripe Dashboard

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your production URL: `https://your-app.vercel.app/api/stripe/webhook`
4. Select events to listen for
5. Copy `Signing secret` to `STRIPE_WEBHOOK_SECRET`

### 3. Monitor Webhook Events

**Stripe Dashboard:**  
Developers → Webhooks → [Your Endpoint] → Recent deliveries

**Shows:**
- Event type
- Status (succeeded/failed)
- Request/response bodies
- Retry attempts

---

## Error Handling

### Webhook Failures

If webhook processing fails, Stripe automatically retries with exponential backoff:

- Immediately
- 5 minutes later
- 30 minutes later
- 2 hours later
- ... up to 3 days

**Best Practices:**
- Always return `200 OK` if event is received (even if processing fails)
- Log errors for debugging
- Use idempotency to handle duplicate events

**Example Logging:**
```typescript
console.log('✅ Subscription marked as active after successful payment');
console.log('⚠️ Subscription marked as past_due after failed payment');
console.error('Failed to update subscription status:', err);
```

---

## Common Issues

### 1. Webhook Not Receiving Events

**Check:**
- Is `STRIPE_WEBHOOK_SECRET` set correctly?
- Is your endpoint publicly accessible? (localhost won't work in production)
- Did you add the endpoint in Stripe Dashboard?

### 2. Signature Verification Fails

**Check:**
- Are you using the raw request body? (Not parsed JSON)
- Is the `stripe-signature` header present?
- Is `STRIPE_WEBHOOK_SECRET` from the correct environment (test vs. production)?

### 3. Database Not Updating

**Check:**
- Are `/api/billing/*` endpoints working?
- Is `APP_URL` environment variable set correctly?
- Check webhook logs in Stripe Dashboard for error responses

---

## Summary

| Event | When It Fires | What It Does |
|-------|--------------|--------------|
| `checkout.session.completed` | User completes checkout | Store customer ID, seat count |
| `customer.subscription.created` | Subscription starts | Store subscription ID, status |
| `customer.subscription.updated` | Status/plan changes | Update status, period end |
| `customer.subscription.deleted` | Subscription ends | Mark as canceled |
| `invoice.payment_succeeded` | Monthly payment succeeds | Confirm active status |
| `invoice.payment_failed` | Payment fails | Mark as past_due, revoke access |

**Access Rule:**  
Only `active` or `trialing` → Full app access  
Everything else → Locked, redirect to /pricing or /account
