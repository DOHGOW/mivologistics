import { handleUpload } from '@vercel/blob/client';

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB, matches the old storage.rules cap
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

function setCorsHeaders(response, requestOrigin) {
  response.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || requestOrigin || '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Vary', 'Origin');
}

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

export default async function handler(request, response) {
  setCorsHeaders(response, request.headers.origin);

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const jsonResponse = await handleUpload({
      body: request.body,
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

    response.status(200).json(jsonResponse);
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : 'Upload token request failed' });
  }
}
