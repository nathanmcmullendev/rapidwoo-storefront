# RapidWoo Storefront - AI-First Architecture Assessment

## Overview

Assessment of `nathanmcmullendev/rapidwoo-storefront` against AI-First Architecture principles.

**Repository:** https://github.com/nathanmcmullendev/rapidwoo-storefront
**Based on:** Forked from w3bdesign/nextjs-woocommerce
**Live:** https://rapidwoo-storefront.vercel.app

---

## Scorecard

| Principle | Score | Notes |
|-----------|-------|-------|
| **Modular Architecture** | ✅ A | Clear separation of concerns |
| **Type System** | ⚠️ B | Types exist but incomplete |
| **Documentation as AI Data** | ⚠️ C+ | Has Repomix but needs handoff docs |
| **API Boundaries** | ✅ A | Clean proxy pattern |
| **State Management** | ✅ A | Zustand store isolated |
| **File Size / Context Fit** | ✅ A | Files are small and focused |

**Overall: B+** - Good foundation, needs documentation layer

---

## Detailed Analysis

### 1. Modular Architecture ✅

**Current Structure:**
```
src/
├── components/          → UI only (15 folders, each single-purpose)
│   ├── Cart/
│   ├── Checkout/
│   ├── Product/
│   └── ...
├── hooks/               → Custom React hooks
├── pages/
│   └── api/             → Server-side only (2 files)
│       ├── graphql.ts   → GraphQL proxy
│       └── create-payment-intent.ts
├── stores/              → State management (1 file)
│   └── cartStore.ts
├── types/               → TypeScript interfaces
│   └── product.ts
└── utils/
    ├── apollo/          → Apollo client config
    ├── auth.ts          → Authentication
    ├── constants/       → App constants
    ├── functions/       → Helper functions
    └── gql/             → GraphQL queries/mutations
        ├── GQL_QUERIES.ts
        └── GQL_MUTATIONS.ts
```

**What's Good:**
- Each component folder is single-purpose
- API routes are isolated (only 2 files)
- GraphQL queries separated from components
- State management in dedicated `stores/` folder

**AI Benefit:** Claude can work on `Cart/` without loading `Checkout/`. Files fit in context window.

---

### 2. Type System ⚠️

**Current Types (src/types/product.ts):**
```typescript
export interface Product {
  __typename: string;
  databaseId: number;
  name: string;
  onSale: boolean;
  slug: string;
  image: Image;
  price: string;
  regularPrice: string;
  salePrice?: string;
  productCategories?: { nodes: ProductCategory[] };
  allPaColors?: { nodes: ColorNode[] };
  allPaSizes?: { nodes: SizeNode[] };
  variations: { nodes: Array<...> };
}
```

**What's Good:**
- Product interface is well-defined
- Nested types (Image, Node, ColorNode, etc.)

**What's Missing:**
```typescript
// NEEDS: Cart types
interface CartItem { ... }
interface Cart { ... }

// NEEDS: Checkout types
interface CheckoutInput { ... }
interface Order { ... }

// NEEDS: API response types
interface GraphQLResponse<T> { ... }
interface WooCommerceSession { ... }
```

**AI Impact:** Without cart/checkout types, AI has to guess data shapes.

---

### 3. Documentation as AI Data ⚠️

**Current State:**

| Doc | Exists | AI-Consumable |
|-----|--------|---------------|
| README.md | ✅ | ⚠️ Generic (from original fork) |
| DOCS/repository_context.txt | ✅ | ✅ Repomix - full codebase |
| DOCS/PROJECT_REVIEW.md | ✅ | ❓ Need to check |
| DOCS/SUGGESTIONS.md | ✅ | ❓ Need to check |
| HANDOFF.md | ❌ | Missing |
| TROUBLESHOOTING.md | ❌ | Missing |

**What's Good:**
- Repomix generates full codebase context for AI
- Some documentation exists

**What's Missing:**
```markdown
# MISSING: HANDOFF.md

## Quick Context
- This is the RapidWoo headless storefront
- Connected to: rapidwoo.com/e-commerce
- Stripe test mode enabled

## Credentials
- WooCommerce: rapidwoo.com/e-commerce/graphql
- Stripe: pk_test_xxx (in Vercel env vars)

## Recent Fixes
1. CORS → Created /api/graphql proxy
2. Session → Fixed middleware/afterware
3. codecept_debug → Commented line 495 on server

## Known Issues
- Algolia disabled (no API key)
- Norwegian text still in some places
```

---

### 4. API Boundaries ✅

