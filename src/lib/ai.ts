import { auth } from '../firebase';

export interface AIDocumentVerdict {
  documentTypeMatches: boolean;
  readable: boolean;
  extractedName: string | null;
  expiryDate: string | null;
  isExpired: boolean | null;
  concerns: string[];
}

const AI_VERIFY_API_URL = import.meta.env.VITE_AI_VERIFY_API_URL as string | undefined;

export const isAIVerificationConfigured = Boolean(AI_VERIFY_API_URL);

/**
 * Advisory-only AI pre-check on a driver document (Google Gemini, called
 * server-side from vercel-blob-api/api/verify-document.js). Never
 * auto-approves or rejects -- a human admin always makes the final call in
 * admin/Compliance.tsx.
 */
export async function verifyDocumentWithAI(documentUrl: string, documentType: string): Promise<AIDocumentVerdict> {
  if (!AI_VERIFY_API_URL) {
    throw new Error('AI verification is not configured — missing VITE_AI_VERIFY_API_URL.');
  }
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('You must be signed in to run an AI check.');

  const res = await fetch(AI_VERIFY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, documentUrl, documentType }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || 'AI verification failed');
  return body as AIDocumentVerdict;
}
