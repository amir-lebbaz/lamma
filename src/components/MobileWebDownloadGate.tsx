'use client';

import React, { useState, useEffect } from 'react';
import { Download, Sparkles, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';

export default function MobileWebDownloadGate() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (installed native app / PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setShouldShow(false);
      return;
    }

    // Check screen width (mobile < 768px)
    const isMobileViewport = window.innerWidth < 768;
    if (!isMobileViewport) {
      setShouldShow(false);
      return;
    }

    // Check if dismissed for this session
    const isDismissed = sessionStorage.getItem('dismiss_mobile_gate') === 'true';
    if (isDismissed) {
      setShouldShow(false);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    setShouldShow(true);

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShouldShow(false);
      } else if (!sessionStorage.getItem('dismiss_mobile_gate')) {
        setShouldShow(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('dismiss_mobile_gate', 'true');
    setShouldShow(false);
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-canvas)]/95 backdrop-blur-xl animate-in fade-in duration-300 select-none">
      <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[14px] p-6 text-center relative overflow-hidden">
        {/* Logo / Badge */}
        <div className="mx-auto w-14 h-14 rounded-[14px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-center mb-4 overflow-hidden p-2">
          <img src="/icon.svg" alt="شعار لَمّة" className="w-full h-full object-contain" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-primary)] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[var(--text-primary)]" />
          <span>تطبيق الهاتف المخصص</span>
        </div>

        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
          حمّل تطبيق «لَمّة» للهاتف
        </h1>

        <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed font-normal">
          لتجربة محادثة عائلية حقيقية وسلسة بهاتف أندرويد مع وصول سريع وإشعارات فورية متصلة بالبيت.
        </p>

        {/* Feature Highlights */}
        <div className="my-5 grid grid-cols-2 gap-2 text-right">
          <div className="p-2.5 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--text-primary)] flex-shrink-0" />
            <div className="text-[11px] font-medium text-[var(--text-primary)]">سريع وخفيف (3.8MB)</div>
          </div>
          <div className="p-2.5 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--text-primary)] flex-shrink-0" />
            <div className="text-[11px] font-medium text-[var(--text-primary)]">محادثة خاصة ومحمية</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href="/lamma.apk"
            download="lamma.apk"
            className="w-full py-3 px-4 rounded-[10px] bg-[var(--accent-primary)] hover:opacity-90 active:scale-98 text-[var(--text-primary)] font-medium text-sm flex items-center justify-center gap-2 transition duration-200 border border-[var(--border-subtle)]"
          >
            <Download className="w-4 h-4" />
            <span>تحميل تطبيق أندرويد (ملف APK)</span>
          </a>

          {isIOS ? (
            <div className="p-2.5 bg-[var(--bg-canvas)] rounded-[10px] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
              📱 على iPhone: اضغط زر المشاركة <span className="font-semibold text-[var(--text-primary)]">⎋</span> في المتصفح ثم اختر <span className="font-semibold text-[var(--text-primary)]">«إضافة للشاشة الرئيسية»</span>.
            </div>
          ) : null}

          <div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition underline underline-offset-4 inline-flex items-center gap-1 pt-1"
            >
              <span>أو تابع عبر المتصفح</span>
              <ArrowLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
