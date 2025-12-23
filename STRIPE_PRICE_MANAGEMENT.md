# Stripe Price ID Management Guide

## Overview

JetSuite uses a centralized configuration layer (`/config/stripePrices.ts`) to manage all Stripe price IDs. This ensures that price changes can be made by updating environment variables only, without code changes or subscription migration.

---

## Configuration Layer

### File: `/config/stripePrices.ts`

**Purpose:**
- Centralized source of truth for all Stripe price IDs
- Reads exclusively from environment variables
- Provides validation and error handling
- Prevents hard-coding of price IDs throughout codebase

**Exports:**
```typescript
// Individual price IDs
export const BASE_PRICE_ID: string;
export const BUSINESS_ADDON_PRICE_ID: string;
export const SEAT_PRICE_ID: string;

// Validation functions
export function validateStripePrices(): void;
export function areStripePricesConfigured(): boolean;
export function getStripePriceConfig(): Record<string, string>;
```

---

## Environment Variables

### Required Variables

| Variable | Description | Default Price |
|----------|-------------|---------------|
| `STRIPE_PRICE_BASE_149` | Base plan price ID | $149/month |
| `STRIPE_PRICE_BUSINESS_49` | Additional business price ID | $49/month |
| `STRIPE_PRICE_SEAT_15` | Team seat price ID | $15/month |

### Setting Up

**1. Create Stripe Products & Prices**

In your Stripe Dashboard:

1. Go to **Products** → **Add Product**
2. Create three products:
   - **JetSuite Base Plan**
     - Recurring: Monthly
     - Price: $149
     - Copy price ID: `price_xxxxx`
   - **Additional Business Profile**
     - Recurring: Monthly
     - Price: $49
     - Copy price ID: `price_yyyyy`
   - **Team Seat**
     - Recurring: Monthly
     - Price: $15
     - Copy price ID: `price_zzzzz`

**2. Configure Environment Variables**

**Vercel (Production):**
```bash
vercel env add STRIPE_PRICE_BASE_149
# Enter: price_xxxxx

vercel env add STRIPE_PRICE_BUSINESS_49
# Enter: price_yyyyy

vercel env add STRIPE_PRICE_SEAT_15
# Enter: price_zzzzz
```

**Local Development (.env):**
```env
STRIPE_PRICE_BASE_149=price_xxxxx
STRIPE_PRICE_BUSINESS_49=price_yyyyy
STRIPE_PRICE_SEAT_15=price_zzzzz
```

---

## Usage

### Server-Side (API Endpoints)

**Example: `/api/stripe/create-checkout-session.ts`**

```typescript
import { 
  BASE_PRICE_ID, 
  BUSINESS_ADDON_PRICE_ID, 
  SEAT_PRICE_ID,
  validateStripePrices 
} from '../../config/stripePrices';

export default async function handler(req, res) {
  // Validate configuration
  try {
    validateStripePrices();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Missing Stripe price configuration' 
    });
  }

  // Use price IDs
  const lineItems = [
    { price: BASE_PRICE_ID, quantity: 1 },
    { price: BUSINESS_ADDON_PRICE_ID, quantity: additionalBusinessCount },
    { price: SEAT_PRICE_ID, quantity: seatCount },
  ];

  // Create checkout session...
}
```

---

## Changing Prices

### Scenario 1: Change Price Amount (Without Migration)

**Goal:** Change base plan from $149 to $199

**Steps:**

1. **Create New Price in Stripe:**
   - Go to existing "JetSuite Base Plan" product
   - Click "Add another price"
   - Set amount: $199/month
   - Save and copy new price ID: `price_new123`

2. **Update Environment Variable:**
   ```bash
   # Vercel
   vercel env rm STRIPE_PRICE_BASE_149
   vercel env add STRIPE_PRICE_BASE_149
   # Enter: price_new123
   ```

3. **Redeploy Application:**
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

