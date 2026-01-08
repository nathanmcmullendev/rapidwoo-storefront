import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout.component';
import type { NextPage } from 'next';

const OrderConfirmation: NextPage = () => {
  const router = useRouter();
  const { payment_intent, payment_intent_client_secret, redirect_status } = router.query;

  useEffect(() => {
    // Log payment completion for debugging
    if (payment_intent && redirect_status === 'succeeded') {
      console.log('Payment completed:', payment_intent);
    }
  }, [payment_intent, redirect_status]);

  return (
    <Layout title="Order Confirmation">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {redirect_status === 'succeeded' ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Payment Successful!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for your purchase. Your order has been confirmed and you will receive a confirmation email shortly.
              </p>
              {payment_intent && (
                <p className="text-sm text-gray-500 mb-8">
                  Transaction ID: {payment_intent}
                </p>
              )}
            </>
          ) : redirect_status === 'processing' ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Payment Processing
              </h1>
              <p className="text-gray-600 mb-6">
                Your payment is being processed. You will receive a confirmation email once complete.
              </p>
            </>
          ) : redirect_status === 'requires_payment_method' ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Payment Failed
              </h1>
              <p className="text-gray-600 mb-6">
                Your payment could not be processed. Please try again with a different payment method.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Order Confirmed
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for your order! You will receive a confirmation email shortly.
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="inline-block bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </a>
            <a
              href="/min-konto"
              className="inline-block bg-gray-100 text-gray-800 py-3 px-8 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              View Orders
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
