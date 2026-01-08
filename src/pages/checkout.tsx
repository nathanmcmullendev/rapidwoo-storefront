// Components
import Layout from '@/components/Layout/Layout.component';
import CheckoutFormWithStripe from '@/components/Checkout/CheckoutFormWithStripe.component';

// Types
import type { NextPage } from 'next';

const Checkout: NextPage = () => (
  <Layout title="Checkout">
    <CheckoutFormWithStripe />
  </Layout>
);

export default Checkout;
