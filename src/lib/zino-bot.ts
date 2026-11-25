/**
 * Special Passive Family Member: Our Siamese Cat «زينو» (Zino)
 * - Purely client-side representation, zero database writes.
 * - Rotating whimsical statuses.
 * - Interactive meow toast.
 */

export const ZINO_MEMBER_ID = 'zino-siamese-cat';

export const ZINO_STATUSES = [
  'نائم حالياً 💤',
  'يراقب المحادثة 👀',
  'ينتظر الطعام 🐟',
] as const;

export interface ZinoInfo {
  id: string;
  display_name: string;
  nickname: string;
  badge: string;
  avatar_color: string;
  isOnline: boolean;
}

export const ZINO_PROFILE: ZinoInfo = {
  id: ZINO_MEMBER_ID,
  display_name: 'زينو',
  nickname: 'القط السيامي',
  badge: 'قط العائلة 🐾',
  avatar_color: '#3B2820',
  isOnline: true,
};

/**
 * Returns current status from rotating list based on time (rotates every 25 seconds).
 * Zero DB writes!
 */
export function getZinoCurrentStatus(): string {
  if (typeof window === 'undefined') return ZINO_STATUSES[0];
  const cycleIndex = Math.floor(Date.now() / 25000) % ZINO_STATUSES.length;
  return ZINO_STATUSES[cycleIndex];
}

/**
 * Zino click toast message
 */
export const ZINO_GREETING_TOAST = 'مياو! زينو يسلّم عليكم 🐾';
