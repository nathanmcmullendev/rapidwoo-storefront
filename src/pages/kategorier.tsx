// Client-side rendered categories page
import { useQuery } from '@apollo/client';
import Layout from '@/components/Layout/Layout.component';
import Categories from '@/components/Category/Categories.component';
import { FETCH_ALL_CATEGORIES_QUERY } from '@/utils/gql/GQL_QUERIES';
import type { NextPage } from 'next';

const Kategorier: NextPage = () => {
  const { data, loading, error } = useQuery(FETCH_ALL_CATEGORIES_QUERY);

  if (loading) {
    return (
      <Layout title="Categories">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Categories">
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <p className="text-red-500 text-lg mb-4">Failed to load categories</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </Layout>
    );
  }

  if (!data?.productCategories?.nodes) {
    return (
      <Layout title="Categories">
        <div className="flex justify-center items-center min-h-[60vh]">
          <p className="text-gray-500">No categories found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Categories">
      <Categories categories={data.productCategories.nodes} />
    </Layout>
  );
};

export default Kategorier;
