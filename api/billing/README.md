# Billing API Endpoints

Server-side API functions for managing JetSuite billing accounts in Supabase.

## Database Schema

See `/supabase/schema.sql` for the complete database schema.

### Table: `billing_accounts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users (unique) |
| `user_email` | TEXT | User's email address |
| `stripe_customer_id` | TEXT | Stripe customer ID (cus_xxx) |
| `stripe_subscription_id` | TEXT | Stripe subscription ID (sub_xxx) |
| `subscription_status` | TEXT | Status: active, trialing, past_due, canceled, etc. |
| `subscription_plan` | TEXT | Plan identifier (e.g., 'price_xxx') |
| `current_period_start` | TIMESTAMP | Billing period start |
| `current_period_end` | TIMESTAMP | Billing period end |
| `cancel_at_period_end` | BOOLEAN | Whether subscription will cancel |
| `seat_count` | INTEGER | Number of team seats |
| `business_count` | INTEGER | Number of business profiles |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

---

## Endpoints

### 1. Get Billing Account by User ID
**GET** `/api/billing/get-account?userId=xxx`

Retrieves billing account for a specific user.

**Query Parameters:**
- `userId` (required): User's UUID

**Response:**
```json
{
  "billingAccount": {
    "id": "uuid",
    "user_id": "uuid",
    "user_email": "user@example.com",
    "stripe_customer_id": "cus_xxx",
    "stripe_subscription_id": "sub_xxx",
    "subscription_status": "active",
    "subscription_plan": "price_xxx",
    "current_period_start": "2025-01-01T00:00:00Z",
    "current_period_end": "2025-02-01T00:00:00Z",
    "cancel_at_period_end": false,
    "seat_count": 1,
    "business_count": 1,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

Returns `{ billingAccount: null }` if no account found.

---

### 2. Get Billing Account by Customer ID
**GET** `/api/billing/get-by-customer?customerId=cus_xxx`

Retrieves billing account by Stripe customer ID (used in webhooks).

**Query Parameters:**
- `customerId` (required): Stripe customer ID

**Response:** Same as above

Returns 404 if not found.

---

### 3. Upsert Billing Account
**POST** `/api/billing/upsert-account`

Creates or updates a billing account (insert or update based on user_id).

**Request Body:**
```json
{
  "userId": "uuid",
  "userEmail": "user@example.com",
  "stripeCustomerId": "cus_xxx",
  "stripeSubscriptionId": "sub_xxx",
  "subscriptionStatus": "active",
  "subscriptionPlan": "price_xxx",
  "currentPeriodStart": "2025-01-01T00:00:00Z",
  "currentPeriodEnd": "2025-02-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "seatCount": 1,
  "businessCount": 1
}
```

**Required Fields:**
- `userId`
- `userEmail`

All other fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "billingAccount": { /* full record */ }
}
```

---

## Integration with Stripe Webhooks

The Stripe webhook handler (`/api/stripe/webhook.ts`) automatically syncs billing data:

### On Checkout Complete
```typescript
case 'checkout.session.completed':
  // Creates billing account with customer ID
  await upsertAccount({
    userId: session.metadata.userId,
    userEmail: session.customer_email,
    stripeCustomerId: session.customer
  });
```

### On Subscription Created
```typescript
case 'customer.subscription.created':
  // Adds subscription details
  await upsertAccount({
    userId: /* fetched from customer ID */,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000)
  });
```

### On Subscription Updated
```typescript
case 'customer.subscription.updated':
  // Updates subscription status and period
  await upsertAccount({
    subscriptionStatus: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });
```

### On Subscription Canceled
```typescript
case 'customer.subscription.deleted':
  // Marks as canceled
  await upsertAccount({
    subscriptionStatus: 'canceled'
  });
```

---

## Security

### Row Level Security (RLS)
The `billing_accounts` table has RLS enabled:

**Policy 1: Users can view own data**
```sql
CREATE POLICY "Users can view own billing account"
  ON billing_accounts FOR SELECT
  USING (auth.uid() = user_id);
```

**Policy 2: Service role has full access**
```sql
CREATE POLICY "Service role has full access"
  ON billing_accounts FOR ALL
  USING (auth.role() = 'service_role');
```

### Server-Side Only
- All billing API functions use `SUPABASE_SERVICE_ROLE_KEY`
- This bypasses RLS and allows server-side operations
- **Never** expose service role key to client

---

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy project URL and keys

### 2. Run Database Schema
```bash
# In Supabase SQL Editor, run:
cat supabase/schema.sql

# Or use Supabase CLI:
supabase db push
```

### 3. Configure Environment Variables
```bash
# Add to Vercel or .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Test Endpoints Locally
```bash
# Get account (should return null for new user)
curl http://localhost:3000/api/billing/get-account?userId=test-uuid

# Create account
curl -X POST http://localhost:3000/api/billing/upsert-account \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-uuid",
    "userEmail": "test@example.com",
    "seatCount": 1,
    "businessCount": 1
  }'
```

---

## Usage in Application

### Check Subscription Status
```typescript
// In client-side code
const response = await fetch(`/api/billing/get-account?userId=${userId}`);
const { billingAccount } = await response.json();

if (billingAccount?.subscription_status === 'active') {
  // User has active subscription
  // Show premium features
} else {
  // Show upgrade prompt
}
```

### Check Limits
```typescript
const { billingAccount } = await response.json();

if (billingAccount) {
  const canAddBusiness = currentBusinessCount < billingAccount.business_count;
  const canAddTeamMember = currentTeamCount < billingAccount.seat_count;
}
```

### Display Billing Info
```typescript
// In Account page
const { billingAccount } = await response.json();

<div>
  <p>Status: {billingAccount.subscription_status}</p>
  <p>Renews: {new Date(billingAccount.current_period_end).toLocaleDateString()}</p>
  <p>Team Seats: {billingAccount.seat_count}</p>
  <p>Business Profiles: {billingAccount.business_count}</p>
</div>
```

---

## Subscription Status Values

| Status | Meaning | Action |
|--------|---------|--------|
| `active` | Subscription active and paid | Full access |
| `trialing` | Free trial period | Full access |
| `past_due` | Payment failed, grace period | Show payment warning |
| `canceled` | Subscription canceled | Disable features, show reactivate |
| `unpaid` | Payment failed, access revoked | Require payment |
| `incomplete` | Initial payment pending | Show payment prompt |
| `paused` | Subscription paused | Limited access |

---

## Best Practices

1. **Always check subscription status** before allowing premium features
2. **Cache billing data** in client with reasonable TTL (5-10 minutes)
3. **Show grace period** for past_due status (3-7 days)
4. **Handle null billing accounts** - new users won't have records yet
5. **Use webhooks** as source of truth, not client-side updates
6. **Log all webhook events** for debugging and compliance

---

## Troubleshooting

**Error: "Failed to get billing account"**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Verify database schema is created
- Check Supabase project is active

**Error: "Billing account not found"**
- User hasn't gone through checkout yet
- Check `user_id` matches auth.users.id format
- Verify webhook events are being received

**Error: "Failed to upsert billing account"**
- Check required fields (userId, userEmail) are provided
- Verify subscription_status is valid enum value
- Check database column types match input data

**Webhook not updating database**
- Verify `APP_URL` environment variable is set correctly
- Check webhook is receiving events in Stripe Dashboard
- Look for errors in Vercel function logs
