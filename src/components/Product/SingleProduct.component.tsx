// Imports
import { useState, useEffect, useMemo } from 'react';

// Utils
import { paddedPrice } from '@/utils/functions/functions';

// Components
import AddToCart, { IProductRootObject, IVariationNodes } from './AddToCart.component';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner.component';

const SingleProduct = ({ product }: IProductRootObject) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedVariationId, setSelectedVariationId] = useState<number | null>(null);
  const [currentImage, setCurrentImage] = useState<string | undefined>();

  const placeholderFallBack = 'https://via.placeholder.com/600';

  // Find the currently selected variation
  const selectedVariation = useMemo(() => {
    if (!product.variations || !selectedVariationId) return null;
    return (
      product.variations.nodes.find((v: IVariationNodes) => v.databaseId === selectedVariationId) ||
      null
    );
  }, [product.variations, selectedVariationId]);

  // Initialize image with product image
  useEffect(() => {
    setCurrentImage(product.image?.sourceUrl || placeholderFallBack);
  }, [product.image]);

  // Set default variation on mount (first available variant, like WooCommerce)
  useEffect(() => {
    setIsLoading(false);
    if (product.variations && product.variations.nodes.length > 0) {
      // Find first in-stock variant, or fallback to first variant
      const inStockVariant = product.variations.nodes.find(
        (v: IVariationNodes) => v.stockStatus === 'IN_STOCK' || v.stockQuantity > 0,
      );
      const defaultVariant = inStockVariant || product.variations.nodes[0];
      setSelectedVariationId(defaultVariant.databaseId);
    }
  }, [product.variations]);

  // Update image when variant selection changes
  useEffect(() => {
    if (selectedVariationId && product.variations) {
      const variant = product.variations.nodes.find(
        (v: IVariationNodes) => v.databaseId === selectedVariationId,
      );
      if (variant?.image?.sourceUrl) {
        setCurrentImage(variant.image.sourceUrl);
      } else {
        // Fall back to product image if variant has no image
        setCurrentImage(product.image?.sourceUrl || placeholderFallBack);
      }
    }
  }, [selectedVariationId, product.variations, product.image]);

  // Get display values - use variant data if selected, otherwise product data
  const displayPrice = useMemo(() => {
    if (selectedVariation) {
      // Use variant price
      const price = selectedVariation.onSale
        ? selectedVariation.salePrice
        : selectedVariation.regularPrice;
      return price ? paddedPrice(price, '$') : '';
    }
    // Use product price
    return product.price ? paddedPrice(product.price, '$') : '';
  }, [selectedVariation, product.price]);

  const displayRegularPrice = useMemo(() => {
    if (selectedVariation) {
      return selectedVariation.regularPrice ? paddedPrice(selectedVariation.regularPrice, '$') : '';
    }
    return product.regularPrice ? paddedPrice(product.regularPrice, '$') : '';
  }, [selectedVariation, product.regularPrice]);

  const isOnSale = selectedVariation ? selectedVariation.onSale : product.onSale;

  const stockQuantity = selectedVariation ? selectedVariation.stockQuantity : product.stockQuantity;

  // Strip out HTML from description
  let descriptionText = '';
  if (typeof window !== 'undefined' && product.description) {
    descriptionText =
      new DOMParser().parseFromString(product.description, 'text/html').body.textContent || '';
  }

  const handleVariationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVariationId = Number(e.target.value);
    setSelectedVariationId(newVariationId);
  };

  return (
    <section className="bg-white mb-[8rem] md:mb-12">
      {isLoading ? (
        <div className="h-56 mt-20">
          <p className="text-xl font-bold text-center">Loading product...</p>
          <br />
          <LoadingSpinner />
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:grid md:grid-cols-2 md:gap-8">
            {/* Image Container */}
            <div className="mb-6 md:mb-0 group">
              <div className="max-w-xl mx-auto aspect-[3/4] relative overflow-hidden bg-gray-100">
                <img
                  id="product-image"
                  src={currentImage || placeholderFallBack}
                  alt={selectedVariation?.name || product.name}
                  className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Product Details Container */}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-center md:text-left mb-4">{product.name}</h1>

              {/* Variant Name */}
              {selectedVariation && (
                <p className="text-md text-gray-600 text-center md:text-left mb-2">
                  {selectedVariation.name.split('- ').pop()}
                </p>
              )}

              {/* Price Display */}
              <div className="text-center md:text-left mb-6">
                {isOnSale && displayRegularPrice ? (
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-2">
                    <p className="text-xl font-bold text-red-600">{displayPrice}</p>
                    <p className="text-xl text-gray-500 line-through">{displayRegularPrice}</p>
                  </div>
                ) : (
                  <p className="text-xl font-bold">{displayPrice}</p>
                )}
              </div>

              {/* Description */}
              {descriptionText && (
                <p className="text-lg mb-6 text-center md:text-left">{descriptionText}</p>
              )}

              {/* Stock Status */}
              {stockQuantity !== null && stockQuantity !== undefined && stockQuantity > 0 && (
                <div className="mb-6 mx-auto md:mx-0">
                  <div className="p-2 bg-green-100 border border-green-400 rounded-lg max-w-[14.375rem]">
                    <p className="text-lg text-green-700 font-semibold text-center md:text-left">
                      {stockQuantity} in stock
                    </p>
                  </div>
                </div>
              )}

              {/* Variations Select */}
              {product.variations && product.variations.nodes.length > 0 && (
                <div className="mb-6 mx-auto md:mx-0 w-full max-w-[14.375rem]">
                  <label
                    htmlFor="variant"
                    className="block text-lg font-medium mb-2 text-center md:text-left"
                  >
                    Options
                  </label>
                  <select
                    id="variant"
                    name="variant"
                    value={selectedVariationId || ''}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleVariationChange}
                  >
                    {product.variations.nodes.map((variation: IVariationNodes) => {
                      const variantLabel = variation.name.split('- ').pop();
                      const stockInfo =
                        variation.stockQuantity > 0
                          ? `(${variation.stockQuantity} in stock)`
                          : variation.stockStatus === 'IN_STOCK'
                            ? '(In stock)'
                            : '(Out of stock)';
                      return (
                        <option key={variation.id} value={variation.databaseId}>
                          {variantLabel} {stockInfo}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className="w-full mx-auto md:mx-0 max-w-[14.375rem]">
                {product.variations ? (
                  <AddToCart
                    product={product}
                    variationId={selectedVariationId || undefined}
                    fullWidth={true}
                  />
                ) : (
                  <AddToCart product={product} fullWidth={true} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SingleProduct;
