# RapidWoo Storefront Performance Guide

## 1. Final Results

| Metric          | WooCommerce (Before)  | RapidWoo (After)        | Improvement        |
| --------------- | --------------------- | ----------------------- | ------------------ |
| PageSpeed Score | 75                    | **99**                  | **+24 points**     |
| LCP             | 4.0s                  | **1.8s**                | **55% faster**     |
| TBT             | 280ms                 | **20ms**                | **93% reduction**  |
| Filmstrip       | Products at frame 7-8 | **Products at frame 1** | Instant visibility |

### Visual Proof

- **Before**: PageSpeed filmstrip showed empty gray boxes for first 6 frames
- **After**: Products visible from frame 1, fully loaded by frame 4

---

## 2. All Optimizations Applied (Chronological)

### 2.1 SSG + ISR Implementation

**What**: Static Site Generation with Incremental Static Regeneration

**Files Modified**:

- `src/pages/index.tsx`
- `src/pages/products.tsx`
- `src/pages/product/[slug].tsx`
- `src/utils/graphql-fetch.ts` (NEW)
- `src/pages/api/revalidate.ts` (NEW)

**Code Pattern**:

```typescript
export const getStaticProps: GetStaticProps = async () => {
  const data = await fetchGraphQL(PRODUCTS_QUERY);
  return {
    props: { products: data.products.nodes },
    revalidate: 60, // ISR: regenerate every 60 seconds
  };
};
```

**Why It Helped**: Eliminated runtime API wait. Pages pre-rendered at build time and served instantly from CDN.

**Impact**: TBT reduced from 280ms to ~50ms

---

### 2.2 Cloudinary Image Optimization

**What**: On-the-fly image optimization via Cloudinary fetch API

**File**: `src/utils/images.ts`

**URL Pattern**:

```
https://res.cloudinary.com/dh4qwuvuo/image/fetch/w_{size},c_limit,q_auto,f_auto/{encoded_url}
```

**Size Presets**:

```typescript
export const IMAGE_SIZES = {
  thumbnail: 100, // Tiny previews
  grid: 400, // Product cards
  preview: 800, // Product detail
  full: 1200, // Lightbox
  hero: 1600, // Hero images
};
```

**Why It Helped**:

- Automatic WebP/AVIF conversion (50-70% smaller than JPEG)
- Quality optimization (q_auto)
- Global CDN delivery
- No API key required (fetch mode uses cloud name only)

**Impact**: Image sizes reduced from ~150KB to ~30KB each

---

### 2.3 Layout Fixes for Above-the-Fold Content

**What**: Restructured mobile layout so products appear without scrolling

**File**: `src/components/Product/ProductList.component.tsx`

**Changes**:

1. **Collapsible filters**: Hidden by default on mobile, toggle button added
2. **2-column grid**: `grid-cols-2` on mobile shows 4 products above fold
3. **Reduced padding**: `py-8` → `py-3` maximizes viewport usage

**Code**:

```tsx
// Mobile filter toggle
<button onClick={() => setShowFilters(!showFilters)} className="md:hidden ...">
  {showFilters ? 'Hide Filters' : 'Show Filters'}
</button>

// 2-column mobile grid
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
```

**Why It Helped**: Products visible immediately without scrolling. LCP now measures actual product images, not filter text.

**Impact**: LCP element changed from heading text to product image

---

### 2.4 Eager/Lazy Loading Strategy

**What**: Priority loading for above-fold images

**File**: `src/components/Product/ProductCard.component.tsx`

**Implementation**:

```tsx
<img
  src={imageUrl}
  loading={preloaded ? 'eager' : 'lazy'}
  fetchPriority={preloaded ? 'high' : 'auto'}
  decoding={preloaded ? 'sync' : 'async'}
  width={400}
  height={533}
/>
```

**File**: `src/components/Product/ProductList.component.tsx`

```tsx
<ProductCard preloaded={index < 6} ... />
```

**Why It Helped**:

- First 6 images download immediately with high priority
- Remaining images lazy-load on scroll
- Explicit dimensions prevent layout shift (CLS)

**Impact**: Above-fold images start downloading before page fully parses

---

### 2.5 Responsive Image Sizes Fix (THE KEY FIX: 89 → 99)

**What**: Corrected `sizes` attribute to match 2-column grid layout

**File**: `src/utils/images.ts`

**Before** (wrong):

```typescript
export const DEFAULT_SIZES = '(max-width: 640px) 100vw, ...';
// 640px viewport × 100vw = 640px → browser picks w_800 (~67KB)
```

**After** (correct):

```typescript
export const DEFAULT_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
// 640px viewport × 50vw = 320px → browser picks w_400 (~30KB)
```

**Why It Helped**:

- Browser uses `sizes` to determine which `srcSet` image to download
- With 2-column grid, each image is 50% viewport width, not 100%
- Correct sizes = correct image selection = 50% bandwidth savings

**Impact**: LCP 3.7s → 1.8s, Score 89 → 99

---

### 2.6 Apollo DevTools Disabled

**What**: Prevented Apollo DevTools browser extension connection

**Files**:

- `src/utils/apollo/ApolloClient.js`
- `src/utils/auth.ts`

**Code**:

```javascript
const client = new ApolloClient({
  connectToDevTools: false,
  // ...
});
```

**Why It Helped**: Removed unnecessary DevTools overhead in production

