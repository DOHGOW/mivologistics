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

async function callGemini({ selfieImage, licenseImage }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Server misconfigured: GEMINI_API_KEY not set');

  const prompt = `You are a lightweight identity pre-check for a Nigerian truck logistics platform, run at the ` +
    `start of a trip. The first image is a live selfie just taken by the driver; the second is the photo on their ` +
    `license document on file. Compare them and respond with ONLY a JSON object (no markdown, no commentary) ` +
    `matching exactly this shape:\n` +
    `{"likelySamePerson": boolean, "confidence": "high"|"medium"|"low", "notes": string}\n` +
    `This is advisory only, NOT a biometric/legal identity determination -- it exists to flag obvious mismatches ` +
    `(e.g. a completely different person, or a selfie of a screen/photo rather than a live person) for human` +
    ` follow-up, not to make an automated access decision. If the license photo is unclear or the images can't be ` +
    `meaningfully compared, say so in "notes" and set "confidence" to "low" rather than guessing.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { text: 'Live selfie:' },
            { inline_data: { mime_type: selfieImage.mimeType, data: selfieImage.base64 } },
            { text: 'License photo on file:' },
            { inline_data: { mime_type: licenseImage.mimeType, data: licenseImage.base64 } },
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
      const result = await runCheck(body);
      return new Response(JSON.stringify(result), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Identity check failed' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
    }
  }

  for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
  if (request.method === 'OPTIONS') { response.status(204).end(); return; }
  if (request.method !== 'POST') { response.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const result = await runCheck(request.body);
    response.status(200).json(result);
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : 'Identity check failed' });
  }
}

async function runCheck(body) {
  const { idToken, selfieUrl, licenseUrl } = body || {};
  if (!idToken) throw new Error('Missing auth token');
  if (!selfieUrl || !licenseUrl) throw new Error('Missing selfieUrl or licenseUrl');

  await verifyFirebaseIdToken(idToken);

  const [selfieImage, licenseImage] = await Promise.all([
    fetchImageAsBase64(selfieUrl),
    fetchImageAsBase64(licenseUrl),
  ]);

  return callGemini({ selfieImage, licenseImage });
}
