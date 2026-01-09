// Imports
import { useState, useEffect, useMemo } from 'react';

// Utils
import { paddedPrice } from '@/utils/functions/functions';

// Components
import AddToCart, {
  IProductRootObject,
  IVariationNodes,
  IDefaultAttribute,
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
  // Only matches attributes that actually exist on variations
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

        // Only match attributes that are actually used in variations
        let colorMatch = true;
        let sizeMatch = true;

        if (colorUsed && color) {
          colorMatch = variantColor?.toLowerCase() === color.toLowerCase();
        }
        if (sizeUsed && size) {
          sizeMatch = variantSize?.toLowerCase() === size.toLowerCase();
        }

        // If both are used, both must match. If only one is used, only that one must match.
        if (colorUsed && sizeUsed) {
          return colorMatch && sizeMatch;
        } else if (colorUsed) {
          return colorMatch;
        } else if (sizeUsed) {
          return sizeMatch;
        }
        return false;
      }) || null
    );
  };

  // Check if an attribute type is used in variations (vs just product-level)
  const isAttributeInVariations = (attrType: 'color' | 'size'): boolean => {
    if (!product.variations?.nodes) return false;
    return product.variations.nodes.some((variant) =>
      variant.attributes?.nodes.some((a) => a.name.toLowerCase().replace('pa_', '') === attrType),
    );
  };

  const colorInVariations = isAttributeInVariations('color');
  const sizeInVariations = isAttributeInVariations('size');

  // Check if a specific color/size combination is in stock
  const isAttributeInStock = (
    attrType: 'color' | 'size',
    value: string,
  ): { inStock: boolean; quantity: number } => {
    if (!product.variations?.nodes) return { inStock: true, quantity: 0 };

    // If this attribute type isn't used in variations, it's just informational
    // (product-level attribute) - always show as available
    const attrUsedInVariations = attrType === 'color' ? colorInVariations : sizeInVariations;
    if (!attrUsedInVariations) {
      return { inStock: true, quantity: 0 };
    }

    // Find all variants with this attribute value
    const matchingVariants = product.variations.nodes.filter((variant) => {
      const attr = variant.attributes?.nodes.find(
        (a) => a.name.toLowerCase().replace('pa_', '') === attrType,
      );
      return attr?.value.toLowerCase() === value.toLowerCase();
    });

    // Check if any are in stock
    const inStockVariant = matchingVariants.find(
      (v) => v.stockStatus === 'IN_STOCK' || v.stockQuantity > 0,
    );

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
      console.log('Available Colors:', availableColors, '| In variations:', colorInVariations);
      console.log('Available Sizes:', availableSizes, '| In variations:', sizeInVariations);
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
      console.log('================================');
    }

    if (!product.variations?.nodes?.length) {
      setCurrentImage(product.image?.sourceUrl || placeholderFallBack);
      return;
    }

    // Try to get defaults from WooCommerce defaultAttributes
    const defaultAttrs = product.defaultAttributes?.nodes;
    let defaultColor: string | null = null;
    let defaultSize: string | null = null;

    if (defaultAttrs?.length) {
      defaultAttrs.forEach((attr: IDefaultAttribute) => {
        const attrName = attr.name.toLowerCase().replace('pa_', '');
        if (attrName === 'color' && availableColors.includes(attr.value)) {
          defaultColor = attr.value;
        } else if (attrName === 'size' && availableSizes.includes(attr.value)) {
          defaultSize = attr.value;
        }
      });
    }

    // Fallback: find variant matching product's main image
    if (!defaultColor && hasColorAttribute) {
      const productImageUrl = product.image?.sourceUrl;
      if (productImageUrl) {
        const imageMatchVariant = product.variations.nodes.find(
          (v) => v.image?.sourceUrl === productImageUrl,
        );
        if (imageMatchVariant?.attributes?.nodes) {
          const colorAttr = imageMatchVariant.attributes.nodes.find(
            (a) => a.name.toLowerCase().replace('pa_', '') === 'color',
          );
          if (colorAttr) defaultColor = colorAttr.value;
        }
      }
    }

    // Ultimate fallback: first available option
    if (!defaultColor && hasColorAttribute) {
      defaultColor = availableColors[0];
    }
    if (!defaultSize && hasSizeAttribute) {
      defaultSize = availableSizes[0];
    }

    setSelectedColor(defaultColor);
    setSelectedSize(defaultSize);

    // Set initial image
    const initialVariant = findVariationByAttributes(defaultColor, defaultSize);
    if (initialVariant?.image?.sourceUrl) {
      setCurrentImage(initialVariant.image.sourceUrl);
    } else {
      setCurrentImage(product.image?.sourceUrl || placeholderFallBack);
    }
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

  // Handle color swatch click
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  // Handle size pill click
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  // Legacy dropdown handler (for products without color/size attributes)
  const handleVariationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVariationId = Number(e.target.value);
    const variant = product.variations?.nodes.find((v) => v.databaseId === newVariationId);
    if (variant?.image?.sourceUrl) {
      setCurrentImage(variant.image.sourceUrl);
    }
  };

  // Get display values
  const displayPrice = useMemo(() => {
    if (selectedVariation) {
      const price = selectedVariation.onSale
        ? selectedVariation.salePrice
        : selectedVariation.regularPrice;
      return price ? paddedPrice(price, '$') : '';
    }
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
                  src={currentImage || placeholderFallBack}
                  alt={selectedVariation?.name || product.name}
                  className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
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

              {/* Selected Variant Info */}
              {selectedVariation && (selectedColor || selectedSize) && (
                <p className="text-sm text-gray-500 mb-2">
                  {selectedColor && <span className="capitalize">{selectedColor}</span>}
                  {selectedColor && selectedSize && ' / '}
                  {selectedSize && <span className="uppercase">{selectedSize}</span>}
                </p>
              )}

              {/* Price Display - positioned near add to cart */}
              <div className="mb-4">
                {isOnSale && displayRegularPrice ? (
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold text-red-600">{displayPrice}</p>
                    <p className="text-lg text-gray-400 line-through">{displayRegularPrice}</p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold">{displayPrice}</p>
                )}
              </div>

              {/* Stock Status */}
              {selectedVariation && (
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

              {/* Add to Cart Button */}
              <div className="w-full max-w-xs">
                {product.variations ? (
                  <AddToCart
                    product={product}
                    variationId={selectedVariation?.databaseId}
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
