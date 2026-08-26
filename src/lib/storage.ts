import { upload } from '@vercel/blob/client';
import { auth } from '../firebase';

export interface UploadProgressHandlers {
  onProgress?: (percent: number) => void;
  onError?: (error: Error) => void;
}

const BLOB_UPLOAD_API_URL = import.meta.env.VITE_BLOB_UPLOAD_API_URL as string | undefined;

/**
 * Uploads a driver document to Vercel Blob at driverDocuments/{uid}/{docType}-{filename}
 * and resolves with the public URL once complete. The upload goes straight from the
 * browser to Blob storage; this app's server only issues a short-lived, path-scoped
 * token (see vercel-blob-api/api/upload-token.js) after verifying the caller's Firebase
 * ID token.
 */
export async function uploadDriverDocument(
  uid: string,
  docType: string,
  file: File,
  handlers: UploadProgressHandlers = {}
): Promise<string> {
  if (!BLOB_UPLOAD_API_URL) {
    const error = new Error('Document upload is not configured — missing VITE_BLOB_UPLOAD_API_URL.');
    handlers.onError?.(error);
    throw error;
  }

  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    const error = new Error('You must be signed in to upload documents.');
    handlers.onError?.(error);
    throw error;
  }

  const pathname = `driverDocuments/${uid}/${docType}-${Date.now()}-${file.name}`;

  try {
    const blob = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: BLOB_UPLOAD_API_URL,
      clientPayload: JSON.stringify({ idToken }),
      onUploadProgress: ({ percentage }) => handlers.onProgress?.(percentage),
    });
    return blob.url;
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Upload failed');
    handlers.onError?.(error);
    throw error;
  }
}
