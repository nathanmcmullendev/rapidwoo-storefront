# RapidWoo Storefront Performance Guide

## Performance Summary

| Metric          | WooCommerce (Baseline) | RapidWoo Storefront |
| --------------- | ---------------------- | ------------------- |
| PageSpeed Score | 75                     | **83-91**           |
| Improvement     | -                      | **+10-16 points**   |

## What Was Implemented

### 1. Static Site Generation (SSG) with Incremental Static Regeneration (ISR)

**Files:**

- `src/pages/index.tsx` - Homepage with SSG
- `src/pages/products.tsx` - Products listing with SSG
- `src/pages/product/[slug].tsx` - Product detail pages with SSG
- `src/utils/graphql-fetch.ts` - Server-side GraphQL fetching

**How it works:**

- Pages are pre-rendered at build time (SSG)
- Pages revalidate every 60 seconds (ISR)
- No client-side data fetching for initial render
- Instant page loads from CDN cache

### 2. Cloudinary Image Optimization

**File:** `src/utils/images.ts`

**Features:**

- On-the-fly image optimization via Cloudinary fetch API
- Automatic WebP/AVIF format conversion
- Responsive srcSet generation
- No images uploaded to Cloudinary - uses fetch API

**Size presets:**

```typescript
thumbnail: 100px
grid: 400px      // Product cards
preview: 800px   // Product detail
full: 1200px     // Lightbox
hero: 1600px     // Hero images
```

### 3. Mobile-First Layout

**File:** `src/components/Product/ProductList.component.tsx`

**Changes:**

- Filters hidden by default on mobile (toggle button)
- 2-column grid on mobile (shows 4 products above fold)
- Reduced padding for maximum viewport usage

### 4. Eager Loading for Above-Fold Images

**File:** `src/components/Product/ProductCard.component.tsx`

**Implementation:**

- First 6 images: `loading="eager"`, `fetchPriority="high"`, `decoding="sync"`
- Remaining images: `loading="lazy"`, `fetchPriority="auto"`, `decoding="async"`
- Explicit `width` and `height` attributes prevent CLS

### 5. Apollo Client Optimization

**Files:**

- `src/utils/apollo/ApolloClient.js`
- `src/utils/auth.ts`

**Changes:**

- Added `connectToDevTools: false` to prevent DevTools connections
- No telemetry configured (Apollo Client has no built-in telemetry)

## Environment Variables

Required in `.env.local`:

```bash
# GraphQL endpoint
NEXT_PUBLIC_GRAPHQL_URL="https://rapidwoo.com/e-commerce/graphql"

# Cloudinary cloud name for image optimization
NEXT_PUBLIC_CLOUDINARY_CLOUD="dh4qwuvuo"

# ISR revalidation secret (for on-demand revalidation)
REVALIDATE_SECRET="your-secret-here"

# Stripe keys (for checkout)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
```

## On-Demand Revalidation

**Endpoint:** `POST /api/revalidate`

**Usage:**

```bash
# Revalidate specific product
curl -X POST https://your-site.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-secret", "slug": "product-slug"}'

# Revalidate multiple paths
curl -X POST https://your-site.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-secret", "paths": ["/", "/products"]}'
```

**WooCommerce Integration:**
Configure WooCommerce webhooks to call this endpoint when products are updated.

## Known Limitations

1. **PageSpeed Score Variability (83-91)**
   - Cloudinary cold cache adds latency on first request
   - Score varies based on server response times
   - Mobile emulation in PageSpeed can vary

2. **Apollo Deprecation Warnings**
   - Build shows `go.apollo.dev` warning URLs (not network requests)
   - Caused by `onCompleted` callbacks (deprecated in Apollo 3.14)
   - Does not affect functionality

3. **srcSet Browser Selection**
   - Browser may load larger images than needed
   - `sizes` attribute set to `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw`
   - Changing srcSet requires matching `src` URL exactly

4. **Product Count**
   - Currently fetches 12 products on /products page
   - Configurable in `src/utils/graphql-fetch.ts` (PRODUCTS_QUERY)

## Do Not Change

These optimizations are stable - avoid modifying:

1. **Image srcSet/sizes** - Browser selection is sensitive to changes
2. **Eager loading threshold** - First 6 images is optimal
3. **SSG/ISR configuration** - 60-second revalidation is balanced
4. **Cloudinary image sizes** - 400px grid size is optimal for quality/size

## Performance Testing

Run PageSpeed test on:

- https://rapidwoo-storefront.vercel.app/ (Homepage)
- https://rapidwoo-storefront.vercel.app/products (Products page)

Compare against:

- https://rapidwoo.com/e-commerce/store (WooCommerce baseline: ~75)

---

_Last updated: January 2026_
_Baseline improvement: +10-16 points over WooCommerce_
