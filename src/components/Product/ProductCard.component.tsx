import Link from 'next/link';
import { paddedPrice } from '@/utils/functions/functions';
import { getOptimizedImageUrl, getCardSrcSet, CARD_SIZES } from '@/utils/images';

interface ProductCardProps {
  databaseId: number;
  name: string;
  price: string;
  regularPrice: string;
  salePrice?: string;
  onSale: boolean;
  slug: string;
  image?: {
    sourceUrl?: string;
  } | null;
  /** True for above-fold images that should load eagerly */
  preloaded?: boolean;
}

const ProductCard = ({
  name,
  price,
  regularPrice,
  salePrice,
  onSale,
  slug,
  image,
  preloaded = false,
}: ProductCardProps) => {
  const formattedPrice = price ? paddedPrice(price, '$') : price;
  const formattedRegularPrice = regularPrice ? paddedPrice(regularPrice, '$') : regularPrice;
  const formattedSalePrice = salePrice ? paddedPrice(salePrice, '$') : salePrice;

  // Generate optimized Cloudinary URLs - using smaller card-specific srcSet
  const imageUrl = getOptimizedImageUrl(image?.sourceUrl, 'grid');
  const srcSet = getCardSrcSet(image?.sourceUrl);

  return (
    <div className="group">
      <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
        <Link href={`/product/${slug}`}>
          {image?.sourceUrl ? (
            <img
              src={imageUrl}
              alt={name}
              width={300}
              height={400}
              srcSet={srcSet || undefined}
              sizes={srcSet ? CARD_SIZES : undefined}
              className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
              loading={preloaded ? 'eager' : 'lazy'}
              fetchPriority={preloaded ? 'high' : 'auto'}
              decoding={preloaded ? 'sync' : 'async'}
            />
          ) : (
            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </Link>
      </div>

      <Link href={`/product/${slug}`}>
        <div className="mt-2">
          <p className="text-sm md:text-base font-medium text-center cursor-pointer hover:text-gray-600 transition-colors line-clamp-2">
            {name}
          </p>
        </div>
      </Link>
      <div className="mt-1 text-center">
        {onSale ? (
          <div className="flex items-center justify-center gap-1">
            <span className="text-sm md:text-base font-bold text-red-600">
              {formattedSalePrice}
            </span>
            <span className="text-xs md:text-sm text-gray-500 line-through">
              {formattedRegularPrice}
            </span>
          </div>
        ) : (
          <span className="text-sm md:text-base text-gray-900">{formattedPrice}</span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
