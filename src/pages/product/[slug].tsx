// Client-side rendered single product page
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import SingleProduct from '@/components/Product/SingleProduct.component';
import Layout from '@/components/Layout/Layout.component';
import { GET_SINGLE_PRODUCT } from '@/utils/gql/GQL_QUERIES';
import type { NextPage } from 'next';

const ProductPage: NextPage = () => {
  const router = useRouter();
  const { slug } = router.query;

  const { data, loading, error } = useQuery(GET_SINGLE_PRODUCT, {
    variables: { slug },
    skip: !slug,
  });

  if (loading || !slug) {
    return (
      <Layout title="Product">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Product">
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <p className="text-red-500 text-lg mb-4">Failed to load product</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </Layout>
    );
  }

  if (!data?.product) {
    return (
      <Layout title="Product Not Found">
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <p className="text-gray-500 text-lg">Product not found</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Browse all products
          </button>
        </div>
      </Layout>
    );
  }

  const product = data.product;

  return (
    <Layout title={product.name || 'Product'}>
      <SingleProduct product={product} />
    </Layout>
  );
};

export default ProductPage;
