'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;
    if (isStandalone) return;

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If dismissed recently, respect for this session
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (!dismissed) {
      setTimeout(() => setShowBanner(true), 3500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 max-w-sm bg-[var(--bg-surface)] backdrop-blur-md border border-[var(--border-subtle)] p-3 rounded-[14px] text-xs text-[var(--text-primary)] select-none">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-primary)] text-[var(--text-primary)] flex items-center justify-center flex-shrink-0 border border-[var(--border-subtle)]">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-xs text-[var(--text-primary)]">تطبيق أندرويد للهاتف (APK)</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              تطبيق هاتف أصلي خفيف وسريع ومرتبط بالمحادثة المباشرة
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition"
          title="إغلاق"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {showIOSTip ? (
        <div className="mt-2.5 p-2 bg-[var(--bg-canvas)] rounded-[10px] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] leading-relaxed">
          📱 للتثبيت على iPhone: اضغط على زر المشاركة <span className="font-semibold text-[var(--text-primary)]">⎋</span> في أسفل المتصفح، ثم اختر <span className="font-semibold text-[var(--text-primary)]">«إضافة إلى الشاشة الرئيسية»</span>.
        </div>
      ) : (
        <div className="mt-2.5 flex items-center justify-between gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium"
          >
            لاحقاً
          </button>

          <div className="flex items-center gap-1.5">
            <a
              href="/lamma.apk"
              download="lamma.apk"
              onClick={handleDismiss}
              className="px-3.5 py-1.5 rounded-[10px] bg-[var(--accent-primary)] hover:opacity-90 text-[var(--text-primary)] text-[11px] font-medium flex items-center gap-1.5 transition active:scale-95 border border-[var(--border-subtle)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل تطبيق الهاتف (ملف APK)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
