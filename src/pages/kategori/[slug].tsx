// Client-side rendered category page
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import Layout from '@/components/Layout/Layout.component';
import DisplayProducts from '@/components/Product/DisplayProducts.component';
import { GET_PRODUCTS_FROM_CATEGORY } from '@/utils/gql/GQL_QUERIES';
import type { NextPage } from 'next';

const CategoryPage: NextPage = () => {
  const router = useRouter();
  const { slug, id } = router.query;

  // Use id if provided (for legacy URLs), otherwise use slug
  const categoryId = id || slug;

  const { data, loading, error } = useQuery(GET_PRODUCTS_FROM_CATEGORY, {
    variables: { id: categoryId },
    skip: !categoryId,
  });

  if (loading || !categoryId) {
    return (
      <Layout title="Category">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Category">
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <p className="text-red-500 text-lg mb-4">Failed to load category</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </Layout>
    );
  }

  const categoryName = data?.productCategory?.name || 'Category';
  const products = data?.productCategory?.products?.nodes || [];

  return (
    <Layout title={categoryName}>
      {products.length > 0 ? (
        <DisplayProducts products={products} />
      ) : (
        <div className="flex justify-center items-center min-h-[60vh]">
          <p className="text-gray-500">No products found in this category</p>
        </div>
      )}
    </Layout>
  );
};

export default CategoryPage;
