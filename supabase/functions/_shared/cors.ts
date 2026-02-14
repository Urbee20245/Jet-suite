/**
 * CORS utilities for Supabase Edge Functions
 */

const ALLOWED_ORIGINS = [
  'https://www.getjetsuite.com',
  'https://getjetsuite.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(origin?: string | null): HeadersInit {
  // Check if origin is allowed
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsPreflightRequest(req: Request): Response {
  const origin = req.headers.get('origin');
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(
  data: unknown,
  status: number = 200,
  origin?: string | null
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
      },
    }
  );
}

/**
 * Create an error response with CORS headers
 */
export function errorResponse(
  message: string,
  status: number = 500,
  origin?: string | null
): Response {
  return jsonResponse(
    { error: message },
    status,
    origin
  );
}
