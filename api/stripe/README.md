# Stripe API Endpoints

Vercel Serverless Functions for Stripe integration in JetSuite.

## Endpoints

### 1. Create Checkout Session
**POST** `/api/stripe/create-checkout-session`

Creates a Stripe Checkout session for subscription or one-time payments.

**Request Body:**
```json
{
  "priceId": "price_xxx",
  "email": "user@example.com",
  "userId": "user_123",
  "mode": "subscription"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/xxx"
}
```

**Request Body:**
```json
{
  "userId": "user_12345",
  "email": "user@example.com",
  "seatCount": 2,
  "additionalBusinessCount": 1,
  "workspaceId": "workspace_abc"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxx",
  "sessionId": "cs_test_xxxxx"
}
```

**Line Items:**
- **Base Plan:** $149/month (quantity: 1)
- **Additional Business Profiles:** $49/month each (quantity: `additionalBusinessCount`)
- **Team Seats:** $15/month each (quantity: `seatCount`)

**Behavior:**
1. Checks if user already has a Stripe customer ID in `billing_accounts`
2. Creates new customer if none exists
3. Builds dynamic line items based on input
4. Creates subscription checkout session
5. Redirects to `/billing/success?session_id={CHECKOUT_SESSION_ID}` on completion
6. Cancel redirects to `/pricing`

**Usage Example:**
```javascript
const response = await fetch('/api/stripe/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_12345',
    email: 'user@example.com',
    seatCount: 2,
    additionalBusinessCount: 1
  })
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

---

### 2. Create Customer Portal Session
**POST** `/api/stripe/create-portal-session`

Creates a Stripe Customer Portal session for managing subscriptions.

**Request Body:**
```json
{
  "customerId": "cus_xxx"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/xxx"
}
```

**Usage Example:**
```javascript
const response = await fetch('/api/stripe/create-portal-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'cus_xxx'
  })
});

const { url } = await response.json();
window.location.href = url; // Redirect to Customer Portal
```

---

### 3. Webhook Handler
**POST** `/api/stripe/webhook`

Handles Stripe webhook events (signature verified).

**Handled Events:**
- `checkout.session.completed` - Successful checkout
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription change
- `customer.subscription.deleted` - Cancellation
- `invoice.paid` - Successful payment
- `invoice.payment_failed` - Failed payment

**Stripe Configuration:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events to listen to
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Access Control & Subscription Status

### Subscription Status Flow

```
New User → Checkout → active → invoice.payment_succeeded (monthly) → active
                         ↓
                   past_due (payment failed)
                         ↓
                   unpaid (retries failed)
                         ↓
                   canceled (subscription ends)
```

### Access Rules

**✅ ALLOWED (Full App Access):**
- `active` - Subscription is active and paid
- `trialing` - User is in trial period

**❌ DENIED (No App Access):**
- `past_due` - Payment failed, redirect to /account
- `unpaid` - Payment failed multiple times, redirect to /account
- `canceled` - Subscription canceled, redirect to /pricing
- `incomplete` - Initial payment not completed, redirect to /pricing
- `incomplete_expired` - Checkout expired, redirect to /pricing
- `null` - No subscription, redirect to /pricing

### Implementation

**Client-Side Protection:**
```tsx
import { SubscriptionGuard } from './components/SubscriptionGuard';

<SubscriptionGuard userId={user.id}>
  <InternalApp />
</SubscriptionGuard>
```

**Server-Side Validation:**
```typescript
import { checkSubscriptionAccess } from './services/subscriptionService';

const { hasAccess, status } = await checkSubscriptionAccess(userId);
if (!hasAccess) {
  return res.status(403).json({ error: 'Subscription required' });
}
```

See `/api/stripe/WEBHOOK_EVENTS.md` for detailed webhook documentation.

---

## Environment Variables

Add these to your Vercel project settings or `.env.local`:

```env
# Stripe Secret Key (starts with sk_test_ or sk_live_)
STRIPE_SECRET_KEY=sk_test_your_key

# Webhook Signing Secret (starts with whsec_)
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Price IDs from Stripe Dashboard
STRIPE_PRICE_BASE_149=price_xxx      # Base $149/mo plan
STRIPE_PRICE_BUSINESS_49=price_xxx   # Business add-on $49/mo
STRIPE_PRICE_SEAT_15=price_xxx       # Per-seat $15/mo

# Your app URL (for redirects after checkout)
APP_URL=https://your-domain.vercel.app
```

---

## Security Features

✅ **No client-side secrets** - All keys stay server-side  
✅ **Webhook signature verification** - Prevents fake webhooks  
✅ **CORS protection** - Only POST methods allowed  
✅ **Input validation** - Required fields checked  
✅ **Error handling** - Graceful failures with logging  

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Stripe Products & Prices
In Stripe Dashboard:
1. Create Products:
   - JetSuite Base Plan ($149/mo)
   - Business Add-on ($49/mo)
   - Additional Seat ($15/mo)
2. Copy Price IDs to environment variables

### 3. Configure Environment Variables
```bash
# Add to Vercel project settings
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_BASE_149
vercel env add STRIPE_PRICE_BUSINESS_49
vercel env add STRIPE_PRICE_SEAT_15
vercel env add APP_URL
```

### 4. Set Up Webhook
1. Deploy to Vercel
2. Add webhook endpoint in Stripe Dashboard
3. Update `STRIPE_WEBHOOK_SECRET` with signing secret

### 5. Test Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:5173/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

---

## Integration with JetSuite

### Account Page Integration
```typescript
// In tools/Account.tsx
const handleUpgrade = async () => {
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId: process.env.STRIPE_PRICE_BASE_149,
      email: userEmail,
      userId: userId,
      mode: 'subscription'
    })
  });
  
  const { url } = await response.json();
  window.location.href = url;
};

const handleManageBilling = async () => {
  const response = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: stripeCustomerId
    })
  });
  
  const { url } = await response.json();
  window.location.href = url;
};
```

---

## Pricing Structure

| Plan | Monthly Price | Stripe Price ID | Description |
|------|--------------|-----------------|-------------|
| **Base Plan** | $149/mo | `STRIPE_PRICE_BASE_149` | Full platform access for 1 business |
| **Business Add-on** | $49/mo | `STRIPE_PRICE_BUSINESS_49` | Additional business profile |
| **Team Seat** | $15/mo | `STRIPE_PRICE_SEAT_15` | Additional team member |

---

## TODO: Database Integration

The webhook handler includes TODO comments for database integration:

1. **checkout.session.completed**
   - Store `customerId` for future portal access
   - Mark user as subscribed
   - Record subscription start date

2. **customer.subscription.deleted**
   - Mark user as unsubscribed
   - Disable premium features
   - Retain data per retention policy

3. **invoice.payment_failed**
   - Notify user via email
   - Grace period (3-7 days)
   - Downgrade after grace period

Connect these webhooks to your database (Firebase, Supabase, MongoDB, etc.) to sync subscription status.

---

## Troubleshooting

**Error: "Method not allowed"**
- Ensure you're using POST method

**Error: "Missing stripe-signature header"**
- Check webhook endpoint in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is set

**Error: "Webhook signature verification failed"**
- Secret key doesn't match webhook endpoint
- Update secret key from Stripe Dashboard

**Error: "Failed to create checkout session"**
- Check `STRIPE_SECRET_KEY` is valid
- Verify `priceId` exists in Stripe
- Check Stripe logs in Dashboard

---

## Resources

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/checkout/quickstart)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
