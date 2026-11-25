'use client';

import React, { useState } from 'react';
import { Member, AVATAR_COLORS } from '@/types';
import { chatService } from '@/lib/chat-service';
import {
  ArrowLeft,
  Check,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Smartphone,
  Download,
} from 'lucide-react';

interface EntryScreenProps {
  onAuthenticated: (member: Member) => void;
}

export default function EntryScreen({ onAuthenticated }: EntryScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setError('يرجى كتابة اسمك');
      return;
    }

    if (!password || password.trim().length < 4) {
      setError('كلمة السر يجب أن تتكون من 4 أحرف أو أرقام على الأقل');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let member: Member;
      if (mode === 'login') {
        member = await chatService.loginMember(trimmedName, password);
      } else {
        member = await chatService.registerMember(trimmedName, password, avatarColor);
      }
      onAuthenticated(member);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ غير متوقع، يرجى المحاولة ثانية');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-[100dvh] flex flex-col justify-between p-4 bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-y-auto pt-safe pb-safe theme-sakura-dusk"
      dir="rtl"
    >
      <div className="w-full max-w-sm mx-auto my-auto py-2">
        {/* Bespoke Logo & Brand Title */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[14px] overflow-hidden mb-2 border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
            <img src="/icon.svg" alt="لَمّة" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            لَمّة
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
            تواصل عائلي دافئ في مساحة خاصة ومستقلة
          </p>
        </div>

        {/* Entry Card */}
        <div className="bg-[var(--bg-surface)] rounded-[14px] p-5 border border-[var(--border-subtle)] space-y-4">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[var(--bg-canvas)] rounded-[10px] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 text-xs font-medium rounded-[10px] transition ${
                mode === 'login'
                  ? 'bg-[var(--accent-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 text-xs font-medium rounded-[10px] transition ${
                mode === 'register'
                  ? 'bg-[var(--accent-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Display Name Input */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
                الاسم
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="مثال: أمير، عمر، سارة..."
                  maxLength={25}
                  disabled={isLoading}
                  className="w-full pr-9 pl-3.5 py-2.5 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition disabled:opacity-50"
                  autoFocus
                />
                <User className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[var(--text-primary)]">
                  كلمة السر
                </label>
                {mode === 'register' && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    4 أحرف أو أرقام على الأقل
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pr-9 pl-9 py-2.5 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition disabled:opacity-50 text-right"
                />
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-0.5"
                  aria-label={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Avatar Color Picker (Only for Register) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
                  اختر لون رمزك الحصري
                </label>
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-[var(--bg-canvas)] rounded-[10px] border border-[var(--border-subtle)]">
                  {AVATAR_COLORS.map((color) => {
                    const isSelected = avatarColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAvatarColor(color)}
                        style={{ backgroundColor: color }}
                        disabled={isLoading}
                        className={`aspect-square rounded-full transition-transform flex items-center justify-center text-[#1B0C1A] font-bold ${
                          isSelected
                            ? 'scale-115 ring-2 ring-offset-2 ring-offset-[var(--bg-canvas)] ring-[var(--text-primary)]'
                            : 'opacity-85 hover:opacity-100 hover:scale-105'
                        }`}
                        aria-label={`اختيار اللون ${color}`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-2.5 bg-[#4B2138] border border-[#F28482]/40 rounded-[10px] text-xs text-[#F28482] text-center font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[var(--accent-primary)] hover:opacity-90 active:scale-[0.98] text-[var(--text-primary)] font-medium rounded-[10px] transition flex items-center justify-center gap-2 text-sm disabled:opacity-60 border border-[var(--border-subtle)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ التحقق...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>دخول إلى «لَمّة»</span>
                  <ArrowLeft className="w-4 h-4 -scale-x-100" />
                </>
              ) : (
                <>
                  <span>إنشاء الحساب والدخول</span>
                  <ArrowLeft className="w-4 h-4 -scale-x-100" />
                </>
              )}
            </button>
          </form>

          {/* Switch Mode Prompt */}
          <div className="text-center pt-1 border-t border-[var(--border-subtle)]">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium transition"
              >
                ليس لديك حساب؟ <span className="underline text-[var(--text-primary)]">إنشاء حساب جديد</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium transition"
              >
                لديك حساب بالفعل؟ <span className="underline text-[var(--text-primary)]">تسجيل الدخول</span>
              </button>
            )}
          </div>
        </div>

        {/* Direct APK Download Button on Welcome Screen */}
        <div className="mt-4 text-center">
          <a
            href="/lamma.apk"
            download="lamma.apk"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--bg-elevated)]/40 transition active:scale-95"
            title="تحميل ملف APK لتثبيت تطبيق لَمّة على هواتف أندرويد"
          >
            <Smartphone className="w-4 h-4 text-[var(--text-primary)]" />
            <span>تحميل تطبيق «لَمّة» للهاتف (ملف APK مباشر)</span>
            <Download className="w-3.5 h-3.5 text-[var(--text-primary)]" />
          </a>
        </div>
      </div>

      <footer className="text-center py-2 text-[11px] text-[var(--text-muted)]">
        🔒 محادثة عائلية خاصة ومحمية لحفظ خصوصية وهويات أفراد الأسرة
      </footer>
    </main>
  );
}
