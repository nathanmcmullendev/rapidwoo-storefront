/**
 * Cloudinary Image Optimization Utility
 *
 * Uses Cloudinary's fetch API to optimize external images on-the-fly.
 * This provides WebP/AVIF format conversion, quality optimization, and resizing
 * without requiring images to be uploaded to Cloudinary.
 *
 * Benefits:
 * - ~60KB per image vs multi-MB originals
 * - Automatic WebP/AVIF based on browser support
 * - CDN caching for fast global delivery
 * - Zero client-side JavaScript overhead
 */

const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || 'dh4qwuvuo';
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch`;

/**
 * Image size presets
 * - thumbnail: Product grid cards (~30-50KB)
 * - preview: Product detail page (~80-120KB)
 * - full: Lightbox / high-res view (~150-200KB)
 */
export const IMAGE_SIZES = {
  thumbnail: 100,
  grid: 400,
  preview: 800,
  full: 1200,
  hero: 1600,
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

/**
 * Generates an optimized Cloudinary URL for a given source image
 *
 * @param sourceUrl - Original image URL (e.g., from WooCommerce)
 * @param size - Size preset (thumbnail | preview | full)
 * @returns Optimized Cloudinary fetch URL
 *
 * @example
 * getOptimizedImageUrl('https://example.com/image.jpg', 'thumbnail')
 * // => 'https://res.cloudinary.com/dh4qwuvuo/image/fetch/w_400,c_limit,q_auto,f_auto/https%3A%2F%2Fexample.com%2Fimage.jpg'
 */
export function getOptimizedImageUrl(
  sourceUrl: string | undefined,
  size: ImageSize = 'preview',
): string {
  // Return placeholder for missing images
  if (!sourceUrl) {
    return process.env.NEXT_PUBLIC_PLACEHOLDER_SMALL_IMAGE_URL || '/placeholder.png';
  }

  // Don't double-process Cloudinary URLs
  if (sourceUrl.includes('res.cloudinary.com')) {
    return sourceUrl;
  }

  const width = IMAGE_SIZES[size];

  // Transformation parameters:
  // w_XXX = width constraint
  // c_limit = don't upscale, only downscale
  // q_auto = automatic quality optimization
  // f_auto = automatic format (WebP/AVIF based on browser)
  const transforms = `w_${width},c_limit,q_auto,f_auto`;
  const encodedUrl = encodeURIComponent(sourceUrl);

  return `${CLOUDINARY_BASE}/${transforms}/${encodedUrl}`;
}

/**
 * Generates srcSet string for responsive images
 *
 * @param sourceUrl - Original image URL
 * @returns srcSet string with all size variants
 *
 * @example
 * getImageSrcSet('https://example.com/image.jpg')
 * // => 'https://res.cloudinary.com/.../w_400/.../image.jpg 400w, .../w_800/... 800w, .../w_1200/... 1200w'
 */
export function getImageSrcSet(sourceUrl: string | undefined): string {
  if (!sourceUrl) return '';

  // Don't generate srcSet for already-optimized Cloudinary URLs
  if (sourceUrl.includes('res.cloudinary.com')) {
    return '';
  }

  return (Object.keys(IMAGE_SIZES) as ImageSize[])
    .map((key) => {
      const url = getOptimizedImageUrl(sourceUrl, key);
      const width = IMAGE_SIZES[key];
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Default sizes attribute for responsive images
 * Matches the typical grid layout breakpoints (2-col mobile, 3-4 col desktop)
 */
export const DEFAULT_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';

/**
 * PDP (Product Detail Page) sizes attribute
 * Single product image in 2-column layout:
 * - Mobile: container is ~90% viewport (max-w-xl constraint)
 * - Desktop: 2-col grid means image is ~45% viewport
 */
export const PDP_SIZES = '(max-width: 768px) 90vw, 45vw';

/**
 * Standard image dimensions for CLS prevention
 * These match common aspect ratios used in the storefront
 */
export const IMAGE_DIMENSIONS = {
  /** Product cards in grid (3:4 aspect ratio) */
  grid: { width: 400, height: 533 },
  /** PDP main image (3:4 aspect ratio, larger) */
  pdp: { width: 600, height: 800 },
  /** Cart thumbnails (1:1 aspect ratio) */
  thumbnail: { width: 96, height: 96 },
} as const;

/**
 * Props interface for optimized image components
 */
export interface OptimizedImageProps {
  src: string | undefined;
  alt: string;
  size?: ImageSize;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'sync' | 'async' | 'auto';
  sizes?: string;
}
