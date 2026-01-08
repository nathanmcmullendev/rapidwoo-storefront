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
    if (sessionHeader) {
      headers['woocommerce-session'] = Array.isArray(sessionHeader)
        ? sessionHeader[0]
        : sessionHeader;
    }

    const response = await fetch('https://rapidwoo.com/e-commerce/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // Forward session header back to client if present
    const wooSession = response.headers.get('woocommerce-session');
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
