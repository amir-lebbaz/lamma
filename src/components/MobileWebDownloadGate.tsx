'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Sparkles, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B0C1A]/95 backdrop-blur-xl animate-in fade-in duration-300 select-none">
      <div className="w-full max-w-sm bg-[#2D222F] border border-[#765D67]/40 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#6D3C52]/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#FADCD5]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Logo / Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#1B0C1A] border border-[#FADCD5]/20 flex items-center justify-center shadow-lg mb-4 overflow-hidden p-2">
          <img src="/icon.svg" alt="شعار لَمّة" className="w-full h-full object-contain" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B0C1A] border border-[#765D67]/50 text-[11px] font-medium text-[#FADCD5] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#FADCD5]" />
          <span>تطبيق الهاتف المخصص</span>
        </div>

        <h1 className="text-xl font-extrabold text-[#FADCD5] tracking-tight">
          حمّل تطبيق «لَمّة» للهاتف
        </h1>

        <p className="mt-2 text-xs text-[#BFA8B3] leading-relaxed">
          لتجربة محادثة عائلية حقيقية وسلسة بهاتف أندرويد مع وصول سريع وإشعارات فورية متصلة بالبيت.
        </p>

        {/* Feature Highlights */}
        <div className="my-5 grid grid-cols-2 gap-2 text-right">
          <div className="p-2.5 rounded-xl bg-[#1B0C1A]/60 border border-[#765D67]/30 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FADCD5] flex-shrink-0" />
            <div className="text-[11px] font-semibold text-[#FADCD5]">سريع وخفيف (1.1MB)</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#1B0C1A]/60 border border-[#765D67]/30 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FADCD5] flex-shrink-0" />
            <div className="text-[11px] font-semibold text-[#FADCD5]">محادثة خاصة ومحمية</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href="/lamma.apk"
            download="lamma.apk"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#6D3C52] hover:bg-[#854964] active:scale-98 text-[#FADCD5] font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition duration-200 border border-[#FADCD5]/20"
          >
            <Download className="w-4 h-4" />
            <span>تحميل تطبيق أندرويد (ملف APK)</span>
          </a>

          {isIOS ? (
            <div className="p-2.5 bg-[#1B0C1A]/80 rounded-xl border border-[#765D67]/40 text-[11px] text-[#BFA8B3]">
              📱 على iPhone: اضغط زر المشاركة <span className="font-bold text-[#FADCD5]">⎋</span> في المتصفح ثم اختر <span className="font-bold text-[#FADCD5]">«إضافة للشاشة الرئيسية»</span>.
            </div>
          ) : null}

          <div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-[#8E7582] hover:text-[#FADCD5] transition underline underline-offset-4 inline-flex items-center gap-1 pt-1"
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
