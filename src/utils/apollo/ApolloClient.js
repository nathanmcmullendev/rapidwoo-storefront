/*eslint complexity: ["error", 8]*/

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
} from '@apollo/client';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Middleware operation
 * If we have a session token in localStorage, add it to the GraphQL request as a Session header.
 */
export const middleware = new ApolloLink((operation, forward) => {
  /**
   * If session data exist in local storage, set value as session header.
   * Here we also delete the session if it is older than 7 days
   */
  const isBrowser = typeof window !== 'undefined';
  let sessionData = null;

  if (isBrowser) {
    try {
      const stored = localStorage.getItem('woo-session');
      sessionData = stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error parsing session data:', e);
    }
  }

  const headers = {};

  if (sessionData && sessionData.token && sessionData.createdTime) {
    const { token, createdTime } = sessionData;

    // Check if the token is older than 7 days
    if (Date.now() - createdTime > SEVEN_DAYS) {
      // If it is, delete it
      localStorage.removeItem('woo-session');
      localStorage.setItem('woocommerce-cart', JSON.stringify({}));
    } else {
      // If it's not, use the token
      headers['woocommerce-session'] = `Session ${token}`;
      console.log('[Apollo Middleware] Adding session header:', token.substring(0, 20) + '...');
    }
  } else {
    console.log('[Apollo Middleware] No session token found');
  }

  operation.setContext(({ headers: existingHeaders = {} }) => ({
    headers: {
      ...existingHeaders,
      ...headers,
    },
  }));

  return forward(operation);
});

/**
 * Afterware operation.
 *
 * This catches the incoming session token and stores it in localStorage, for future GraphQL requests.
 */
export const afterware = new ApolloLink((operation, forward) =>
  forward(operation).map((response) => {
    /**
     * Check for session header and update session in local storage accordingly.
     */
    const isBrowser = typeof window !== 'undefined';
    const context = operation.getContext();
    const {
      response: { headers },
    } = context;

    const session = headers?.get('woocommerce-session');

    if (session && isBrowser) {
      console.log('[Apollo Afterware] Received session header:', session.substring(0, 30) + '...');
      if ('false' === session) {
        // Remove session data if session destroyed.
        localStorage.removeItem('woo-session');
        console.log('[Apollo Afterware] Session destroyed, removed from localStorage');
      } else {
        // Always update session token when received
        localStorage.setItem(
          'woo-session',
          JSON.stringify({ token: session, createdTime: Date.now() }),
        );
        console.log('[Apollo Afterware] Session saved to localStorage');
      }
    }

    return response;
  }),
);

const isServer = typeof window === 'undefined';

// Apollo GraphQL client.
const client = new ApolloClient({
  ssrMode: isServer,
  link: middleware.concat(
    afterware.concat(
      createHttpLink({
        uri: '/api/graphql', // Use local proxy to bypass CORS
        fetch,
        credentials: 'same-origin',
      }),
    ),
  ),
  cache: new InMemoryCache(),
});

export default client;
