// SSG Single product page with ISR
import Link from 'next/link';
import SingleProduct from '@/components/Product/SingleProduct.component';
import type { IProduct } from '@/components/Product/AddToCart.component';
import Layout from '@/components/Layout/Layout.component';
import type { NextPage, GetStaticProps, GetStaticPaths, InferGetStaticPropsType } from 'next';
import { fetchGraphQL, SINGLE_PRODUCT_QUERY, PRODUCT_SLUGS_QUERY } from '@/utils/graphql-fetch';

interface ProductSlugsData {
  products: {
    nodes: Array<{ slug: string }>;
  };
}

interface SingleProductData {
  product: {
    id: string;
    databaseId: number;
    averageRating: number;
    slug: string;
    description: string;
    onSale: boolean;
    image: {
      id: string;
      uri: string;
      title: string;
      srcSet: string;
      sourceUrl: string;
    } | null;
    name: string;
    salePrice?: string;
    regularPrice?: string;
    price?: string;
    stockQuantity?: number;
    stockStatus?: string;
    defaultAttributes?: {
      nodes: Array<{
        id: string;
        attributeId: number;
        name: string;
        value: string;
      }>;
    };
    allPaColor?: {
      nodes: Array<{ name: string }>;
    };
    allPaSize?: {
      nodes: Array<{ name: string }>;
    };
    variations?: {
      nodes: Array<{
        id: string;
        databaseId: number;
        name: string;
        stockStatus: string;
        stockQuantity: number | null;
        purchasable: boolean;
        onSale: boolean;
        salePrice: string | null;
        regularPrice: string;
        image: {
          id: string;
          sourceUrl: string;
          altText: string;
        } | null;
        attributes: {
          nodes: Array<{
            id: string;
            name: string;
            value: string;
          }>;
        };
      }>;
    };
  } | null;
}

const ProductPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ product }) => {
  if (!product) {
    return (
      <Layout title="Product Not Found">
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <p className="text-gray-500 text-lg">Product not found</p>
          <Link href="/products" className="mt-4 text-blue-600 hover:text-blue-800">
            Browse all products
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={product.name || 'Product'}>
      <SingleProduct product={product as IProduct} />
    </Layout>
  );
};

/**
 * Generate static paths for all products at build time
 * Uses fallback: 'blocking' to handle new products added after build
 */
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const data = await fetchGraphQL<ProductSlugsData>(PRODUCT_SLUGS_QUERY);

    const paths = data.products.nodes.map((product) => ({
      params: { slug: product.slug },
    }));

    return {
      paths,
      // 'blocking' means new pages will be server-rendered on first request
      // then cached for subsequent requests (best for SEO)
      fallback: 'blocking',
    };
  } catch (error) {
    console.error('Failed to fetch product slugs:', error);

    return {
      paths: [],
      fallback: 'blocking',
    };
  }
};

/**
 * Fetch single product at build time with ISR
 */
export const getStaticProps: GetStaticProps<{ product: SingleProductData['product'] }> = async ({
  params,
}) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  try {
    const data = await fetchGraphQL<SingleProductData>(SINGLE_PRODUCT_QUERY, { slug });

    if (!data.product) {
      return {
        notFound: true,
        revalidate: 60,
      };
    }

    return {
      props: {
        product: data.product,
      },
      // Revalidate every 60 seconds
      revalidate: 60,
    };
  } catch (error) {
    console.error(`Failed to fetch product ${slug}:`, error);

    return {
      notFound: true,
      revalidate: 10,
    };
  }
};

export default ProductPage;
