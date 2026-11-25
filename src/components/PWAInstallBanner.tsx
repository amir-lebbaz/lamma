'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA or in-app already
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

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 max-w-sm bg-white/95 backdrop-blur-md border border-[#C8E0CF] p-3 rounded-2xl shadow-xl animate-in slide-in-from-bottom-5 text-xs text-[#2D3E30] select-none">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EAF1EA] text-[#415F45] flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-[#2D3E30]">تطبيق أندرويد للهاتف (APK)</div>
            <div className="text-[10px] text-[#5A7360] mt-0.5">
              تطبيق هاتف أصلي خفيف وسريع ومرتبط بالمحادثة المباشرة
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-[#8E8071] hover:bg-black/5 transition"
          title="إغلاق"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {showIOSTip ? (
        <div className="mt-2.5 p-2 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] text-[10px] text-[#554438] leading-relaxed">
          📱 للتثبيت على iPhone: اضغط على زر المشاركة <span className="font-bold">⎋</span> في أسفل المتصفح، ثم اختر <span className="font-bold">«إضافة إلى الشاشة الرئيسية»</span>.
        </div>
      ) : (
        <div className="mt-2.5 flex items-center justify-between gap-1.5 pt-1 border-t border-[#F0EBE1]">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-2 py-1 text-[11px] text-[#8E8071] hover:text-[#554438] font-semibold"
          >
            لاحقاً
          </button>

          <div className="flex items-center gap-1.5">
            <a
              href="/lamma.apk"
              download="lamma.apk"
              onClick={handleDismiss}
              className="px-3.5 py-1.5 rounded-xl bg-[#415F45] hover:bg-[#344D37] text-white text-[11px] font-bold shadow-2xs flex items-center gap-1.5 transition active:scale-95"
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
