import { auth } from '../firebase';

export interface AIDocumentVerdict {
  documentTypeMatches: boolean;
  readable: boolean;
  extractedName: string | null;
  expiryDate: string | null;
  isExpired: boolean | null;
  concerns: string[];
}

export interface CargoDamageReport {
  hasDamage: boolean;
  concerns: string[];
  summary: string;
}

export interface IdentityCheckResult {
  likelySamePerson: boolean;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

const AI_VERIFY_API_URL = import.meta.env.VITE_AI_VERIFY_API_URL as string | undefined;
const AI_CARGO_DAMAGE_API_URL = import.meta.env.VITE_AI_CARGO_DAMAGE_API_URL as string | undefined;
const AI_IDENTITY_CHECK_API_URL = import.meta.env.VITE_AI_IDENTITY_CHECK_API_URL as string | undefined;

export const isAIVerificationConfigured = Boolean(AI_VERIFY_API_URL);
export const isCargoDamageCheckConfigured = Boolean(AI_CARGO_DAMAGE_API_URL);
export const isIdentityCheckConfigured = Boolean(AI_IDENTITY_CHECK_API_URL);

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

/**
 * Advisory-only comparison of a cargo's pickup vs. delivery photo (Google
 * Gemini, called server-side from vercel-blob-api/api/analyze-cargo-damage.js).
 * Meant to help a human review a damage dispute, not to settle one.
 */
export async function analyzeCargoDamage(pickupPhotoUrl: string, deliveryPhotoUrl: string): Promise<CargoDamageReport> {
  if (!AI_CARGO_DAMAGE_API_URL) {
    throw new Error('Cargo damage check is not configured — missing VITE_AI_CARGO_DAMAGE_API_URL.');
  }
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('You must be signed in to run this check.');

  const res = await fetch(AI_CARGO_DAMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, pickupPhotoUrl, deliveryPhotoUrl }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || 'Cargo damage check failed');
  return body as CargoDamageReport;
}

/**
 * Advisory-only pre-check comparing a live selfie to the driver's license
 * photo on file (Google Gemini, called server-side from
 * vercel-blob-api/api/verify-driver-identity.js). NOT a biometric or legal
 * identity determination -- meant to flag obvious mismatches for a human to
 * follow up on, not to gate trip access automatically.
 */
export async function verifyDriverIdentity(selfieUrl: string, licenseUrl: string): Promise<IdentityCheckResult> {
  if (!AI_IDENTITY_CHECK_API_URL) {
    throw new Error('Identity check is not configured — missing VITE_AI_IDENTITY_CHECK_API_URL.');
  }
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('You must be signed in to run this check.');

  const res = await fetch(AI_IDENTITY_CHECK_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, selfieUrl, licenseUrl }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || 'Identity check failed');
  return body as IdentityCheckResult;
}
