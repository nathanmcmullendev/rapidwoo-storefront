import { describe, it, expect } from 'vitest';
import {
  paddedPrice,
  trimmedStringToLength,
  filteredVariantPrice,
  getUpdatedItems,
} from './functions';

describe('paddedPrice', () => {
  it('should add space after currency symbol', () => {
    expect(paddedPrice('$100', '$')).toBe('$ 100');
  });

  it('should handle multiple occurrences', () => {
    expect(paddedPrice('$100 - $200', '$')).toBe('$ 100 - $ 200');
  });

  it('should handle kr currency', () => {
    expect(paddedPrice('kr500', 'kr')).toBe('kr 500');
  });
});

describe('trimmedStringToLength', () => {
  it('should trim string longer than length and add ellipsis', () => {
    expect(trimmedStringToLength('Hello World', 5)).toBe('Hello...');
  });

  it('should return original string if shorter than length', () => {
    expect(trimmedStringToLength('Hi', 10)).toBe('Hi');
  });

  it('should handle exact length', () => {
    expect(trimmedStringToLength('Hello', 5)).toBe('Hello');
  });
});

describe('filteredVariantPrice', () => {
  it('should return left side of price range', () => {
    const result = filteredVariantPrice('$100 - $200', '');
    expect(result.trim()).toBe('$100');
  });

  it('should return right side of price range when side is right', () => {
    const result = filteredVariantPrice('$100 - $200', 'right');
    expect(result.trim()).toBe('$200');
  });
});

describe('getUpdatedItems', () => {
  const mockProducts = [
    { key: 'item1', quantity: 2, product: { node: { name: 'Product 1' } } },
    { key: 'item2', quantity: 1, product: { node: { name: 'Product 2' } } },
  ] as any;

  it('should update quantity for matching cart key', () => {
    const result = getUpdatedItems(mockProducts, 5, 'item1');
    expect(result).toEqual([
      { key: 'item1', quantity: 5 },
      { key: 'item2', quantity: 1 },
    ]);
  });

  it('should keep other items unchanged', () => {
    const result = getUpdatedItems(mockProducts, 10, 'item2');
    expect(result).toEqual([
      { key: 'item1', quantity: 2 },
      { key: 'item2', quantity: 10 },
    ]);
  });

  it('should set quantity to 0 for removal', () => {
    const result = getUpdatedItems(mockProducts, 0, 'item1');
    expect(result[0].quantity).toBe(0);
  });
});