**GraphQL Proxy (src/pages/api/graphql.ts):**
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Session header forwarding
  const sessionHeader = req.headers['woocommerce-session'];
  
  // Logging for debugging
  console.log(`[GraphQL Proxy] Operation: ${operationName}`);
  
  // Error handling
  if (data.errors) {
    console.error('[GraphQL Proxy] WooCommerce errors:', ...);
  }
  
  // Session propagation back to client
  res.setHeader('Access-Control-Expose-Headers', 'woocommerce-session');
}
```

**What's Good:**
- Clean proxy pattern
- Proper error logging
- Session handling both directions
- Single responsibility

**AI Benefit:** This file is self-contained. AI can understand and modify it without context from other files.

---

### 5. State Management ✅

**Zustand Store (src/stores/cartStore.ts):**
- Single store for cart state
- Isolated from UI components
- Predictable state shape

**AI Benefit:** State logic is in one place. AI doesn't have to hunt through components.

---

### 6. File Size Analysis ✅

| File | Lines | AI Context Fit |
|------|-------|----------------|
| api/graphql.ts | ~60 | ✅ Easily fits |
| types/product.ts | ~60 | ✅ Easily fits |
| GQL_QUERIES.ts | ~100-200 | ✅ Fits |
| Components | ~50-150 each | ✅ All fit |

**No files exceed 500 lines** - excellent for AI consumption.

---

## Recommendations

### Priority 1: Create HANDOFF.md

```markdown
# RapidWoo Storefront - Handoff Document

## What This Is
Headless WooCommerce storefront for rapidwoo.com/e-commerce

## Tech Stack
- Next.js 15 + React 18 + TypeScript
- Apollo Client for GraphQL
- Zustand for state
- Tailwind CSS
- Stripe for payments

## Environment Variables
| Variable | Purpose | Where Set |
|----------|---------|-----------|
| NEXT_PUBLIC_GRAPHQL_URL | WooCommerce GraphQL | Vercel |
| STRIPE_SECRET_KEY | Payment processing | Vercel |

## Backend Connection
- WordPress: rapidwoo.com/e-commerce
- GraphQL: rapidwoo.com/e-commerce/graphql
- API Proxy: /api/graphql (bypasses CORS)

## Fixes Applied (Jan 2026)
1. CORS proxy created
2. Session header forwarding fixed
3. codecept_debug commented out on server
4. Norwegian text translated

## Key Files
| File | What It Does |
|------|--------------|
| src/pages/api/graphql.ts | Proxies requests to WooCommerce |
| src/stores/cartStore.ts | Cart state management |
| src/utils/gql/GQL_MUTATIONS.ts | All GraphQL mutations |

## To Continue Development
1. Read this file
2. Check src/types/product.ts for data shapes
3. Use /api/graphql for all WooCommerce calls
```

### Priority 2: Expand Types

Create `src/types/cart.ts`:
```typescript
export interface CartItem {
  key: string;
  product: {
    node: {
      databaseId: number;
      name: string;
      slug: string;
      image?: { sourceUrl: string };
    };
  };
  quantity: number;
  total: string;
  variation?: {
    node: {
      databaseId: number;
      name: string;
      price: string;
    };
  };
}

export interface Cart {
  contents: {
    nodes: CartItem[];
    itemCount: number;
  };
  total: string;
  subtotal: string;
}
```

Create `src/types/checkout.ts`:
```typescript
export interface BillingInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface CheckoutInput {
  billing: BillingInput;
  paymentMethod: string;
  shipToDifferentAddress?: boolean;
}

export interface Order {
  databaseId: number;
  orderNumber: string;
  status: string;
  total: string;
}
```

### Priority 3: Add Error Documentation

Create `DOCS/TROUBLESHOOTING.md`:
```markdown
## Common Errors

### CORS Request Blocked
**Error:** Cross-Origin Request Blocked
**Cause:** Calling WooCommerce GraphQL directly from browser
**Fix:** Use /api/graphql proxy

### codecept_debug is not defined
**Error:** Fatal PHP error on checkout
**Cause:** Debug code in WooGraphQL plugin
**Fix:** Comment out line 495 in class-checkout-mutation.php
**Server path:** /home/jsarts5/public_html/e-commerce/wp-content/plugins/...

### Session Not Persisting
**Symptom:** Cart empties on page refresh
**Cause:** Session token not being stored/sent
**Fix:** Check localStorage for woo-session token
```

---

## Summary

| Good | Needs Work |
|------|------------|
| ✅ Modular file structure | ❌ No handoff document |
| ✅ Clean API proxy | ❌ Incomplete types (cart, checkout) |
| ✅ Isolated state management | ❌ README still references original fork |
| ✅ Small, focused files | ❌ No troubleshooting guide |
| ✅ Repomix for full context | ❌ No credentials reference |

**Next Action:** Create HANDOFF.md with project-specific context, then expand type definitions.

---

*Assessment Date: January 8, 2026*
*Based on: AI-First Architecture Guide*
