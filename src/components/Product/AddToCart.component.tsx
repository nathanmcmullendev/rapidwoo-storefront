// Imports
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

// Components
import Button from '@/components/UI/Button.component';

// State
import { useCartStore } from '@/stores/cartStore';

// Utils
import { getFormattedCart } from '@/utils/functions/functions';

// GraphQL
import { GET_CART } from '@/utils/gql/GQL_QUERIES';
import { ADD_TO_CART } from '@/utils/gql/GQL_MUTATIONS';

interface IImage {
  __typename: string;
  id: string;
  uri: string;
  title: string;
  srcSet: string;
  sourceUrl: string;
}

interface IVariationNode {
  __typename: string;
  name: string;
}

// Note: WooGraphQL uses singular form (allPaColor, allPaSize)
interface IAllPaColor {
  __typename: string;
  nodes: IVariationNode[];
}

interface IAllPaSize {
  __typename: string;
  nodes: IVariationNode[];
}

export interface IVariationAttribute {
  id: string;
  name: string;
  value: string;
}

export interface IDefaultAttribute {
  id: string;
  attributeId: number;
  name: string;
  value: string;
}

export interface IVariationNodes {
  __typename: string;
  id: string;
  databaseId: number;
  name: string;
  stockStatus: string;
  stockQuantity: number;
  purchasable: boolean;
  onSale: boolean;
  salePrice?: string;
  regularPrice: string;
  image?: {
    id: string;
    sourceUrl: string;
    altText?: string;
  };
  attributes?: {
    nodes: IVariationAttribute[];
  };
}

interface IVariations {
  __typename: string;
  nodes: IVariationNodes[];
}

export interface IProduct {
  __typename: string;
  id: string;
  databaseId: number;
  averageRating: number;
  slug: string;
  description: string;
  onSale: boolean;
  image: IImage;
  name: string;
  salePrice?: string;
  regularPrice: string;
  price: string;
  stockQuantity: number;
  allPaColor?: IAllPaColor;
  allPaSize?: IAllPaSize;
  variations?: IVariations;
  defaultAttributes?: {
    nodes: IDefaultAttribute[];
  };
}

export interface ISelectedAttribute {
  attributeName: string;
  attributeValue: string;
}

export interface IProductRootObject {
  product: IProduct;
  variationId?: number;
  selectedAttributes?: ISelectedAttribute[];
  fullWidth?: boolean;
}

/**
 * Handles the Add to cart functionality.
 * Uses GraphQL for product data
 * @param {IAddToCartProps} product // Product data
 * @param {number} variationId // Variation ID
 * @param {boolean} fullWidth // Whether the button should be full-width
 */

const AddToCart = ({
  product,
  variationId,
  selectedAttributes,
  fullWidth = false,
}: IProductRootObject) => {
  const { syncWithWooCommerce, isLoading: isCartLoading } = useCartStore();
  const [requestError, setRequestError] = useState<boolean>(false);

  const productId = product?.databaseId;

  // For variable products, we need productId, variationId, and selected attributes
  // The variation parameter is required for products with "Any" attributes
  const productQueryInput = variationId
    ? {
        clientMutationId: uuidv4(),
        productId,
        variationId,
        // Include selected attributes for proper order details
        ...(selectedAttributes &&
          selectedAttributes.length > 0 && {
            variation: selectedAttributes,
          }),
      }
    : {
        clientMutationId: uuidv4(),
        productId,
      };

  // Get cart data query
  const { refetch } = useQuery(GET_CART, {
    notifyOnNetworkStatusChange: true,
    onCompleted: (completedData) => {
      const updatedCart = getFormattedCart(completedData);
      if (updatedCart) {
        syncWithWooCommerce(updatedCart);
      }
    },
  });

  // Add to cart mutation
  const [addToCart, { loading: addToCartLoading }] = useMutation(ADD_TO_CART, {
    variables: {
      input: productQueryInput,
    },

    onCompleted: (data) => {
      console.log('[AddToCart] Success:', data);
      // Update the cart with new values in React context.
      refetch();
    },

    onError: (error) => {
      console.error('[AddToCart] Error:', error.message);
      console.error('[AddToCart] GraphQL Errors:', error.graphQLErrors);
      console.error('[AddToCart] Input was:', productQueryInput);
      setRequestError(true);
    },
  });

  const handleAddToCart = () => {
    console.log('[AddToCart] Adding to cart with input:', productQueryInput);
    addToCart();
    // Refetch cart after 2 seconds
    setTimeout(() => {
      refetch();
    }, 2000);
  };

  return (
    <>
      <Button
        handleButtonClick={() => handleAddToCart()}
        buttonDisabled={addToCartLoading || requestError || isCartLoading}
        fullWidth={fullWidth}
      >
        {isCartLoading ? 'Loading...' : 'ADD TO CART'}
      </Button>
    </>
  );
};

export default AddToCart;
