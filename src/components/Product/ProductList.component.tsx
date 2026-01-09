import { useState } from 'react';
import { Product } from '@/types/product';
import { useProductFilters } from '@/hooks/useProductFilters';
import ProductCard from './ProductCard.component';
import ProductFilters from './ProductFilters.component';

interface ProductListProps {
  products: Product[];
  title: string;
}

const ProductList = ({ products, title }: ProductListProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const {
    sortBy,
    setSortBy,
    selectedSizes,
    setSelectedSizes,
    selectedColors,
    setSelectedColors,
    priceRange,
    setPriceRange,
    productTypes,
    toggleProductType,
    resetFilters,
    filterProducts,
  } = useProductFilters(products);

  const filteredProducts = filterProducts(products);

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8">
      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="md:hidden flex items-center justify-center gap-2 py-2 px-4 border rounded-lg text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {/* Filters - hidden on mobile by default */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
        <ProductFilters
          selectedSizes={selectedSizes}
          setSelectedSizes={setSelectedSizes}
          selectedColors={selectedColors}
          setSelectedColors={setSelectedColors}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          productTypes={productTypes}
          toggleProductType={toggleProductType}
          products={products}
          resetFilters={resetFilters}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="flex flex-row justify-between items-center gap-2 mb-4">
          {title && (
            <h1 className="text-lg sm:text-xl font-medium">
              {title} <span className="text-gray-500">({filteredProducts.length})</span>
            </h1>
          )}

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm font-medium hidden sm:inline">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="popular">Popular</option>
              <option value="price-low">Price: Low</option>
              <option value="price-high">Price: High</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* 2 columns on mobile to show more products above fold */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {filteredProducts.map((product: Product, index: number) => (
            <ProductCard
              key={product.databaseId}
              databaseId={product.databaseId}
              name={product.name}
              price={product.price}
              regularPrice={product.regularPrice}
              salePrice={product.salePrice}
              onSale={product.onSale}
              slug={product.slug}
              image={product.image}
              preloaded={index < 4}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
