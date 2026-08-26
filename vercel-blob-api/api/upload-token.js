const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB, matches the old storage.rules cap
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Verifies the Firebase ID token via the Identity Toolkit REST API — no
// firebase-admin/service-account needed, just the (public) web API key.
async function verifyFirebaseIdToken(idToken) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) throw new Error('Server misconfigured: FIREBASE_API_KEY not set');

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error('Invalid or expired auth token');

  const data = await res.json();
  const uid = data.users?.[0]?.localId;
  if (!uid) throw new Error('Invalid auth token');
  return uid;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

async function processUpload(body, request) {
  const { handleUpload } = await import('@vercel/blob/client');
  return handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const { idToken } = clientPayload ? JSON.parse(clientPayload) : {};
      if (!idToken) throw new Error('Missing auth token');

      const uid = await verifyFirebaseIdToken(idToken);
      if (!pathname.startsWith(`driverDocuments/${uid}/`)) {
        throw new Error('Not authorized to upload to this path');
      }

      return {
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_DOCUMENT_BYTES,
        addRandomSuffix: false,
      };
    },
    onUploadCompleted: async () => {},
  });
}

function errorBody(error) {
  // TEMP: includes `stack` for live debugging of the initial deploy — strip
  // this field once the endpoint is confirmed working.
  return {
    error: error instanceof Error ? error.message : 'Upload token request failed',
    stack: error instanceof Error ? error.stack : undefined,
  };
}

export default async function handler(request, response) {
  // Vercel's Node.js runtime dispatches either the legacy (req, res) style
  // or, for 1-arg handlers, a Web Fetch (Request) => Response style. Handle
  // both defensively instead of assuming which one this deployment uses.
  const isWebApi = typeof response === 'undefined' || typeof response.status !== 'function';

  if (isWebApi) {
    const origin = typeof request.headers.get === 'function' ? request.headers.get('origin') : undefined;
    const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    try {
      const body = await request.json();
      const json = await processUpload(body, request);
      return new Response(JSON.stringify(json), { status: 200, headers });
    } catch (error) {
      return new Response(JSON.stringify(errorBody(error)), { status: 400, headers });
    }
  }

  const headers = corsHeaders(request.headers.origin);
  for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const json = await processUpload(request.body, request);
    response.status(200).json(json);
  } catch (error) {
    response.status(400).json(errorBody(error));
  }
}
