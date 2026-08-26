import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export interface UploadProgressHandlers {
  onProgress?: (percent: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Uploads a driver document to /driverDocuments/{uid}/{docType}-{filename}
 * and resolves with the public download URL once complete.
 */
export function uploadDriverDocument(
  uid: string,
  docType: string,
  file: File,
  handlers: UploadProgressHandlers = {}
): Promise<string> {
  const path = `driverDocuments/${uid}/${docType}-${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        handlers.onProgress?.(percent);
      },
      (error) => {
        handlers.onError?.(error);
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}
