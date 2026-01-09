# Headless WooCommerce Storefront - Complete Fix Documentation

## Project Overview

**Goal:** Build a headless WooCommerce React storefront connected to rapidwoo.com/e-commerce with full checkout capability using Stripe payments.

**Stack:**

- Frontend: Next.js + React + Apollo Client
- Backend: WordPress + WooCommerce + WPGraphQL + WooGraphQL
- Payments: Stripe
- Deployment: Vercel

---

## Issues Fixed (In Order)

### Issue 1: CORS Errors

**Problem:**
Direct GraphQL requests from the browser to `https://rapidwoo.com/e-commerce/graphql` were blocked by CORS policy.

```
Access to fetch at 'https://rapidwoo.com/e-commerce/graphql' from origin 'https://yoursite.vercel.app'
has been blocked by CORS policy
```

**Root Cause:**
Browser security prevents cross-origin requests unless the server explicitly allows them via CORS headers.

**Solution:**
Created a Next.js API route as a proxy to bypass CORS (server-to-server requests aren't subject to CORS).

**File Created:** `src/pages/api/graphql.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0',
    };

    // Forward session header from client if present
    const sessionHeader = req.headers['woocommerce-session'];
    if (sessionHeader) {
      headers['woocommerce-session'] = Array.isArray(sessionHeader)
        ? sessionHeader[0]
        : sessionHeader;
    }

    const response = await fetch('https://rapidwoo.com/e-commerce/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // Forward session header back to client if present
    const wooSession = response.headers.get('woocommerce-session');
    if (wooSession) {
      res.setHeader('woocommerce-session', wooSession);
      res.setHeader('Access-Control-Expose-Headers', 'woocommerce-session');
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from GraphQL endpoint' });
  }
}
```

**Files Modified:**

- `src/utils/apollo/ApolloClient.js` - Changed URI from direct URL to `/api/graphql`
- `src/utils/auth.ts` - Updated to use proxy

**Senior Standard:** Yes - API proxy is the standard pattern for headless commerce to handle CORS and keep API keys server-side.

---

### Issue 2: GraphQL Field Name Errors

**Problem:**
Products weren't loading. GraphQL queries were failing silently.

**Root Cause:**
Incorrect field names in GraphQL queries. WooGraphQL uses singular form for product attributes.

**Solution:**

**File:** `src/utils/gql/GQL_QUERIES.ts`

```graphql
# WRONG
allPaColors { nodes { name } }
allPaSizes { nodes { name } }

# CORRECT
allPaColor { nodes { name } }
allPaSize { nodes { name } }
```

**Senior Standard:** Yes - GraphQL schema should be validated against the actual backend schema. A senior developer would use GraphQL introspection or IDE plugins to catch these.

---

### Issue 3: WooCommerce Session Not Persisting

**Problem:**
Cart items were lost between page loads. Session wasn't being maintained.

**Root Cause:**

1. Apollo Client afterware only saved session token on first request (had a condition checking if session already existed)
2. Browser detection used deprecated `process.browser` instead of `typeof window !== 'undefined'`
3. Session header wasn't being exposed to browser JavaScript

**Solution:**

**File:** `src/utils/apollo/ApolloClient.js`

Changed middleware browser detection:

```javascript
// WRONG
const sessionData = process.browser ? JSON.parse(localStorage.getItem('woo-session')) : null;

// CORRECT
const isBrowser = typeof window !== 'undefined';
let sessionData = null;
if (isBrowser) {
  try {
    const stored = localStorage.getItem('woo-session');
    sessionData = stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('Error parsing session data:', e);
  }
}
```

Changed afterware to always update session:

```javascript
// WRONG - only saved if no existing session
if (session && !localStorage.getItem('woo-session')) {
  localStorage.setItem('woo-session', JSON.stringify({ token: session, createdTime: Date.now() }));
}

// CORRECT - always update session
if (session && isBrowser) {
  if ('false' === session) {
    localStorage.removeItem('woo-session');
  } else {
    localStorage.setItem(
      'woo-session',
      JSON.stringify({ token: session, createdTime: Date.now() }),
    );
  }
}
```

**File:** `src/pages/api/graphql.ts`
Added header exposure for browser JavaScript:

```typescript
res.setHeader('Access-Control-Expose-Headers', 'woocommerce-session');
```

**Senior Standard:** Yes - Session management in headless commerce requires careful handling of:

1. Server-side vs client-side execution
2. Header forwarding through proxies
3. Browser security restrictions on reading response headers

---

### Issue 4: Norwegian to English Translation

**Problem:**
The original codebase was in Norwegian. Needed English for target market.

**Files Modified:**

- `src/components/Index/Hero.component.tsx` - Hero section text
- `src/components/Header/Navbar.component.tsx` - Navigation labels
- `src/components/Footer/Stickynav.component.tsx` - Mobile nav
- `src/components/Cart/CartContents.component.tsx` - Cart UI text
- `src/components/Checkout/CheckoutForm.component.tsx` - Form labels/errors
- `src/utils/auth.ts` - Error messages
- `src/components/Product/DisplayProducts.component.tsx` - Product labels
- Created `src/pages/product/[slug].tsx` - English product route

**Senior Standard:** Yes - Internationalization should ideally use i18n libraries (next-i18next, react-intl), but direct translation is acceptable for single-language sites.

---

### Issue 5: Checkout Mutation Fatal Error

**Problem:**
Checkout completely failed with:

```
Call to undefined function codecept_debug()
```

**Root Cause:**
A developer left a Codeception testing framework debug function in production code.

**Location:**

```
/wp-content/plugins/wp-graphql-woocommerce/includes/data/mutation/class-checkout-mutation.php
Line 495: \codecept_debug( $available_gateways );
```

**Solution:**
Commented out the debug line:

```php
// \codecept_debug( $available_gateways );
```

**Senior Standard:** The bug itself was NOT senior-level code. Our fix was appropriate - minimal and non-destructive. See `CHECKOUT-DEBUG-FIX.md` for detailed analysis.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js App                           │   │
│  │  ┌─────────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   React         │  │   Apollo    │  │ localStorage│  │   │
│  │  │ Components      │──│   Client    │──│ woo-session │  │   │
│  │  └─────────────────┘  └──────┬──────┘  └─────────────┘  │   │
│  └──────────────────────────────┼──────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────┘
                              │ POST /api/graphql
                              │ + woocommerce-session header
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL (Next.js API)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  /api/graphql.ts                         │   │
│  │                   (CORS Proxy)                           │   │
│  │  - Forwards session headers both directions              │   │
│  │  - Logs errors for debugging                             │   │
│  └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ POST to WooGraphQL
                              │ + woocommerce-session header
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORDPRESS SERVER                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              rapidwoo.com/e-commerce                     │   │
│  │  ┌─────────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ WooCommerce     │──│  WPGraphQL  │──│ WooGraphQL  │  │   │
│  │  │   (Cart,        │  │  (GraphQL   │  │ (WC GraphQL │  │   │
│  │  │   Orders)       │  │   Server)   │  │  Extension) │  │   │
│  │  └─────────────────┘  └─────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Session Flow

```
1. User adds item to cart
   └─► Apollo sends addToCart mutation
       └─► API proxy forwards to WooCommerce
           └─► WooCommerce returns woocommerce-session header
               └─► API proxy forwards header back
                   └─► Apollo afterware saves to localStorage

2. User continues shopping / refreshes page
   └─► Apollo middleware reads session from localStorage
       └─► Adds "woocommerce-session: Session {token}" header
           └─► API proxy forwards header to WooCommerce
               └─► WooCommerce recognizes session, returns cart

3. User checks out
   └─► Same session flow
       └─► Checkout mutation creates order
           └─► Stripe processes payment
               └─► Order confirmed
```

---

## Key Files Summary

| File                               | Purpose                  | Issues Fixed |
| ---------------------------------- | ------------------------ | ------------ |
| `src/pages/api/graphql.ts`         | CORS proxy               | #1, #3       |
| `src/utils/apollo/ApolloClient.js` | GraphQL client + session | #1, #3       |
| `src/utils/gql/GQL_QUERIES.ts`     | GraphQL queries          | #2           |
| `src/utils/auth.ts`                | Authentication           | #1, #4       |
| `src/components/Checkout/*`        | Checkout flow            | #4, #5       |
| `class-checkout-mutation.php` (WP) | Backend checkout         | #5           |

---

## Testing Checklist

- [x] Products load on homepage
- [x] Product detail pages work
- [x] Add to cart works
- [x] Cart persists across page loads
- [x] Cart shows correct items/quantities
- [x] Checkout form validates
- [x] Stripe payment processes
- [x] WooCommerce order created
- [x] Success confirmation shown

---

## Recommendations for Production

1. **Remove debug logging** - The console.log statements added for debugging should be removed or made conditional on `NODE_ENV !== 'production'`

2. **Error monitoring** - Add Sentry or similar for production error tracking

3. **Plugin updates** - Monitor wp-graphql-woocommerce for updates but test in staging first

4. **Rate limiting** - Consider adding rate limiting to the API proxy

5. **Caching** - Implement Apollo Client caching strategy for better performance

---

_Document created: January 8, 2026_
_Author: Claude Code (Opus 4.5)_
