/**
 * Cloudinary Image Optimization Utility
 * Optimized for mobile-first 2-column product grid
 */

const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || 'dh4qwuvuo';
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch`;

export const IMAGE_SIZES = {
  thumbnail: 100,
  grid: 300, // Reduced from 400 - optimal for 2-col mobile
  preview: 600, // Reduced from 800
  full: 1200,
  hero: 1600,
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

/**
 * Generates an optimized Cloudinary URL for a given source image
 */
export function getOptimizedImageUrl(
  sourceUrl: string | undefined,
  size: ImageSize = 'preview',
): string {
  if (!sourceUrl) {
    return '/placeholder.png';
  }

  if (sourceUrl.includes('res.cloudinary.com')) {
    return sourceUrl;
  }

  const width = IMAGE_SIZES[size];
  const transforms = `w_${width},c_limit,q_auto,f_auto`;
  const encodedUrl = encodeURIComponent(sourceUrl);

  return `${CLOUDINARY_BASE}/${transforms}/${encodedUrl}`;
}

/**
 * Generates srcSet for product cards - only includes sizes needed for mobile
 * Avoids loading 1200px or 1600px images on product cards
 */
export function getCardSrcSet(sourceUrl: string | undefined): string {
  if (!sourceUrl || sourceUrl.includes('res.cloudinary.com')) return '';

  const sizes = [150, 300, 450];
  return sizes
    .map((w) => {
      const transforms = `w_${w},c_limit,q_auto,f_auto`;
      const encodedUrl = encodeURIComponent(sourceUrl);
      return `${CLOUDINARY_BASE}/${transforms}/${encodedUrl} ${w}w`;
    })
    .join(', ');
}

/**
 * Generates full srcSet for product detail pages
 */
export function getImageSrcSet(sourceUrl: string | undefined): string {
  if (!sourceUrl || sourceUrl.includes('res.cloudinary.com')) return '';

  return (Object.keys(IMAGE_SIZES) as ImageSize[])
    .map((key) => {
      const url = getOptimizedImageUrl(sourceUrl, key);
      const width = IMAGE_SIZES[key];
      return `${url} ${width}w`;
    })
    .join(', ');
}

// Updated sizes for 2-column mobile grid
export const CARD_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
export const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw';
