// Components
import Hero from '@/components/Index/Hero.component';
import DisplayProducts from '@/components/Product/DisplayProducts.component';
import Layout from '@/components/Layout/Layout.component';

// Types
import type { NextPage, GetStaticProps, InferGetStaticPropsType } from 'next';

// SSG utilities
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

/**
 * Main index page - Static Site Generation with ISR
 * Products are pre-rendered at build time and revalidated every 60 seconds
 * @function Index
 * @returns {JSX.Element} - Rendered component
 */
const Index: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ products }) => {
  return (
    <Layout title="Home">
      <Hero />
      {products?.length > 0 ? (
        <DisplayProducts products={products as any} />
      ) : (
        <div className="container mx-auto px-4 py-8 text-center text-gray-500">
          No products available.
        </div>
      )}
    </Layout>
  );
};

/**
 * Fetch products at build time (SSG) with Incremental Static Regeneration (ISR)
 * Revalidates every 60 seconds in production
 */
export const getStaticProps: GetStaticProps<{ products: ProductNode[] }> = async () => {
  try {
    const data = await fetchGraphQL<ProductsData>(PRODUCTS_QUERY);

    return {
      props: {
        products: data.products.nodes || [],
      },
      // Revalidate every 60 seconds (ISR)
      // In production, pages are regenerated in the background
      revalidate: 60,
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);

    return {
      props: {
        products: [],
      },
      // Retry sooner if there was an error
      revalidate: 10,
    };
  }
};

export default Index;