4. **Behavior:**
   - **New subscriptions:** Use $199 price
   - **Existing subscriptions:** Keep $149 price (no migration needed)
   - **Next renewal:** Existing customers keep $149 unless manually migrated

**No code changes required!** ✅

---

### Scenario 2: Migrate Existing Subscriptions

**Goal:** Move existing $149 customers to new $199 price

**Option A: Automatic Migration (Recommended)**

Use Stripe's subscription schedule or update API:

```typescript
// Migration script (run once)
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const migrateSubscriptions = async () => {
  const subscriptions = await stripe.subscriptions.list({
    price: 'price_old149', // Old price ID
    limit: 100,
  });

  for (const subscription of subscriptions.data) {
    await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscription.items.data[0].id,
        price: 'price_new199', // New price ID
      }],
      proration_behavior: 'always_invoice', // or 'none' for no proration
    });
  }
};
```

**Option B: Manual Migration**

In Stripe Dashboard:
1. Go to each subscription
2. Click "Update subscription"
3. Change price to new price ID
4. Choose proration behavior

---

### Scenario 3: Add New Pricing Tier

**Goal:** Add "Enterprise" tier at $499/month

**Steps:**

1. **Create New Product in Stripe:**
   - Name: "JetSuite Enterprise Plan"
   - Price: $499/month
   - Copy price ID: `price_ent499`

2. **Add Environment Variable:**
   ```bash
   vercel env add STRIPE_PRICE_ENTERPRISE_499
   # Enter: price_ent499
   ```

3. **Update Config File:**
   ```typescript
   // /config/stripePrices.ts
   export const STRIPE_PRICES = {
     BASE_PRICE_ID: getServerEnv('STRIPE_PRICE_BASE_149') || '',
     BUSINESS_ADDON_PRICE_ID: getServerEnv('STRIPE_PRICE_BUSINESS_49') || '',
     SEAT_PRICE_ID: getServerEnv('STRIPE_PRICE_SEAT_15') || '',
     ENTERPRISE_PRICE_ID: getServerEnv('STRIPE_PRICE_ENTERPRISE_499') || '', // NEW
   };

   export const ENTERPRISE_PRICE_ID = STRIPE_PRICES.ENTERPRISE_PRICE_ID;
   ```

4. **Update Pricing Page:**
   - Add new tier card
   - Update checkout logic to use `ENTERPRISE_PRICE_ID`

---

## Validation

### Startup Validation

**Recommended:** Validate price IDs on application startup

```typescript
// In your main app or API entry point
import { validateStripePrices, areStripePricesConfigured } from './config/stripePrices';

// Option 1: Throw error if misconfigured
try {
  validateStripePrices();
  console.log('✅ Stripe prices configured correctly');
} catch (error) {
  console.error('❌ Stripe price configuration error:', error.message);
  process.exit(1); // Fail fast
}

// Option 2: Soft check (warn but don't fail)
if (!areStripePricesConfigured()) {
  console.warn('⚠️ Some Stripe prices are not configured');
}
```

### Runtime Validation

**In API endpoints:**

```typescript
export default async function handler(req, res) {
  // Validate before processing
  try {
    validateStripePrices();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Configuration error',
      message: error.message 
    });
  }

  // Proceed with logic...
}
```

---

## Best Practices

### ✅ DO

1. **Always use the config layer**
   ```typescript
   // Good
   import { BASE_PRICE_ID } from '../config/stripePrices';
   const lineItem = { price: BASE_PRICE_ID, quantity: 1 };
   ```

2. **Validate configuration early**
   ```typescript
   validateStripePrices(); // Fail fast if misconfigured
   ```

3. **Use descriptive environment variable names**
   ```env
   STRIPE_PRICE_BASE_149=price_xxx  # Amount in name for clarity
   ```

4. **Document price changes in git commits**
   ```bash
   git commit -m "Update base plan price ID for $199 tier"
   ```

