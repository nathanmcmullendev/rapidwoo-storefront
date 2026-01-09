import { useState, useEffect } from 'react';
import type { Stripe } from '@stripe/stripe-js';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.component';

// Lazy load Stripe only when this component is used (checkout page only)
// This saves ~400KB from the initial bundle on all other pages
const loadStripeAsync = () => import('@stripe/stripe-js').then((mod) => mod.loadStripe);

const loadElementsAsync = () => import('@stripe/react-stripe-js').then((mod) => mod.Elements);

const loadPaymentFormAsync = () => import('./StripePayment.component');

interface StripeCheckoutProps {
  amount: number; // Amount in cents
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  billingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    address1: string;
    city: string;
    postcode: string;
    country?: string;
  };
}

const StripeCheckout = ({ amount, onSuccess, onError, billingDetails }: StripeCheckoutProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lazy-loaded Stripe state
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [ElementsComponent, setElementsComponent] = useState<React.ComponentType<any> | null>(null);
  const [PaymentFormComponent, setPaymentFormComponent] = useState<React.ComponentType<any> | null>(
    null,
  );
  const [stripeLoading, setStripeLoading] = useState(true);

  // Load Stripe and Elements components lazily
  useEffect(() => {
    const loadStripeComponents = async () => {
      try {
        const [loadStripe, { Elements }, PaymentFormModule] = await Promise.all([
          loadStripeAsync(),
          loadElementsAsync().then((mod) => ({ Elements: mod })),
          loadPaymentFormAsync(),
        ]);

        setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!));
        setElementsComponent(() => Elements);
        setPaymentFormComponent(() => PaymentFormModule.default);
      } catch (err) {
        console.error('Failed to load Stripe:', err);
        setError('Failed to load payment system');
        onError('Failed to load payment system');
      } finally {
        setStripeLoading(false);
      }
    };

    loadStripeComponents();
  }, [onError]);

  // Create PaymentIntent when component mounts and Stripe is loaded
  useEffect(() => {
    if (stripeLoading || !stripePromise) return;

    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            metadata: {
              customerName: `${billingDetails.firstName} ${billingDetails.lastName}`,
              customerEmail: billingDetails.email,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize payment');
        onError(err instanceof Error ? err.message : 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [
    amount,
    billingDetails.firstName,
    billingDetails.lastName,
    billingDetails.email,
    onError,
    stripeLoading,
    stripePromise,
  ]);

  // Show loading while Stripe is being loaded
  if (stripeLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">
          {stripeLoading ? 'Loading payment system...' : 'Initializing payment...'}
        </p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  if (!clientSecret || !stripePromise || !ElementsComponent || !PaymentFormComponent) {
    return (
      <div className="text-red-600 text-center py-4">
        Unable to initialize payment. Please try again.
      </div>
    );
  }

  const stripeBillingDetails = {
    name: `${billingDetails.firstName} ${billingDetails.lastName}`,
    email: billingDetails.email,
    address: {
      line1: billingDetails.address1,
      city: billingDetails.city,
      postal_code: billingDetails.postcode,
      country: billingDetails.country || 'US',
    },
  };

  // Use dynamically loaded Elements and PaymentForm components
  const Elements = ElementsComponent;
  const StripePaymentForm = PaymentFormComponent;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#dc2626',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <StripePaymentForm
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        billingDetails={stripeBillingDetails}
      />
    </Elements>
  );
};

export default StripeCheckout;
