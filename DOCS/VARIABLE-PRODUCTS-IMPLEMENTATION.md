# Variable Products Implementation Guide

A comprehensive guide documenting the implementation of professional e-commerce variable product functionality including color swatches, size pills, contextual stock checking, and proper Add to Cart handling.

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem We Solved](#the-problem-we-solved)
3. [Discovery Process](#discovery-process)
4. [Implementation Details](#implementation-details)
5. [Key Functions Explained](#key-functions-explained)
6. [Files Modified](#files-modified)
7. [WooCommerce Data Patterns](#woocommerce-data-patterns)
8. [Testing Checklist](#testing-checklist)
9. [Senior Developer Patterns Used](#senior-developer-patterns-used)

---

## Overview

**Goal:** Transform basic dropdown-based product variation selection into a professional e-commerce experience matching industry standards (Amazon, Nike, Apple).

**Features Implemented:**

- Visual color swatches (circular buttons with actual colors)
- Size pills (rectangular buttons for size selection)
- Contextual stock checking (availability updates based on selections)
- Toggle behavior (click again to deselect)
- Clear selection button
- Price range display until selection is complete
- Proper Add to Cart mutation with attribute values

---

## The Problem We Solved

### Initial Issues

1. **Sizes showing as "Out of Stock" incorrectly**
   - Flamingo T-shirt showed all sizes grayed out/crossed out
   - Debug revealed: `yellow / -: stockStatus=IN_STOCK, stockQuantity=null`

2. **Basic dropdown UX**
   - Original code used `<select>` dropdowns
   - Not visually appealing or intuitive

3. **Add to Cart not working for variable products**
   - Button appeared but items weren't added to cart
   - Missing attribute values in mutation

### Root Cause Discovery

The Flamingo T-shirt product in WooCommerce (Astra demo) uses a **shortcut configuration**:

```
Instead of 12 variations (4 colors × 3 sizes):
  - Yellow / S
  - Yellow / M
  - Yellow / L
  - Blue / S
  - ... etc

They created 4 variations with "Any Size":
  - Yellow / (Any Size)
  - Blue / (Any Size)
  - Green / (Any Size)
  - Red / (Any Size)
```

In WooGraphQL, "Any Size" is represented as an **empty string** (`pa_size: ""`).

---

## Discovery Process

### Step 1: Added Debug Logging

```typescript
// In SingleProduct.component.tsx useEffect
console.log('=== PRODUCT VARIATIONS DEBUG ===');
console.log('Product:', product.name);
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
```

### Step 2: Queried WooCommerce Directly

```bash
curl -s -X POST "https://rapidwoo.com/e-commerce/graphql" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0" \
  -d '{"query":"{ product(id: 210, idType: DATABASE_ID) { name variations { nodes { attributes { nodes { name value } } stockStatus stockQuantity } } } }"}'
```

**Output revealed:**

```json
{
  "attributes": {
    "nodes": [
      { "name": "pa_color", "value": "yellow" },
      { "name": "pa_size", "value": "" } // Empty = "Any Size"
    ]
  },
  "stockStatus": "IN_STOCK",
  "stockQuantity": null
}
```

### Step 3: Understood WooCommerce Inventory States

| stockStatus    | stockQuantity | Meaning                           |
| -------------- | ------------- | --------------------------------- |
| `IN_STOCK`     | `null`        | Available, not tracking inventory |
| `IN_STOCK`     | `5`           | Available, 5 in stock             |
| `OUT_OF_STOCK` | `0` or `null` | Not available                     |

---

## Implementation Details

### 1. Color Swatches

**Visual Design:**

- 40x40px circular buttons
- Background color from `COLOR_MAP` lookup
- Ring indicator when selected
- Diagonal line overlay when out of stock
- Light colors get darker border for visibility

**Color Mapping:**

```typescript
const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#DC2626',
  blue: '#2563EB',
  yellow: '#EAB308',
  // ... 50+ colors mapped
  multi: 'linear-gradient(135deg, #FF0000, #00FF00, #0000FF)',
};
```

### 2. Size Pills

**Visual Design:**

- Rectangular buttons with padding
- Uppercase text
- Dark background when selected
- `line-through` text decoration when out of stock
- Reduced opacity (40%) when unavailable

### 3. Contextual Stock Checking

**The Professional Pattern:**
When user selects "Yellow" color, size availability should update to show only sizes available in Yellow. When user selects "Large" size, color availability should update to show only colors available in Large.

**Implementation:**

```typescript
const isAttributeInStock = (
  attrType: 'color' | 'size',
  value: string,
): { inStock: boolean; quantity: number } => {
  // Get the OTHER attribute's current selection
  const otherSelection = attrType === 'color' ? selectedSize : selectedColor;
  const otherAttrType = attrType === 'color' ? 'size' : 'color';

  // Find variations matching THIS value AND the other selection
  const matchingVariants = product.variations.nodes.filter((variant) => {
    const thisAttrValue = getVariantAttr(variant, attrType);
    const otherAttrValue = getVariantAttr(variant, otherAttrType);

    const thisMatches =
      thisAttrValue === '' || thisAttrValue?.toLowerCase() === value.toLowerCase();
    const otherMatches = attrMatches(otherAttrValue, otherSelection);

    return thisMatches && otherMatches;
  });

  const inStockVariant = matchingVariants.find(isVariationInStock);
  return { inStock: !!inStockVariant, quantity: totalQuantity };
};
```

### 4. "Any" Attribute Handling

**The Problem:** Empty string (`""`) means "Any" and should match all selections.

**Solution - Helper Function:**

```typescript
const attrMatches = (variantValue: string | undefined, selectedValue: string | null): boolean => {
  if (!selectedValue) return true; // No selection = match all
  if (variantValue === '' || variantValue === undefined) return true; // "Any" matches all
  return variantValue.toLowerCase() === selectedValue.toLowerCase();
};
```

### 5. Selection State Management

**No Auto-Selection:**

```typescript
// Match WooCommerce behavior - user must select
setSelectedColor(null);
setSelectedSize(null);
```

**Toggle on Re-Click:**

```typescript
const handleColorSelect = (color: string) => {
  if (selectedColor?.toLowerCase() === color.toLowerCase()) {
    setSelectedColor(null); // Deselect if clicking same color
  } else {
    setSelectedColor(color);
  }
};
```

**Selection Completion Check:**

```typescript
const isSelectionComplete = useMemo(() => {
  if (hasColorAttribute && hasSizeAttribute) {
    return !!selectedColor && !!selectedSize;
  } else if (hasColorAttribute) {
    return !!selectedColor;
  } else if (hasSizeAttribute) {
    return !!selectedSize;
  }
  return true;
}, [hasColorAttribute, hasSizeAttribute, selectedColor, selectedSize]);
```

### 6. Add to Cart with Attributes

**The Fix:** WooCommerce needs attribute values for products with "Any" attributes.

**Interface:**

```typescript
export interface ISelectedAttribute {
  attributeName: string;
  attributeValue: string;
}

export interface IProductRootObject {
  product: IProduct;
  variationId?: number;
  selectedAttributes?: ISelectedAttribute[];
  fullWidth?: boolean;
}
```

**Building Attributes:**

```typescript
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
```

**Mutation Input:**

```typescript
const productQueryInput = variationId
  ? {
      clientMutationId: uuidv4(),
      productId,
      variationId,
      ...(selectedAttributes?.length > 0 && {
        variation: selectedAttributes,
      }),
    }
  : {
      clientMutationId: uuidv4(),
      productId,
    };
```

---

## Key Functions Explained

### `findVariationByAttributes(color, size)`

Finds the matching variation for selected attributes. Handles "Any" values (empty string) that match any selection.

### `isAttributeInVariations(attrType)`

Checks if an attribute type has NON-EMPTY values in variations. Used to determine if we should show swatches/pills.

### `isAttributeInStock(attrType, value)`

**Contextual** stock check. When checking if "Large" is in stock, considers the currently selected color.

### `isVariationInStock(variant)`

Simple check: `stockStatus === 'IN_STOCK' || stockQuantity > 0`

### `getVariantAttr(variant, attrType)`

Extracts attribute value from variation, normalizing the attribute name.

### `attrMatches(variantValue, selectedValue)`

Handles "Any" matching logic where empty string matches everything.

---

## Files Modified

| File                                                 | Changes                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `src/components/Product/SingleProduct.component.tsx` | Complete rewrite of variation selection UI              |
| `src/components/Product/AddToCart.component.tsx`     | Added `selectedAttributes` prop, updated mutation input |
| `src/utils/gql/GQL_QUERIES.ts`                       | Added `defaultAttributes` to product query              |

### SingleProduct.component.tsx - Key Sections

| Section                | Lines   | Purpose                                                             |
| ---------------------- | ------- | ------------------------------------------------------------------- |
| COLOR_MAP              | 16-65   | Color name to hex value mapping                                     |
| State declarations     | 86-89   | selectedColor, selectedSize, currentImage                           |
| Stock checking helpers | 188-249 | isVariationInStock, getVariantAttr, attrMatches, isAttributeInStock |
| Selection handlers     | 324-346 | handleColorSelect, handleSizeSelect, handleClearSelection           |
| Color swatches JSX     | 438-484 | Visual color button rendering                                       |
| Size pills JSX         | 487-521 | Visual size button rendering                                        |

---

## WooCommerce Data Patterns

### Standard Variable Product

```
Product: T-Shirt
├── Variation 1: Red / Small ($20)
├── Variation 2: Red / Medium ($20)
├── Variation 3: Red / Large ($22)
├── Variation 4: Blue / Small ($20)
└── ... (color × size combinations)
```

### "Any" Attribute Pattern (Astra Demo)

```
Product: Flamingo T-Shirt
├── Variation 1: Yellow / Any Size ($35)
├── Variation 2: Blue / Any Size ($35)
├── Variation 3: Green / Any Size ($35)
└── Variation 4: Red / Any Size ($35)
```

### GraphQL Representation

```json
{
  "attributes": {
    "nodes": [
      { "name": "pa_color", "value": "yellow" },
      { "name": "pa_size", "value": "" } // Empty = Any
    ]
  }
}
```

---

## Testing Checklist

### Color Swatches

- [ ] Colors display as circular buttons
- [ ] Correct color shown (from COLOR_MAP)
- [ ] Click selects color (ring indicator)
- [ ] Click again deselects
- [ ] Out of stock colors show diagonal line
- [ ] Out of stock colors are disabled

### Size Pills

- [ ] Sizes display as rectangular buttons
- [ ] Click selects size (dark background)
- [ ] Click again deselects
- [ ] Out of stock sizes have line-through
- [ ] Out of stock sizes are disabled

### Contextual Stock

- [ ] Select color → unavailable sizes gray out
- [ ] Select size → unavailable colors gray out
- [ ] Clear selection → all options re-enable

### Price Display

- [ ] Shows price range before selection complete
- [ ] Shows specific price after full selection
- [ ] Sale prices show with strikethrough regular price

### Add to Cart

- [ ] "SELECT OPTIONS" button shown before complete
- [ ] "ADD TO CART" button shown after complete
- [ ] Clicking adds item to cart
- [ ] Cart icon updates with count

### "Any" Attribute Products

- [ ] Flamingo T-shirt: all sizes available for each color
- [ ] Can select any color + any size combination
- [ ] Add to cart works correctly

---

## Senior Developer Patterns Used

### 1. Memoization for Performance

```typescript
const selectedVariation = useMemo(() => {
  return findVariationByAttributes(selectedColor, selectedSize);
}, [selectedColor, selectedSize, product.variations]);
```

### 2. Defensive Programming

```typescript
const getVariantAttr = (variant: IVariationNodes, attrType: string): string | undefined => {
  return variant.attributes?.nodes.find((a) => a.name.toLowerCase().replace('pa_', '') === attrType)
    ?.value;
};
```

### 3. Type Safety

```typescript
export interface ISelectedAttribute {
  attributeName: string;
  attributeValue: string;
}
```

### 4. Single Responsibility

- `isVariationInStock` - Only checks stock
- `getVariantAttr` - Only extracts attribute
- `attrMatches` - Only handles matching logic

### 5. Debug Logging (Development)

```typescript
console.log('=== PRODUCT VARIATIONS DEBUG ===');
// Structured, labeled output for easy debugging
```

### 6. Graceful Degradation

- Products without color/size still work (legacy dropdown)
- Products with partial attributes handled
- Missing data doesn't crash the component

### 7. UX Patterns from Industry Leaders

- Amazon: Contextual availability
- Nike: Color swatches with stock indicators
- Apple: Clean selection with clear feedback
- WooCommerce: Toggle behavior, CLEAR button

---

## Common Issues & Solutions

### Issue: All sizes show as out of stock

**Cause:** `isAttributeInVariations` wasn't checking for non-empty values
**Fix:** Added `a.value !== ''` check

### Issue: Add to Cart doesn't work

**Cause:** Missing `variation` parameter with attribute values
**Fix:** Pass `selectedAttributes` to mutation input

### Issue: Wrong variation found

**Cause:** Empty string not treated as "Any"
**Fix:** `attrMatches` helper that treats `""` as matching everything

### Issue: Stock not updating contextually

**Cause:** Checking attribute availability in isolation
**Fix:** `isAttributeInStock` considers the OTHER attribute's selection

---

## Future Improvements

1. **Remove debug logging for production** - Wrap in `NODE_ENV` check
2. **Add image swatches** - Show product image in color button
3. **Quantity selector** - Allow adding multiple items
4. **Size guide modal** - Help users choose size
5. **Wishlist integration** - Save for later functionality
6. **Recently viewed** - Track viewed products

---

_Document created: January 8, 2026_
_Author: Claude Code (Opus 4.5)_
_Repository: rapidwoo-storefront_
