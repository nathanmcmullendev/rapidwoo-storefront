import Link from 'next/link';
import dynamic from 'next/dynamic';
import Cart from './Cart.component';

// Lazy load Algolia search components to save ~350KB from initial bundle
// Search functionality loads after first paint, imperceptible to users
const AlgoliaSearchBox = dynamic(() => import('../AlgoliaSearch/AlgoliaSearchBox.component'), {
  ssr: false,
  loading: () => (
    <div className="hidden md:flex items-center">
      <input
        type="text"
        placeholder="Search products..."
        className="px-4 py-2 text-base bg-white border border-gray-400 outline-none rounded w-64"
        readOnly
      />
    </div>
  ),
});

const MobileSearch = dynamic(() => import('../AlgoliaSearch/MobileSearch.component'), {
  ssr: false,
  loading: () => (
    <input
      type="text"
      placeholder="Search products..."
      className="w-full px-4 py-2 text-base bg-white border border-gray-400 outline-none rounded"
      readOnly
    />
  ),
});

/**
 * Navigation for the application.
 * Includes mobile menu.
 */
const Navbar = () => {
  return (
    <header className="border-b border-gray-200">
      <nav id="header" className="top-0 z-50 w-full bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col space-y-4 md:hidden">
            <div className="text-center">
              <Link href="/">
                <span className="text-lg font-bold tracking-widest text-gray-900">
                  RAPIDWOO STORE
                </span>
              </Link>
            </div>
            <div className="w-full">
              <MobileSearch />
            </div>
          </div>
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/products">
                <span className="text-base uppercase tracking-wider group relative">
                  <span className="relative inline-block">
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-500"></span>
                    Products
                  </span>
                </span>
              </Link>
              <Link href="/kategorier">
                <span className="text-base uppercase tracking-wider group relative">
                  <span className="relative inline-block">
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-500"></span>
                    Categories
                  </span>
                </span>
              </Link>
            </div>
            <Link href="/" className="hidden lg:block">
              <span className="text-xl font-bold tracking-widest text-gray-900 hover:text-gray-700 transition-colors">
                RAPIDWOO STORE
              </span>
            </Link>
            <div className="flex items-center space-x-3">
              <AlgoliaSearchBox />
              <Cart />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
