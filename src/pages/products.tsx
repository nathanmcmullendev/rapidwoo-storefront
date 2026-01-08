// Client-side rendered products page (bypasses build-time GraphQL issues)
import Head from 'next/head';
import { useQuery } from '@apollo/client';
import Layout from '@/components/Layout/Layout.component';
import ProductList from '@/components/Product/ProductList.component';
import { FETCH_ALL_PRODUCTS_QUERY } from '@/utils/gql/GQL_QUERIES';
import type { NextPage } from 'next';

const Products: NextPage = () => {
  const { data, loading, error } = useQuery(FETCH_ALL_PRODUCTS_QUERY);

  if (loading) {
    return (
      <Layout title="Products">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Products">
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <p className="text-red-500 text-lg mb-4">Failed to load products</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </Layout>
    );
  }

  if (!data?.products?.nodes) {
    return (
      <Layout title="Products">
        <div className="flex justify-center items-center min-h-[60vh]">
          <p className="text-gray-500">No products found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Products">
      <Head>
        <title>Products | RapidWoo Store</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">All Products</h1>
        <ProductList products={data.products.nodes} title="" />
      </div>
    </Layout>
  );
};

export default Products;
