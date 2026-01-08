import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Build headers to forward to WooCommerce
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0',
    };

    // Forward session header from client if present
    const sessionHeader = req.headers['woocommerce-session'];
    console.log('[GraphQL Proxy] Incoming session header:', sessionHeader);

    if (sessionHeader) {
      headers['woocommerce-session'] = Array.isArray(sessionHeader)
        ? sessionHeader[0]
        : sessionHeader;
    }

    // Log the operation name from the request body for debugging
    const operationName = req.body?.operationName || 'unknown';
    console.log(`[GraphQL Proxy] Operation: ${operationName}, Session sent: ${headers['woocommerce-session'] || 'none'}`);

    const response = await fetch('https://rapidwoo.com/e-commerce/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // Log any errors from WooCommerce
    if (data.errors) {
      console.error('[GraphQL Proxy] WooCommerce errors:', JSON.stringify(data.errors, null, 2));
    }

    // Forward session header back to client if present
    const wooSession = response.headers.get('woocommerce-session');
    console.log('[GraphQL Proxy] Response session header:', wooSession);

    if (wooSession) {
      res.setHeader('woocommerce-session', wooSession);
      // Expose header to browser JavaScript
      res.setHeader('Access-Control-Expose-Headers', 'woocommerce-session');
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from GraphQL endpoint' });
  }
}
