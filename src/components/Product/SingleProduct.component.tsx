// Imports
import { useState, useEffect, useMemo } from 'react';

// Utils
import { paddedPrice } from '@/utils/functions/functions';
import { getOptimizedImageUrl, getImageSrcSet } from '@/utils/images';

// Components
import AddToCart, {
  IProductRootObject,
  IVariationNodes,
  IDefaultAttribute,
  ISelectedAttribute,
} from './AddToCart.component';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner.component';

// Color name to hex mapping for swatches
const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#DC2626',
  blue: '#2563EB',
  green: '#16A34A',
  yellow: '#EAB308',
  orange: '#EA580C',
  purple: '#9333EA',
  pink: '#EC4899',
  brown: '#92400E',
  gray: '#6B7280',
  grey: '#6B7280',
  navy: '#1E3A5A',
  beige: '#D4C4A8',
  aqua: '#06B6D4',
  teal: '#14B8A6',
  gold: '#D4AF37',
  silver: '#C0C0C0',
  cream: '#FFFDD0',
  tan: '#D2B48C',
  maroon: '#800000',
  olive: '#808000',
  coral: '#FF7F50',
  salmon: '#FA8072',
  khaki: '#C3B091',
  indigo: '#4B0082',
  violet: '#8B5CF6',
  turquoise: '#40E0D0',
  magenta: '#FF00FF',
  burgundy: '#800020',
  charcoal: '#36454F',
  ivory: '#FFFFF0',
  mint: '#98FB98',
  lavender: '#E6E6FA',
  peach: '#FFCBA4',
  rust: '#B7410E',
  rose: '#FF007F',
  wine: '#722F37',
  chocolate: '#7B3F00',
  coffee: '#6F4E37',
  camel: '#C19A6B',
  sand: '#C2B280',
  stone: '#928E85',
  slate: '#708090',
  denim: '#1560BD',
  natural: '#F5F5DC',
  multi: 'linear-gradient(135deg, #FF0000, #00FF00, #0000FF)',
  multicolor: 'linear-gradient(135deg, #FF0000, #00FF00, #0000FF)',
};

// Get color hex from name
const getColorHex = (colorName: string): string => {
  const normalizedName = colorName.toLowerCase().trim();
  return COLOR_MAP[normalizedName] || '#CCCCCC';
};

// Check if a color is light (for text contrast)
const isLightColor = (hex: string): boolean => {
  if (hex.includes('gradient')) return false;
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 180;
};

