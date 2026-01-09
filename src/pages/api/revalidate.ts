import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * On-demand ISR revalidation endpoint
 *
 * Usage:
 * POST /api/revalidate
 * Body: { secret: "your-secret", path: "/product/anchor-bracelet" }
 *
 * Or revalidate multiple paths:
 * Body: { secret: "your-secret", paths: ["/", "/products", "/product/anchor-bracelet"] }
 *
 * Can be triggered by WooCommerce webhooks when products are updated
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for secret to prevent unauthorized revalidations
  const secret = req.body?.secret || req.query?.secret;
  const expectedSecret = process.env.REVALIDATE_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return res.status(401).json({ error: 'Invalid secret' });
  }

  try {
    const { path, paths, slug } = req.body;

    const pathsToRevalidate: string[] = [];

    // Handle single path
    if (path) {
      pathsToRevalidate.push(path);
    }

    // Handle multiple paths
    if (paths && Array.isArray(paths)) {
      pathsToRevalidate.push(...paths);
    }

    // Handle product slug shorthand
    if (slug) {
      pathsToRevalidate.push(`/product/${slug}`);
      // Also revalidate listing pages when a product changes
      pathsToRevalidate.push('/');
      pathsToRevalidate.push('/products');
    }

    // Default: revalidate main pages if nothing specified
    if (pathsToRevalidate.length === 0) {
      pathsToRevalidate.push('/');
      pathsToRevalidate.push('/products');
    }

    // Deduplicate paths
    const uniquePaths = [...new Set(pathsToRevalidate)];

    // Revalidate all paths
    const results = await Promise.allSettled(uniquePaths.map((p) => res.revalidate(p)));

    const revalidated = uniquePaths.filter((_, i) => results[i].status === 'fulfilled');
    const failed = uniquePaths.filter((_, i) => results[i].status === 'rejected');

    return res.status(200).json({
      revalidated,
      failed,
      message: `Revalidated ${revalidated.length} paths`,
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return res.status(500).json({ error: 'Failed to revalidate' });
  }
}
