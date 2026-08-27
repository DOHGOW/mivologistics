const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

// Same pattern as upload-token.js / verify-document.js.
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
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { base64: buffer.toString('base64'), mimeType: contentType };
}

async function callGemini({ pickupImage, deliveryImage }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Server misconfigured: GEMINI_API_KEY not set');

  const prompt = `You are a cargo-condition assistant for a Nigerian truck logistics platform. ` +
    `The first image was taken at pickup, the second at delivery, of the same cargo. Compare them and ` +
    `respond with ONLY a JSON object (no markdown, no commentary) matching exactly this shape:\n` +
    `{"hasDamage": boolean, "concerns": string[], "summary": string}\n` +
    `"concerns" should list specific visible differences suggesting damage, missing items, or tampering ` +
    `(e.g. "torn packaging on the left side", "item appears crushed"). Empty array if the cargo looks unchanged. ` +
    `"summary" is one short sentence. This is advisory only for a human to review in a dispute -- if the photos ` +
    `are unclear, different framing/lighting makes comparison hard, or you're not confident, say so in "summary" ` +
    `rather than guessing at damage.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { text: 'Pickup photo:' },
            { inline_data: { mime_type: pickupImage.mimeType, data: pickupImage.base64 } },
            { text: 'Delivery photo:' },
            { inline_data: { mime_type: deliveryImage.mimeType, data: deliveryImage.base64 } },
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
      const result = await runAnalysis(body);
      return new Response(JSON.stringify(result), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
    }
  }

  for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
  if (request.method === 'OPTIONS') { response.status(204).end(); return; }
  if (request.method !== 'POST') { response.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const result = await runAnalysis(request.body);
    response.status(200).json(result);
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : 'Analysis failed' });
  }
}

async function runAnalysis(body) {
  const { idToken, pickupPhotoUrl, deliveryPhotoUrl } = body || {};
  if (!idToken) throw new Error('Missing auth token');
  if (!pickupPhotoUrl || !deliveryPhotoUrl) throw new Error('Missing pickupPhotoUrl or deliveryPhotoUrl');

  await verifyFirebaseIdToken(idToken);

  const [pickupImage, deliveryImage] = await Promise.all([
    fetchImageAsBase64(pickupPhotoUrl),
    fetchImageAsBase64(deliveryPhotoUrl),
  ]);

  return callGemini({ pickupImage, deliveryImage });
}