const SingleProduct = ({ product }: IProductRootObject) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | undefined>();

  const placeholderFallBack = 'https://via.placeholder.com/600';

  // Extract unique colors from product
  const availableColors: string[] = useMemo(() => {
    if (!product.allPaColor?.nodes) return [];
    return product.allPaColor.nodes.map((node: { name: string }) => node.name);
  }, [product.allPaColor]);

  // Extract unique sizes from product
  const availableSizes: string[] = useMemo(() => {
    if (!product.allPaSize?.nodes) return [];
    return product.allPaSize.nodes.map((node: { name: string }) => node.name);
  }, [product.allPaSize]);

  // Check if product has multiple attribute types (needs swatches/pills)
  const hasColorAttribute = availableColors.length > 0;
  const hasSizeAttribute = availableSizes.length > 0;
  const hasMultipleAttributes = hasColorAttribute || hasSizeAttribute;

  // Check if attributes are used in variations (must be defined before findVariationByAttributes)
  const checkColorInVariations = (): boolean => {
    if (!product.variations?.nodes) return false;
    return product.variations.nodes.some((variant) =>
      variant.attributes?.nodes.some((a) => a.name.toLowerCase().replace('pa_', '') === 'color'),
    );
  };

  const checkSizeInVariations = (): boolean => {
    if (!product.variations?.nodes) return false;
    return product.variations.nodes.some((variant) =>
      variant.attributes?.nodes.some((a) => a.name.toLowerCase().replace('pa_', '') === 'size'),
    );
  };

  // Find variation matching selected attributes
  // Handles "Any" values (empty string) which match any selection
  const findVariationByAttributes = (
    color: string | null,
    size: string | null,
  ): IVariationNodes | null => {
    if (!product.variations?.nodes) return null;

    const colorUsed = checkColorInVariations();
    const sizeUsed = checkSizeInVariations();

    return (
      product.variations.nodes.find((variant) => {
        if (!variant.attributes?.nodes) return false;

        const variantColor = variant.attributes.nodes.find(
          (attr) => attr.name.toLowerCase().replace('pa_', '') === 'color',
        )?.value;
        const variantSize = variant.attributes.nodes.find(
          (attr) => attr.name.toLowerCase().replace('pa_', '') === 'size',
        )?.value;

        // Check color match - empty string means "Any Color"
        let colorMatch = true;
        if (color) {
          // Empty variantColor means "Any Color" - matches everything
          colorMatch = variantColor === '' || variantColor?.toLowerCase() === color.toLowerCase();
        }

        // Check size match - empty string means "Any Size"
        let sizeMatch = true;
        if (size) {
          // Empty variantSize means "Any Size" - matches everything
          sizeMatch = variantSize === '' || variantSize?.toLowerCase() === size.toLowerCase();
        }

        // Match based on what's selected
        if (color && size) {
          return colorMatch && sizeMatch;
        } else if (color) {
          return colorMatch;
        } else if (size) {
          return sizeMatch;
        }
        return false;
      }) || null
    );
  };

  // Check if an attribute type has NON-EMPTY values in variations
  // Empty string means "Any" (e.g., "Any Size" applies to all sizes)
  const isAttributeInVariations = (attrType: 'color' | 'size'): boolean => {
    if (!product.variations?.nodes) return false;
    return product.variations.nodes.some((variant) =>
      variant.attributes?.nodes.some(
        (a) => a.name.toLowerCase().replace('pa_', '') === attrType && a.value !== '',
      ),
    );
  };

  const colorInVariations = isAttributeInVariations('color');
  const sizeInVariations = isAttributeInVariations('size');

  // Helper: check if a variation is in stock
  const isVariationInStock = (variant: IVariationNodes): boolean => {
    return variant.stockStatus === 'IN_STOCK' || (variant.stockQuantity ?? 0) > 0;
  };

  // Helper: get attribute value from variation (handles empty = "Any")
  const getVariantAttr = (variant: IVariationNodes, attrType: string): string | undefined => {
    return variant.attributes?.nodes.find(
      (a) => a.name.toLowerCase().replace('pa_', '') === attrType,
    )?.value;
  };

  // Helper: check if attribute value matches (empty string = "Any" matches everything)
  const attrMatches = (variantValue: string | undefined, selectedValue: string | null): boolean => {
    if (!selectedValue) return true; // No selection = match all
    if (variantValue === '' || variantValue === undefined) return true; // "Any" matches all
    return variantValue.toLowerCase() === selectedValue.toLowerCase();
  };

  // CONTEXTUAL stock check - considers current selection of OTHER attribute
  // When checking color: considers selected size
  // When checking size: considers selected color
  const isAttributeInStock = (
    attrType: 'color' | 'size',
    value: string,
  ): { inStock: boolean; quantity: number } => {
    if (!product.variations?.nodes) return { inStock: true, quantity: 0 };

    // If this attribute type isn't used in variations (all empty/"Any"), always available
    const attrUsedInVariations = attrType === 'color' ? colorInVariations : sizeInVariations;
    if (!attrUsedInVariations) {
      return { inStock: true, quantity: 0 };
    }

    // Get the OTHER attribute's current selection for contextual check
    const otherSelection = attrType === 'color' ? selectedSize : selectedColor;
    const otherAttrType = attrType === 'color' ? 'size' : 'color';

    // Find variations that match this attribute value AND the other selection (if any)
    const matchingVariants = product.variations.nodes.filter((variant) => {
      const thisAttrValue = getVariantAttr(variant, attrType);
      const otherAttrValue = getVariantAttr(variant, otherAttrType);

      // Must match this attribute (or be "Any")
      const thisMatches =
        thisAttrValue === '' || thisAttrValue?.toLowerCase() === value.toLowerCase();

      // Must match other attribute selection (or be "Any", or no selection)
      const otherMatches = attrMatches(otherAttrValue, otherSelection);

      return thisMatches && otherMatches;
    });

    // Check if any matching variants are in stock
    const inStockVariant = matchingVariants.find(isVariationInStock);
    const totalQuantity = matchingVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);

    return {
      inStock: !!inStockVariant,
      quantity: totalQuantity,
    };
  };

  // Get the currently selected variation
  const selectedVariation = useMemo(() => {
    if (!hasMultipleAttributes) {
      // Fallback for products without color/size - use first variation
      return product.variations?.nodes?.[0] || null;
    }
    return findVariationByAttributes(selectedColor, selectedSize);
  }, [selectedColor, selectedSize, product.variations, hasMultipleAttributes]);

  // Initialize default selections on mount
  useEffect(() => {
    setIsLoading(false);

    // DEBUG: Log variation stock data to console
    if (product.variations?.nodes?.length) {
      console.log('=== PRODUCT VARIATIONS DEBUG ===');
      console.log('Product:', product.name);
      console.log('Colors:', availableColors, '| colorInVariations:', colorInVariations);
      console.log('Sizes:', availableSizes, '| sizeInVariations:', sizeInVariations);
      console.log('Variations:');
      product.variations.nodes.forEach((v) => {
        const colorAttr = v.attributes?.nodes.find(
          (a) => a.name.toLowerCase().replace('pa_', '') === 'color',
        )?.value;
        const sizeAttr = v.attributes?.nodes.find(
          (a) => a.name.toLowerCase().replace('pa_', '') === 'size',
        )?.value;
        console.log(
          `  ${colorAttr || '-'} / ${sizeAttr || '-'}: stockStatus=${v.stockStatus}, stockQuantity=${v.stockQuantity}`,
        );
      });
      // Show stock check results for each size
      console.log('Size stock checks:');
      availableSizes.forEach((size) => {
        const result = isAttributeInStock('size', size);
        console.log(`  ${size}: inStock=${result.inStock}`);
      });
      console.log('================================');
    }

    if (!product.variations?.nodes?.length) {
      setCurrentImage(product.image?.sourceUrl || placeholderFallBack);
      return;
    }

    // Don't auto-select defaults - match WooCommerce behavior
    // User must select both color AND size before Add to Cart is enabled
    setSelectedColor(null);
    setSelectedSize(null);

    // Set initial image to product's main image
    setCurrentImage(product.image?.sourceUrl || placeholderFallBack);
  }, [product, availableColors, availableSizes, hasColorAttribute, hasSizeAttribute]);

  // Update image when selection changes
  useEffect(() => {
    if (selectedVariation?.image?.sourceUrl) {
      setCurrentImage(selectedVariation.image.sourceUrl);
    } else if (selectedColor || selectedSize) {
      // Try to find any variant with the selected color for the image
      const colorVariant = product.variations?.nodes.find((v) => {
        const colorAttr = v.attributes?.nodes.find(
          (a) => a.name.toLowerCase().replace('pa_', '') === 'color',
        );
        return colorAttr?.value.toLowerCase() === selectedColor?.toLowerCase();
      });
      if (colorVariant?.image?.sourceUrl) {
        setCurrentImage(colorVariant.image.sourceUrl);
      }
    }
  }, [selectedVariation, selectedColor, selectedSize, product.variations]);

  // Handle color swatch click (toggle on re-click)
  const handleColorSelect = (color: string) => {
    if (selectedColor?.toLowerCase() === color.toLowerCase()) {
      setSelectedColor(null); // Deselect if clicking same color
    } else {
      setSelectedColor(color);
    }
  };

  // Handle size pill click (toggle on re-click)
  const handleSizeSelect = (size: string) => {
    if (selectedSize?.toLowerCase() === size.toLowerCase()) {
      setSelectedSize(null); // Deselect if clicking same size
    } else {
      setSelectedSize(size);
    }
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedColor(null);
    setSelectedSize(null);
    setCurrentImage(product.image?.sourceUrl || placeholderFallBack);
  };

  // Check if selection is complete (both color AND size when both exist)
  const isSelectionComplete = useMemo(() => {
    if (hasColorAttribute && hasSizeAttribute) {
      return !!selectedColor && !!selectedSize;
    } else if (hasColorAttribute) {
      return !!selectedColor;
    } else if (hasSizeAttribute) {
      return !!selectedSize;
    }
    return true; // No attributes to select
  }, [hasColorAttribute, hasSizeAttribute, selectedColor, selectedSize]);

  // Check if any selection has been made
  const hasAnySelection = !!selectedColor || !!selectedSize;

  // Build selected attributes array for AddToCart
  const selectedAttributes = useMemo((): ISelectedAttribute[] => {
    const attrs: ISelectedAttribute[] = [];
    if (selectedColor) {
      attrs.push({ attributeName: 'pa_color', attributeValue: selectedColor.toLowerCase() });
    }
    if (selectedSize) {
      attrs.push({ attributeName: 'pa_size', attributeValue: selectedSize.toLowerCase() });
    }
    return attrs;
  }, [selectedColor, selectedSize]);

  // Legacy dropdown handler (for products without color/size attributes)
  const handleVariationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVariationId = Number(e.target.value);
    const variant = product.variations?.nodes.find((v) => v.databaseId === newVariationId);
    if (variant?.image?.sourceUrl) {
      setCurrentImage(variant.image.sourceUrl);
    }
  };

  // Get display values - show range until fully selected
  const displayPrice = useMemo(() => {
    // Only show specific price when selection is complete
    if (isSelectionComplete && selectedVariation) {
      const price = selectedVariation.onSale
        ? selectedVariation.salePrice
        : selectedVariation.regularPrice;
      return price ? paddedPrice(price, '$') : '';
    }
    // Show price range when not fully selected
    return product.price ? paddedPrice(product.price, '$') : '';
  }, [isSelectionComplete, selectedVariation, product.price]);

  const displayRegularPrice = useMemo(() => {
    if (isSelectionComplete && selectedVariation) {
      return selectedVariation.regularPrice ? paddedPrice(selectedVariation.regularPrice, '$') : '';
    }
    return product.regularPrice ? paddedPrice(product.regularPrice, '$') : '';
  }, [isSelectionComplete, selectedVariation, product.regularPrice]);

  const isOnSale =
    isSelectionComplete && selectedVariation ? selectedVariation.onSale : product.onSale;
  const stockQuantity = selectedVariation ? selectedVariation.stockQuantity : product.stockQuantity;
  const isInStock =
    selectedVariation?.stockStatus === 'IN_STOCK' || (stockQuantity && stockQuantity > 0);

  // Strip HTML from description
  let descriptionText = '';
  if (typeof window !== 'undefined' && product.description) {
    descriptionText =
      new DOMParser().parseFromString(product.description, 'text/html').body.textContent || '';
  }

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
                  src={getOptimizedImageUrl(currentImage || placeholderFallBack, 'full')}
                  srcSet={getImageSrcSet(currentImage) || undefined}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  alt={selectedVariation?.name || product.name}
                  className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                />
              </div>
            </div>

            {/* Product Details Container */}
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-center md:text-left mb-4">{product.name}</h1>

              {/* Description - moved to top for context */}
              {descriptionText && (
                <p className="text-gray-600 mb-6 text-center md:text-left">{descriptionText}</p>
              )}

              {/* Color Swatches */}
              {hasColorAttribute && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color:{' '}
                    <span className="font-normal capitalize">{selectedColor || 'Select'}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const colorHex = getColorHex(color);
                      const isSelected = selectedColor?.toLowerCase() === color.toLowerCase();
                      const { inStock } = isAttributeInStock('color', color);
                      const isLight = isLightColor(colorHex);

                      return (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          disabled={!inStock}
                          title={`${color}${!inStock ? ' (Out of stock)' : ''}`}
                          className={`
                            w-10 h-10 rounded-full border-2 transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                            ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 border-blue-500' : 'border-gray-300 hover:border-gray-400'}
                            ${!inStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                            ${isLight ? 'border-gray-400' : ''}
                          `}
                          style={{
                            background: colorHex.includes('gradient') ? colorHex : colorHex,
                          }}
                        >
                          {!inStock && (
                            <span className="block w-full h-full relative">
                              <span
                                className="absolute inset-0 flex items-center justify-center"
                                style={{
                                  background:
                                    'linear-gradient(135deg, transparent 45%, #666 45%, #666 55%, transparent 55%)',
                                }}
                              />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Pills */}
              {hasSizeAttribute && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Size: <span className="font-normal uppercase">{selectedSize || 'Select'}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const isSelected = selectedSize?.toLowerCase() === size.toLowerCase();
                      const { inStock } = isAttributeInStock('size', size);

                      return (
                        <button
                          key={size}
                          onClick={() => handleSizeSelect(size)}
                          disabled={!inStock}
                          title={!inStock ? 'Out of stock' : undefined}
                          className={`
                            px-4 py-2 min-w-[3rem] text-sm font-medium uppercase
                            border rounded-md transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                            ${
                              isSelected
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }
                            ${!inStock ? 'opacity-40 cursor-not-allowed line-through' : 'cursor-pointer'}
                          `}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clear Button - shows when any selection is made */}
              {hasAnySelection && (
                <div className="mb-4">
                  <button
                    onClick={handleClearSelection}
                    className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                  >
                    Clear selection
                  </button>
                </div>
              )}

              {/* Legacy dropdown for products without color/size */}
              {!hasMultipleAttributes &&
                product.variations &&
                product.variations.nodes.length > 0 && (
                  <div className="mb-6">
                    <label
                      htmlFor="variant"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Options
                    </label>
                    <select
                      id="variant"
                      name="variant"
                      value={selectedVariation?.databaseId || ''}
                      className="w-full max-w-xs px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={handleVariationChange}
                    >
                      {product.variations.nodes.map((variation: IVariationNodes) => {
                        const variantLabel = variation.name.split('- ').pop();
                        const stockInfo =
                          variation.stockQuantity && variation.stockQuantity > 0
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

              {/* Selected Variant Info - only show when fully selected */}
              {isSelectionComplete && selectedVariation && (selectedColor || selectedSize) && (
                <p className="text-sm text-gray-500 mb-2">
                  {selectedColor && <span className="capitalize">{selectedColor}</span>}
                  {selectedColor && selectedSize && ' / '}
                  {selectedSize && <span className="uppercase">{selectedSize}</span>}
                </p>
              )}

              {/* Price Display */}
              <div className="mb-4">
                {isOnSale && displayRegularPrice && isSelectionComplete ? (
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold text-red-600">{displayPrice}</p>
                    <p className="text-lg text-gray-400 line-through">{displayRegularPrice}</p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold">{displayPrice}</p>
                )}
              </div>

              {/* Stock Status - only show when fully selected */}
              {isSelectionComplete && selectedVariation && (
                <div className="mb-4">
                  {isInStock ? (
                    <p className="text-sm text-green-600 font-medium">
                      {stockQuantity ? `${stockQuantity} in stock` : 'In stock'}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 font-medium">Out of stock</p>
                  )}
                </div>
              )}

              {/* Selection prompt when not complete */}
              {!isSelectionComplete && hasMultipleAttributes && (
                <p className="text-sm text-amber-600 mb-4">
                  Please select {!selectedColor && hasColorAttribute ? 'color' : ''}
                  {!selectedColor && hasColorAttribute && !selectedSize && hasSizeAttribute
                    ? ' and '
                    : ''}
                  {!selectedSize && hasSizeAttribute ? 'size' : ''}
                </p>
              )}

              {/* Add to Cart Button */}
              <div className="w-full max-w-xs">
                {product.variations ? (
                  isSelectionComplete ? (
                    <AddToCart
                      product={product}
                      variationId={selectedVariation?.databaseId}
                      selectedAttributes={selectedAttributes}
                      fullWidth={true}
                    />
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 px-6 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
                    >
                      SELECT OPTIONS
                    </button>
                  )
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
