/**
 * Desktop Force-Alert & Audio Synthesis for «لَمّة»
 * Web Audio API unlock on first click: resonant triple-chime (659Hz -> 880Hz -> 1046Hz).
 * Native OS Notification with requireInteraction: true.
 * Flashing document.title when unfocused.
 */

let sharedAudioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  return sharedAudioCtx;
}

/**
 * Unlock Web Audio API on user interaction and resume seamlessly across tab wakeups
 */
export function initAudioUnlock() {
  if (typeof window === 'undefined') return;

  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          isAudioUnlocked = true;
        }).catch(() => {});
      } else {
        isAudioUnlocked = true;
      }
    }
  };

  // Keep listeners active so background tab sleep or browser audio throttling can always be recovered
  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });

  // Auto-resume when returning to the tab
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().then(() => {
            isAudioUnlocked = true;
          }).catch(() => {});
        }
      }
    });
  }
}

/**
 * Resonant double/triple chime (659Hz -> 880Hz -> 1046Hz) using Web Audio API synthesis.
 * Zero external MP3 dependencies, works reliably offline.
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const isSoundEnabled = localStorage.getItem('family_chat_sound_enabled') !== 'false';
    if (!isSoundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Note 1: 659Hz (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: 880Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.09);
    gain2.gain.setValueAtTime(0.09, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.45);

    // Note 3: 1046Hz (C6) - resonant high harmonic
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1046.5, now + 0.18);
    gain3.gain.setValueAtTime(0.1, now + 0.18);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.18);
    osc3.stop(now + 0.55);
  } catch {
    // Gracefully ignore audio policies
  }
}

/* ═══════════════════════════════════════════════════════════════
   Desktop Force-Alert: Native Notification & Title Flashing
   ═══════════════════════════════════════════════════════════════ */

let titleFlashTimer: ReturnType<typeof setInterval> | null = null;
let originalTitle = typeof document !== 'undefined' ? document.title : 'لَمّة - محادثة العائلة';
let isFlashing = false;

export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

/**
 * Trigger native OS notification with requireInteraction: true
 */
export function triggerDesktopNotification(senderName: string, textPreview: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(`🔴 لَمّة: ${senderName}`, {
      body: textPreview.length > 80 ? textPreview.slice(0, 77) + '...' : textPreview,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'lamma-incoming-message',
      requireInteraction: true,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch {
    // Ignore notification errors
  }
}

/**
 * Flash document.title until window gets focused
 */
export function startTitleFlash(flashText = '🔴 (1) رسالة جديدة في لَمّة! ⚡') {
  if (typeof window === 'undefined') return;
  if (isFlashing) return;

  if (document.title && !document.title.includes('🔴')) {
    originalTitle = document.title;
  }

  isFlashing = true;
  let toggle = false;

  titleFlashTimer = setInterval(() => {
    document.title = toggle ? flashText : originalTitle;
    toggle = !toggle;
  }, 900);
}

export function stopTitleFlash() {
  if (typeof window === 'undefined') return;
  if (titleFlashTimer) {
    clearInterval(titleFlashTimer);
    titleFlashTimer = null;
  }
  isFlashing = false;
  if (originalTitle) {
    document.title = originalTitle;
  }
}

/**
 * Check if the window is currently unfocused / hidden
 */
export function isWindowUnfocused(): boolean {
  if (typeof document === 'undefined') return false;
  return document.hidden || !document.hasFocus();
}

