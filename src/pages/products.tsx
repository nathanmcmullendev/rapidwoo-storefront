// SSG Products page with ISR
import Head from 'next/head';
import Layout from '@/components/Layout/Layout.component';
import ProductList from '@/components/Product/ProductList.component';
import type { NextPage, GetStaticProps, InferGetStaticPropsType } from 'next';
import { fetchGraphQL, PRODUCTS_QUERY } from '@/utils/graphql-fetch';

interface ProductNode {
  databaseId: number;
  name: string;
  onSale: boolean;
  slug: string;
  image: { sourceUrl: string } | null;
  price: string;
  regularPrice: string;
  salePrice: string | null;
  variations?: {
    nodes: Array<{
      price: string;
      regularPrice: string;
      salePrice: string | null;
    }>;
  };
}

interface ProductsData {
  products: {
    nodes: ProductNode[];
  };
}

const Products: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ products }) => {
  if (!products?.length) {
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

      <div className="container mx-auto px-3 py-3 md:px-4 md:py-4">
        <ProductList products={products as any} title="All Products" />
      </div>
    </Layout>
  );
};

/**
 * Fetch products at build time (SSG) with Incremental Static Regeneration (ISR)
 */
export const getStaticProps: GetStaticProps<{ products: ProductNode[] }> = async () => {
  try {
    const data = await fetchGraphQL<ProductsData>(PRODUCTS_QUERY);

    return {
      props: {
        products: data.products.nodes || [],
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);

    return {
      props: {
        products: [],
      },
      revalidate: 10,
    };
  }
};

export default Products;
