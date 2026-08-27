const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const DOC_TYPE_LABELS = {
  license: "a Nigerian driver's license",
  insurance: 'a vehicle insurance certificate',
  registration: 'a vehicle registration document',
  permit: 'a commercial haulage permit',
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

// Same pattern as upload-token.js: verify the Firebase ID token via the
// Identity Toolkit REST API, no firebase-admin/service-account needed.
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

async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch document image (${res.status})`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { base64: buffer.toString('base64'), mimeType: contentType };
}

async function callGemini({ base64, mimeType, documentType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Server misconfigured: GEMINI_API_KEY not set');

  const label = DOC_TYPE_LABELS[documentType] || 'a driver verification document';
  const prompt = `You are a KYC document pre-checker for a Nigerian truck logistics platform. ` +
    `This image is meant to be ${label}. Look at it and respond with ONLY a JSON object (no markdown, no ` +
    `commentary) matching exactly this shape:\n` +
    `{"documentTypeMatches": boolean, "readable": boolean, "extractedName": string|null, ` +
    `"expiryDate": string|null (ISO date if visible, else null), "isExpired": boolean|null, "concerns": string[]}\n` +
    `"concerns" should be a short list of specific issues (e.g. "image is blurry", "expiry date not visible", ` +
    `"does not appear to be the stated document type", "name partially obscured"). Empty array if none. ` +
    `This is an advisory pre-check only -- a human reviewer makes the final decision, so flag anything uncertain ` +
    `rather than guessing.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gemini returned non-JSON output');
  }
}

export default async function handler(request, response) {
  const isWebApi = typeof response === 'undefined' || typeof response.status !== 'function';
  const headers = corsHeaders(isWebApi ? (typeof request.headers.get === 'function' ? request.headers.get('origin') : undefined) : request.headers.origin);

  if (isWebApi) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...headers, 'Content-Type': 'application/json' } });
    try {
      const body = await request.json();
      const result = await runVerification(body);
      return new Response(JSON.stringify(result), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Verification failed' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
    }
  }

  for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
  if (request.method === 'OPTIONS') { response.status(204).end(); return; }
  if (request.method !== 'POST') { response.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const result = await runVerification(request.body);
    response.status(200).json(result);
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : 'Verification failed' });
  }
}

async function runVerification(body) {
  const { idToken, documentUrl, documentType } = body || {};
  if (!idToken) throw new Error('Missing auth token');
  if (!documentUrl) throw new Error('Missing documentUrl');

  // Any signed-in user can call this today (same bar as upload-token.js) --
  // it only reads a public Blob URL and calls Gemini, no Firestore writes.
  // The button that triggers it only exists on the admin-only Compliance
  // page; stricter server-side role enforcement can be added later if this
  // needs to be locked down further.
  await verifyFirebaseIdToken(idToken);

  const { base64, mimeType } = await fetchImageAsBase64(documentUrl);
  return callGemini({ base64, mimeType, documentType });
}
