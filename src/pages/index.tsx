// Components
import { useQuery } from '@apollo/client';
import Hero from '@/components/Index/Hero.component';
import DisplayProducts from '@/components/Product/DisplayProducts.component';
import Layout from '@/components/Layout/Layout.component';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner.component';

// Types
import type { NextPage } from 'next';

// GraphQL
import { FETCH_ALL_PRODUCTS_QUERY } from '@/utils/gql/GQL_QUERIES';

/**
 * Main index page - Client-side rendered
 * @function Index
 * @returns {JSX.Element} - Rendered component
 */
const Index: NextPage = () => {
  const { data, loading, error } = useQuery(FETCH_ALL_PRODUCTS_QUERY);

  return (
    <Layout title="Home">
      <Hero />
      {loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      )}
      {error && (
        <div className="container mx-auto px-4 py-8 text-center text-red-500">
          Failed to load products. Please try again later.
        </div>
      )}
      {data?.products?.nodes && <DisplayProducts products={data.products.nodes} />}
    </Layout>
  );
};

export default Index;