**Note**: The `go.apollo.dev` messages in build output are deprecation warnings, not telemetry

---

## 3. Failed Approaches (Lessons Learned)

### Attempted: Custom Card srcSet

**What we tried**: Reduce srcSet from `100/400/800/1200/1600` to `150/300/450`

**Result**: Broke eager loading completely. Images appeared gray for 6 frames.

**Root Cause**: The `src` URL (`w_300`) didn't match any `srcSet` URL. Browser couldn't use the preloaded `src` image and waited for srcSet resolution.

**Lesson**: `src` URL must be included in `srcSet` for browser to use the preloaded image.

**Action**: Reverted via `git revert HEAD`

---

## 4. Environment Variables Required

```bash
# Cloudinary cloud name (no API key needed for fetch mode)
NEXT_PUBLIC_CLOUDINARY_CLOUD=dh4qwuvuo

# ISR revalidation secret
REVALIDATE_SECRET=rapidwoo-isr-secret-2026-x7k9m2

# GraphQL endpoint
NEXT_PUBLIC_GRAPHQL_URL=https://rapidwoo.com/e-commerce/graphql

# Stripe (for checkout)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 5. On-Demand Revalidation

When WooCommerce products change, trigger ISR revalidation:

```bash
# Revalidate specific product
curl -X POST https://rapidwoo-storefront.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"rapidwoo-isr-secret-2026-x7k9m2","slug":"product-slug"}'

# Revalidate multiple paths
curl -X POST https://rapidwoo-storefront.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"rapidwoo-isr-secret-2026-x7k9m2","paths":["/","/products"]}'
```

**WooCommerce Integration**: Configure webhooks to call this endpoint on product create/update/delete.

---

## 6. Key Technical Insights

1. **LCP Breakdown Revealed the Truth**
   - PageSpeed showed 80% of LCP time was "render delay", only 20% was image download
   - The fix wasn't faster images—it was correct image selection

2. **`sizes` Attribute Determines Download**
   - Browser ignores `src` when `srcSet` is present
   - `sizes` tells browser the display width → browser picks appropriate `srcSet` image
   - Wrong `sizes` = wrong image downloaded = wasted bandwidth

3. **`src` Must Match `srcSet`**
   - If `src` URL isn't in `srcSet`, browser can't use the preloaded image
   - This caused our failed optimization attempt

4. **Cloudinary Fetch Mode is Free**
   - No API keys required—just the cloud name
   - Works with any external image URL
   - Automatic format conversion and compression

---

## 7. Files Modified This Session

| File                                               | Change                           |
| -------------------------------------------------- | -------------------------------- |
| `src/pages/index.tsx`                              | Added SSG with getStaticProps    |
| `src/pages/products.tsx`                           | SSG + reduced padding            |
| `src/pages/product/[slug].tsx`                     | SSG with getStaticPaths          |
| `src/pages/api/revalidate.ts`                      | NEW: On-demand ISR endpoint      |
| `src/utils/graphql-fetch.ts`                       | NEW: Server-side GraphQL utility |
| `src/utils/images.ts`                              | Cloudinary utility + sizes fix   |
| `src/components/Product/ProductCard.component.tsx` | Eager loading, dimensions        |
| `src/components/Product/ProductList.component.tsx` | Collapsible filters, 2-col grid  |
| `src/utils/apollo/ApolloClient.js`                 | DevTools disabled                |
| `src/utils/auth.ts`                                | DevTools disabled                |
| `RAPIDWOO-PERFORMANCE-GUIDE.md`                    | This documentation               |

---

## 8. Git Commits This Session

```
bbb965fb fix: correct sizes attribute for 2-col mobile grid
1273c5cf docs: add performance optimization guide
73d620c6 Revert "perf: optimize image delivery for lcp improvement"
debf3268 perf: optimize image delivery for lcp improvement (REVERTED)
6946dbfe fix: show products above fold on mobile
ade31d3f chore: disable apollo devtools connection
0bc6c925 perf: optimize products page lcp and cls
0157088a perf: optimize images with cloudinary for faster lcp
6168d982 feat: implement ssg with isr for instant page loads
6facee06 perf: optimize bundle size and image loading for 90+ pagespeed
```

---

## 9. Performance Testing

**Test URLs**:

- Homepage: https://rapidwoo-storefront.vercel.app/
- Products: https://rapidwoo-storefront.vercel.app/products
- Product Detail: https://rapidwoo-storefront.vercel.app/product/anchor-bracelet

**Baseline Comparison**:

- WooCommerce: https://rapidwoo.com/e-commerce/store (Score: ~75)

**Key Metrics to Monitor**:

- LCP: Target < 2.5s (achieved: 1.8s)
- TBT: Target < 200ms (achieved: 20ms)
- CLS: Target < 0.1 (achieved: 0)

---

## 10. Do Not Modify

These configurations are optimized and stable:

1. **`sizes` attribute**: `50vw` on mobile matches 2-col grid
2. **`srcSet`**: Must include the `src` URL
3. **Image dimensions**: `width={400} height={533}` prevents CLS
4. **Eager loading**: First 6 images is optimal threshold
5. **ISR interval**: 60 seconds balances freshness and build load

---

_Final Score: 99/100_
_Improvement: +24 points over WooCommerce baseline_
_Session Date: January 2026_
