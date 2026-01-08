/*eslint complexity: ["error", 25]*/
import { useState, useEffect } from 'react';
import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { useForm, FormProvider } from 'react-hook-form';

// Components
import CartContents from '../Cart/CartContents.component';
import { InputField } from '@/components/Input/InputField.component';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.component';
import StripeCheckout from './StripeCheckout.component';

// GraphQL
import { GET_CART } from '@/utils/gql/GQL_QUERIES';
import { CHECKOUT_MUTATION } from '@/utils/gql/GQL_MUTATIONS';
import { useCartStore } from '@/stores/cartStore';

// Utils
import {
  getFormattedCart,
  createCheckoutData,
  ICheckoutDataProps,
} from '@/utils/functions/functions';
import { INPUT_FIELDS } from '@/utils/constants/INPUT_FIELDS';

type PaymentMethod = 'stripe' | 'cod';

const CheckoutFormWithStripe = () => {
  const { cart, clearWooCommerceSession, syncWithWooCommerce } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [requestError, setRequestError] = useState<ApolloError | null>(null);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);
  const [step, setStep] = useState<'billing' | 'payment'>('billing');
  const [billingData, setBillingData] = useState<ICheckoutDataProps | null>(null);

  const methods = useForm<ICheckoutDataProps>();

  // Get cart data query
  const { data, refetch } = useQuery(GET_CART, {
    notifyOnNetworkStatusChange: true,
    onCompleted: () => {
      const updatedCart = getFormattedCart(data);
      if (!updatedCart && !data?.cart?.contents?.nodes?.length) {
        clearWooCommerceSession();
        return;
      }
      if (updatedCart) {
        syncWithWooCommerce(updatedCart);
      }
    },
  });

  // Checkout GraphQL mutation
  const [checkout, { loading: checkoutLoading }] = useMutation(
    CHECKOUT_MUTATION,
    {
      onCompleted: () => {
        clearWooCommerceSession();
        setOrderCompleted(true);
        refetch();
      },
      onError: (error) => {
        setRequestError(error);
        refetch();
      },
    },
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Calculate cart total in cents for Stripe
  const getCartTotalInCents = (): number => {
    if (!cart?.totalProductsPrice) return 0;
    // Handle both number and string formats
    const price = cart.totalProductsPrice;
    if (typeof price === 'number') {
      return Math.round(price * 100);
    }
    // Parse the price string (e.g., "$100.00" -> 10000)
    const priceStr = String(price).replace(/[^0-9.]/g, '');
    return Math.round(parseFloat(priceStr) * 100);
  };

  // Handle billing form submission
  const handleBillingSubmit = (formData: ICheckoutDataProps) => {
    setBillingData(formData);
    setStep('payment');
  };

  // Handle COD checkout
  const handleCodCheckout = () => {
    if (!billingData) return;

    const checkoutData = createCheckoutData({
      ...billingData,
      paymentMethod: 'cod',
    });

    checkout({
      variables: {
        input: checkoutData,
      },
    });
  };

  // Handle successful Stripe payment
  const handleStripeSuccess = (paymentIntentId: string) => {
    setStripePaymentIntentId(paymentIntentId);

    if (!billingData) return;

    // Create WooCommerce order with Stripe payment info
    const checkoutData = createCheckoutData({
      ...billingData,
      paymentMethod: 'stripe',
    });

    // Add transaction ID to the checkout data
    const checkoutWithTransaction = {
      ...checkoutData,
      transactionId: paymentIntentId,
      isPaid: true,
    };

    checkout({
      variables: {
        input: checkoutWithTransaction,
      },
    });
  };

  // Handle Stripe error
  const handleStripeError = (error: string) => {
    console.error('Stripe payment error:', error);
  };

  // Render billing step
  const renderBillingStep = () => (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleBillingSubmit)}>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INPUT_FIELDS.map(({ id, label, name, customValidation }) => (
              <InputField
                key={id}
                inputLabel={label}
                inputName={name}
                customValidation={customValidation}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          <div className="space-y-3">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')}
                className="w-4 h-4 text-blue-600"
              />
              <div className="ml-3">
                <span className="font-medium">Credit / Debit Card</span>
                <p className="text-sm text-gray-500">Pay securely with Stripe</p>
              </div>
              <div className="ml-auto flex gap-2">
                <img src="/visa.svg" alt="Visa" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                <img src="/mastercard.svg" alt="Mastercard" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
            </label>

            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                className="w-4 h-4 text-blue-600"
              />
              <div className="ml-3">
                <span className="font-medium">Cash on Delivery</span>
                <p className="text-sm text-gray-500">Pay when you receive your order</p>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold
                     hover:bg-blue-700 transition-colors duration-200"
        >
          Continue to Payment
        </button>
      </form>
    </FormProvider>
  );

  // Render payment step
  const renderPaymentStep = () => (
    <div className="space-y-6">
      <button
        onClick={() => setStep('billing')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Billing
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          {paymentMethod === 'stripe' ? 'Card Payment' : 'Cash on Delivery'}
        </h2>

        {paymentMethod === 'stripe' && billingData && (
          <StripeCheckout
            amount={getCartTotalInCents()}
            onSuccess={handleStripeSuccess}
            onError={handleStripeError}
            billingDetails={{
              firstName: billingData.firstName,
              lastName: billingData.lastName,
              email: billingData.email,
              address1: billingData.address1,
              city: billingData.city,
              postcode: billingData.postcode,
              country: 'US',
            }}
          />
        )}

        {paymentMethod === 'cod' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              You will pay when your order is delivered. Please have the exact amount ready.
            </p>
            <button
              onClick={handleCodCheckout}
              disabled={checkoutLoading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold
                         hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
            >
              {checkoutLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  Processing Order...
                </span>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {cart && !orderCompleted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main checkout form */}
          <div className="lg:col-span-2">
            {step === 'billing' && renderBillingStep()}
            {step === 'payment' && renderPaymentStep()}

            {requestError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                An error occurred while processing your order. Please try again.
              </div>
            )}

            {checkoutLoading && step === 'billing' && (
              <div className="mt-4 text-center">
                <LoadingSpinner />
                <p className="mt-2 text-gray-600">Processing your order...</p>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <CartContents />
            </div>
          </div>
        </div>
      ) : (
        <>
          {!cart && !orderCompleted && (
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Your cart is empty
              </h1>
              <p className="text-gray-600 mb-6">
                Add some products to your cart before checking out.
              </p>
              <a
                href="/produkter"
                className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </a>
            </div>
          )}
          {orderCompleted && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Thank you for your order!
              </h1>
              <p className="text-gray-600 mb-6">
                Your order has been placed successfully. You will receive a confirmation email shortly.
              </p>
              {stripePaymentIntentId && (
                <p className="text-sm text-gray-500">
                  Payment ID: {stripePaymentIntentId}
                </p>
              )}
              <a
                href="/"
                className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors mt-4"
              >
                Continue Shopping
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CheckoutFormWithStripe;