5. **Test in staging before production**
   - Use test price IDs in development
   - Use live price IDs in production

### ❌ DON'T

1. **Never hard-code price IDs**
   ```typescript
   // Bad - don't do this!
   const lineItem = { price: 'price_1234567890', quantity: 1 };
   ```

2. **Don't use process.env directly in business logic**
   ```typescript
   // Bad
   const priceId = process.env.STRIPE_PRICE_BASE_149;
   
   // Good
   import { BASE_PRICE_ID } from '../config/stripePrices';
   ```

3. **Don't skip validation**
   ```typescript
   // Bad - could fail silently
   const priceId = BASE_PRICE_ID; // Might be empty string!
   
   // Good - validate first
   validateStripePrices();
   const priceId = BASE_PRICE_ID; // Guaranteed to be set
   ```

4. **Don't change price IDs without testing**
   - Always test checkout flow with new price ID
   - Verify webhooks process correctly
   - Check billing_accounts table updates

---

## Troubleshooting

### Problem: "Missing Stripe price IDs" Error

**Cause:** Environment variables not set

**Solution:**
```bash
# Check if variables are set
vercel env ls

# Add missing variables
vercel env add STRIPE_PRICE_BASE_149
vercel env add STRIPE_PRICE_BUSINESS_49
vercel env add STRIPE_PRICE_SEAT_15

# Redeploy
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

---

### Problem: Checkout fails with "Invalid price ID"

**Cause:** Price ID doesn't exist in Stripe or is for wrong mode (test vs. live)

**Solution:**
1. Check Stripe Dashboard → Products
2. Verify price ID exists
3. Ensure using test keys with test prices, live keys with live prices
4. Update environment variable with correct price ID

---

### Problem: Price change not reflected on pricing page

**Cause:** Client-side code doesn't automatically know about new prices

**Solution:**
1. Price IDs are server-side only (for checkout)
2. Update client-side price display manually:
   ```typescript
   // /pages/PricingPage.tsx
   const basePlan = 199; // Update this
   ```
3. Consider fetching prices from Stripe API if dynamic display needed

---

## Security Considerations

### Why Server-Side Only?

Price IDs are **not secret**, but they should still be managed server-side:

1. **Prevents tampering:** Users can't modify price IDs in browser
2. **Centralized control:** All pricing logic in one place
3. **Easy updates:** Change env vars without code deployment
4. **Validation:** Ensure correct prices before checkout

### Stripe API Keys

**Never expose secret keys client-side!**

```typescript
// Server-side only
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Client-side (if needed)
const stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY);
```

---

## Migration Checklist

When updating price IDs:

- [ ] Create new price in Stripe Dashboard
- [ ] Copy new price ID
- [ ] Update environment variable (Vercel or .env)
- [ ] Redeploy application
- [ ] Test checkout flow with test card
- [ ] Verify webhook processes correctly
- [ ] Check billing_accounts table updates
- [ ] Verify customer portal shows correct price
- [ ] Update documentation (if needed)
- [ ] Monitor for errors in first 24 hours
- [ ] Decide on existing subscription migration strategy

---

## Summary

**Configuration Layer:** `/config/stripePrices.ts`

**Environment Variables:**
- `STRIPE_PRICE_BASE_149` → Base plan ($149/mo)
- `STRIPE_PRICE_BUSINESS_49` → Additional business ($49/mo)
- `STRIPE_PRICE_SEAT_15` → Team seat ($15/mo)

**Key Benefits:**
✅ No code changes for price updates  
✅ Centralized configuration  
✅ Validation and error handling  
✅ No subscription migration required  
✅ Test and live environments isolated  

**Price Change Process:**
1. Create new price in Stripe
2. Update environment variable
3. Redeploy (automatic on Vercel)
4. Done! ✅

All pricing is now managed exclusively through environment variables with a single configuration layer.
