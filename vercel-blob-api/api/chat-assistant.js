const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const MAX_HISTORY_MESSAGES = 20;

const SYSTEM_INSTRUCTION = `You are the Mivo Assistant, a helpful support chatbot for Mivo, a truck ` +
  `booking and logistics platform in Nigeria (customers book trucks to move cargo; drivers accept and run the ` +
  `trips). Answer questions about how the app works: booking a truck, tracking a shipment, payment methods ` +
  `(Paystack, Flutterwave, Mivo Wallet, Cash on Delivery), driver document verification, and general logistics ` +
  `questions relevant to Nigerian trucking (routes, fuel, timing expectations).\n\n` +
  `Reply in whatever language or register the user writes in -- including Nigerian Pidgin, Hausa, Yoruba, or ` +
  `Igbo if that's what they use. Keep answers short and practical (2-4 sentences unless more detail is clearly ` +
  `needed).\n\n` +
  `You cannot take real actions (you can't actually cancel a booking, issue a refund, or change account data) -- ` +
  `for anything requiring an account change, tell the user to use the in-app Support Center's Email/Call options ` +
  `so a human can help. Don't make up specific prices, dates, or account details you don't have.`;

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

// Same pattern as the other AI endpoints.
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

async function callGemini(messages) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Server misconfigured: GEMINI_API_KEY not set');

  const contents = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.text || '').slice(0, 4000) }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
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
  return text;
}

export default async function handler(request, response) {
  const isWebApi = typeof response === 'undefined' || typeof response.status !== 'function';
  const headers = corsHeaders(isWebApi ? (typeof request.headers.get === 'function' ? request.headers.get('origin') : undefined) : request.headers.origin);

  if (isWebApi) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...headers, 'Content-Type': 'application/json' } });
    try {
      const body = await request.json();
      const reply = await runChat(body);
      return new Response(JSON.stringify({ reply }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Chat failed' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
    }
  }

  for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
  if (request.method === 'OPTIONS') { response.status(204).end(); return; }
  if (request.method !== 'POST') { response.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const reply = await runChat(request.body);
    response.status(200).json({ reply });
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : 'Chat failed' });
  }
}

async function runChat(body) {
  const { idToken, messages } = body || {};
  if (!idToken) throw new Error('Missing auth token');
  if (!Array.isArray(messages) || messages.length === 0) throw new Error('Missing messages');

  await verifyFirebaseIdToken(idToken);

  return callGemini(messages);
}
