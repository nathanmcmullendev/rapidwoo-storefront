/*eslint complexity: ["error", 20]*/
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

import { filteredVariantPrice, paddedPrice } from '@/utils/functions/functions';
import { getOptimizedImageUrl, getImageSrcSet, DEFAULT_SIZES } from '@/utils/images';

interface Image {
  sourceUrl?: string;
}

interface Node {
  price: string;
  regularPrice: string;
  salePrice?: string | null;
}

interface Variations {
  nodes: Node[];
}

interface RootObject {
  name: string;
  onSale: boolean;
  slug: string;
  image: Image | null;
  price: string;
  regularPrice: string;
  salePrice?: string | null;
  variations?: Variations;
}

interface IDisplayProductsProps {
  products: RootObject[];
}

/**
 * Displays all of the products as long as length is defined.
 * Does a map() over the props array and utilizes uuidv4 for unique key values.
 * @function DisplayProducts
 * @param {IDisplayProductsProps} products Products to render
 * @returns {JSX.Element} - Rendered component
 */

const DisplayProducts = ({ products }: IDisplayProductsProps) => (
  <section className="container mx-auto bg-white py-12">
    <div
      id="product-container"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
    >
      {products ? (
        products.map(
          ({ name, price, regularPrice, salePrice, onSale, slug, image, variations }, index) => {
            // Add padding/empty character after currency symbol here
            if (price) {
              price = paddedPrice(price, '$');
            }
            if (regularPrice) {
              regularPrice = paddedPrice(regularPrice, '$');
            }
            if (salePrice) {
              salePrice = paddedPrice(salePrice, '$');
            }

            // First 6 products are above fold - load eagerly for LCP
            const isAboveFold = index < 6;
            const imageUrl = getOptimizedImageUrl(image?.sourceUrl, 'grid');
            const srcSet = getImageSrcSet(image?.sourceUrl);

            return (
              <div key={uuidv4()} className="group">
                <Link href={`/product/${encodeURIComponent(slug)}`}>
                  <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                    <img
                      id="product-image"
                      className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
                      alt={name}
                      src={imageUrl}
                      srcSet={srcSet || undefined}
                      sizes={srcSet ? DEFAULT_SIZES : undefined}
                      loading={isAboveFold ? 'eager' : 'lazy'}
                      fetchPriority={isAboveFold ? 'high' : 'auto'}
                      decoding={isAboveFold ? 'sync' : 'async'}
                    />
                  </div>
                </Link>
                <Link href={`/product/${encodeURIComponent(slug)}`}>
                  <span>
                    <div className="mt-4">
                      <p className="text-xl font-bold text-center cursor-pointer hover:text-gray-600 transition-colors">
                        {name}
                      </p>
                    </div>
                  </span>
                </Link>
                <div className="mt-2 text-center">
                  {onSale ? (
                    <div className="flex justify-center items-center space-x-2">
                      <span className="text-xl font-bold text-red-600">
                        {variations && filteredVariantPrice(price, '')}
                        {!variations && salePrice}
                      </span>
                      <span className="text-lg text-gray-500 line-through">
                        {variations && filteredVariantPrice(price, 'right')}
                        {!variations && regularPrice}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg text-gray-900">{price}</span>
                  )}
                </div>
              </div>
            );
          },
        )
      ) : (
        <div className="mx-auto text-xl font-bold text-center text-gray-800 no-underline uppercase">
          No products found
        </div>
      )}
    </div>
  </section>
);

export default DisplayProducts;
