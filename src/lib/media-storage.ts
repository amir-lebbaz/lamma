/**
 * Zero-Database-Quota Photo Architecture for «لَمّة» (Lamma)
 *
 * Supabase Free Tier Constraint:
 * NEVER store permanent large Base64 blobs in PostgreSQL!
 *
 * Solution:
 * 1. Compress photos via HTML5 Canvas (max 900px, 0.72 quality).
 * 2. Store all received and sent image blobs locally in IndexedDB ('lamma-media-db').
 * 3. Transfer images via ephemeral Realtime Broadcast / temporary payload that auto-purges
 *    image data from Supabase within seconds of delivery, leaving only a lightweight stub ('media-stub:<image_id>').
 * 4. Render clean fallback card («صورة محفوظة على أجهزة العائلة») if payload has been purged and not cached.
 * 5. Provide 'مسح الصور المحفوظة محلياً' (Clear Local Media Cache) and 'حفظ في الاستوديو' (Save to Gallery/Download).
 */

const DB_NAME = 'lamma-media-db';
const STORE_NAME = 'media';
const DB_VERSION = 1;

export interface StoredMediaItem {
  imageId: string;
  dataUrl: string;
  timestamp: number;
  sizeBytes?: number;
}

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'imageId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open media database'));
  });
}

/**
 * Save an image dataUrl locally to IndexedDB
 */
export async function saveMediaLocally(imageId: string, dataUrl: string): Promise<void> {
  if (typeof window === 'undefined' || !imageId || !dataUrl) return;

  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const item: StoredMediaItem = {
        imageId,
        dataUrl,
        timestamp: Date.now(),
        sizeBytes: dataUrl.length,
      };
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('saveMediaLocally error, using memory fallback:', err);
    try {
      sessionStorage.setItem(`lamma_media_${imageId}`, dataUrl);
    } catch {}
  }
}

/**
 * Retrieve an image dataUrl from local IndexedDB
 */
export async function getMediaLocally(imageId: string): Promise<string | null> {
  if (typeof window === 'undefined' || !imageId) return null;

  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(imageId);
      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve(req.result.dataUrl);
        } else {
          // Check session fallback
          const fallback = sessionStorage.getItem(`lamma_media_${imageId}`);
          resolve(fallback);
        }
      };
      req.onerror = () => {
        const fallback = sessionStorage.getItem(`lamma_media_${imageId}`);
        resolve(fallback);
      };
    });
  } catch {
    return sessionStorage.getItem(`lamma_media_${imageId}`);
  }
}

/**
 * Count how many photos are stored in the local cache
 */
export async function getLocalMediaCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/**
 * Clear the local media cache in IndexedDB
 */
export async function clearLocalMediaCache(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();
      countReq.onsuccess = () => {
        const count = countReq.result || 0;
        store.clear();
        tx.oncomplete = () => {
          // Also clear any session items
          try {
            Object.keys(sessionStorage).forEach((k) => {
              if (k.startsWith('lamma_media_')) sessionStorage.removeItem(k);
            });
          } catch {}
          resolve(count);
        };
      };
      countReq.onerror = () => {
        store.clear();
        tx.oncomplete = () => resolve(0);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('clearLocalMediaCache error:', err);
    return 0;
  }
}

/**
 * Canvas compression: max 900px, 0.72 quality
 */
export async function compressPhotoForTransfer(
  file: File,
  maxDimension = 900,
  quality = 0.72
): Promise<{ dataUrl: string; imageId: string }> {
  return new Promise((resolve, reject) => {
    const imageId = 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const raw = e.target?.result as string;
          resolve({ dataUrl: raw, imageId });
          return;
        }

        // Enable smooth image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ dataUrl, imageId });
      };

      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Save to Gallery or Download to device
 */
export function saveToGalleryOrDownload(dataUrl: string, filename = 'lamma-family-photo.jpg') {
  if (typeof window === 'undefined' || !dataUrl) return;

  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Download error:', err);
    // Open in new tab fallback for mobile browsers
    window.open(dataUrl, '_blank');
  }
}
