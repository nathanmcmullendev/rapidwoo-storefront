import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePayment.component';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.component';

// Initialize Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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

const StripeCheckout = ({
  amount,
  onSuccess,
  onError,
  billingDetails,
}: StripeCheckoutProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create PaymentIntent when component mounts
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
  }, [amount, billingDetails.firstName, billingDetails.lastName, billingDetails.email, onError]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Initializing payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">
        {error}
      </div>
    );
  }

  if (!clientSecret) {
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
