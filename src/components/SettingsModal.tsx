'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Member, AVATAR_COLORS, BACKGROUND_THEMES } from '@/types';
import {
  X,
  Camera,
  Check,
  Palette,
  User,
  Image as ImageIcon,
  Trash2,
  LogOut,
  Bell,
  BellOff,
  Type,
  Smartphone,
  Download,
  HardDrive,
} from 'lucide-react';
import { compressImage } from '@/lib/image-utils';
import { clearLocalMediaCache, getLocalMediaCount } from '@/lib/media-storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMember: Member;
  currentThemeId: string;
  customBackgroundUrl: string | null;
  onUpdateProfile: (updated: {
    displayName: string;
    nickname: string | null;
    avatarColor: string;
    avatarUrl: string | null;
  }) => Promise<void>;
  onSelectTheme: (themeId: string) => void;
  onSetCustomBackground: (url: string | null) => void;
  onSwitchUser: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  currentMember,
  currentThemeId,
  customBackgroundUrl,
  onUpdateProfile,
  onSelectTheme,
  onSetCustomBackground,
  onSwitchUser,
}: SettingsModalProps) {
  const [displayName, setDisplayName] = useState(currentMember.display_name);
  const [nickname, setNickname] = useState(currentMember.nickname || '');
  const [avatarColor, setAvatarColor] = useState(currentMember.avatar_color);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentMember.avatar_url || null);
  const [selectedTheme, setSelectedTheme] = useState(
    currentThemeId === 'velvet-ink' ? 'velvet-ink' : 'sakura-dusk'
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [largeTextMode, setLargeTextMode] = useState(false);
  const [cachedMediaCount, setCachedMediaCount] = useState<number>(0);
  const [cacheFeedback, setCacheFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('family_chat_sound_enabled');
      if (stored !== null) {
        setSoundEnabled(stored !== 'false');
      }

      const storedLargeText = localStorage.getItem('lamma_large_text_mode');
      const isLarge = storedLargeText === 'true';
      setLargeTextMode(isLarge);
      if (isLarge) {
        document.documentElement.classList.add('large-text-mode');
      }

      // Check count of locally cached photos
      getLocalMediaCount().then(setCachedMediaCount).catch(() => {});
    }
  }, []);

  const handleClearCache = async () => {
    if (confirm('هل تريد مسح الصور المحفوظة محلياً على هذا الجهاز؟ لن يؤثر ذلك على رسائل المحادثة.')) {
      const count = await clearLocalMediaCache();
      setCachedMediaCount(0);
      setCacheFeedback(`تم مسح ${count} صورة من الذاكرة بنجاح`);
      setTimeout(() => setCacheFeedback(null), 3000);
    }
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('family_chat_sound_enabled', String(nextVal));
  };

  const toggleLargeText = () => {
    const nextVal = !largeTextMode;
    setLargeTextMode(nextVal);
    localStorage.setItem('lamma_large_text_mode', String(nextVal));
    if (nextVal) {
      document.documentElement.classList.add('large-text-mode');
    } else {
      document.documentElement.classList.remove('large-text-mode');
    }
  };

  if (!isOpen) return null;

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('يرجى اختيار ملف صورة صالح');
        return;
      }
      try {
        const compressed = await compressImage(file, 400, 400, 0.85);
        setAvatarUrl(compressed);
        setError('');
      } catch (err) {
        console.error('Avatar read error:', err);
        setError('تعذر قراءة الصورة');
      }
    }
  };

  const handleCustomBgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 900, 900, 0.7);
        onSetCustomBackground(compressed);
        setSelectedTheme('custom');
      } catch (err) {
        console.error('Background read error:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('يرجى كتابة الاسم');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateProfile({
        displayName: trimmedName,
        nickname: nickname.trim() || null,
        avatarColor,
        avatarUrl,
      });
      onSelectTheme(selectedTheme);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[#251824] text-[#FADCD5] rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-[#765D67]/40 space-y-4 max-h-[90vh] overflow-y-auto pb-safe animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 smooth-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#765D67]/30">
          <h2 className="font-bold text-base text-[#FADCD5] flex items-center gap-2">
            <span>إعدادات «لَمّة» والمظهر</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#B5B9BC] hover:bg-[#342433] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. Avatar Photo & Color */}
          <div className="flex flex-col items-center justify-center py-2 bg-[#2D1F2C] rounded-2xl border border-[#765D67]/30 p-4">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />

            <div className="relative mb-2.5">
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-white/20"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="صورة البروفايل"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {displayName ? (
                      displayName.charAt(0)
                    ) : (
                      <User className="w-8 h-8" />
                    )}
                  </span>
                )}
              </div>

              {/* Upload photo trigger button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#6D3C52] text-[#FADCD5] shadow-md hover:bg-[#854B65] active:scale-90 transition border border-[#765D67]/50"
                title="تغيير صورة البروفايل"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-[#FADCD5] font-semibold hover:underline"
              >
                {avatarUrl ? 'تغيير الصورة' : 'إضافة صورة بروفايل'}
              </button>
              {avatarUrl && (
                <>
                  <span className="text-[#765D67]">•</span>
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    className="text-[#F28482] hover:underline"
                  >
                    حذف الصورة
                  </button>
                </>
              )}
            </div>

            {/* 8 Avatar Color Swatches */}
            <div className="mt-3 w-full">
              <span className="block text-[11px] font-bold text-[#B5B9BC] mb-2 text-center">
                الألوان الرمزية الحصرية (8 ألوان)
              </span>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => {
                  const isSelected = avatarColor === color && !avatarUrl;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setAvatarColor(color);
                      }}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center text-[#1B0C1A] font-bold ${
                        isSelected
                          ? 'scale-120 ring-2 ring-offset-2 ring-offset-[#2D1F2C] ring-[#FADCD5] shadow-xs'
                          : 'opacity-85 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Name & Nickname */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#FADCD5] mb-1">
                الاسم
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="مثال: أحمد"
                maxLength={25}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#2D1F2C] border border-[#765D67]/40 text-[#FADCD5] placeholder-[#765D67] text-sm focus:outline-none focus:ring-2 focus:ring-[#6D3C52] transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#FADCD5]">
                  الكنية أو اللقب (اختياري)
                </label>
                <span className="text-[10px] text-[#765D67]">
                  تظهر بجانب اسمك
                </span>
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="مثال: أبو شهاب، أم محمد، الغالي..."
                maxLength={25}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#2D1F2C] border border-[#765D67]/40 text-[#FADCD5] placeholder-[#765D67] text-sm focus:outline-none focus:ring-2 focus:ring-[#6D3C52] transition"
              />
            </div>
          </div>

          {/* 3. Exclusive 2 Themes System */}
          <div className="pt-2 border-t border-[#765D67]/30 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#FADCD5] flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#FADCD5]" />
                <span>سمات «لَمّة» الحصرية (نظام الثيمين)</span>
              </label>
              {customBackgroundUrl && (
                <button
                  type="button"
                  onClick={() => {
                    onSetCustomBackground(null);
                    setSelectedTheme('sakura-dusk');
                    onSelectTheme('sakura-dusk');
                  }}
                  className="text-[11px] text-[#F28482] hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>إزالة الخلفية المخصصة</span>
                </button>
              )}
            </div>

            {/* The 2 Exclusive Themes */}
            <div className="grid grid-cols-2 gap-2.5">
              {BACKGROUND_THEMES.map((theme) => {
                const isSelected =
                  selectedTheme === theme.id && !customBackgroundUrl;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(theme.id);
                      onSetCustomBackground(null);
                      onSelectTheme(theme.id);
                    }}
                    className={`flex flex-col items-start p-3 rounded-2xl border transition-all text-right ${
                      isSelected
                        ? 'border-[#FADCD5] bg-[#3A2234] shadow-md ring-2 ring-[#FADCD5]/40'
                        : 'border-[#765D67]/30 bg-[#2D1F2C] hover:bg-[#342433]'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between mb-2">
                      <div
                        className="w-6 h-6 rounded-full border border-white/20 shadow-xs flex items-center justify-center"
                        style={{ backgroundColor: theme.colorPreview }}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#FADCD5] stroke-[3]" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/25 text-[#FADCD5]">
                        {theme.id === 'sakura-dusk' ? 'الافتراضي' : 'ليلي فخم'}
                      </span>
                    </div>
                    <span className="font-bold text-xs text-[#FADCD5] mb-0.5">
                      {theme.name}
                    </span>
                    <span className="text-[10px] text-[#765D67] line-clamp-1">
                      {theme.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Background Upload */}
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              onChange={handleCustomBgFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-[#765D67]/40 bg-[#2D1F2C] hover:bg-[#342433] text-xs font-semibold text-[#B5B9BC] transition flex items-center justify-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#FADCD5]" />
              <span>
                {customBackgroundUrl
                  ? 'تغيير صورة الخلفية المخصصة'
                  : 'اختيار صورة خلفية من جهازك'}
              </span>
            </button>
          </div>

          {/* 4. Large Text Mode (وضع الخط الكبير) */}
          <div className="p-3 rounded-2xl bg-[#2D1F2C] border border-[#765D67]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#6D3C52] text-[#FADCD5] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#FADCD5]">
                  وضع الخط الكبير
                </div>
                <div className="text-[10px] text-[#765D67]">
                  تكبير نصوص المحادثة لقراءة أسهل ومريحة للعين
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleLargeText}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                largeTextMode
                  ? 'bg-[#6D3C52] justify-start'
                  : 'bg-[#4B3B48] justify-end'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#FADCD5] shadow-2xs" />
            </button>
          </div>

          {/* 5. Sound Notification Toggle */}
          <div className="p-3 rounded-2xl bg-[#2D1F2C] border border-[#765D67]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#6D3C52] text-[#FADCD5] flex items-center justify-center flex-shrink-0 shadow-2xs">
                {soundEnabled ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4 text-[#F28482]" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-[#FADCD5]">
                  نغمة التنبيه
                </div>
                <div className="text-[10px] text-[#765D67]">
                  تشغيل رنين هادئ عند وصول رسائل جديدة
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                soundEnabled
                  ? 'bg-[#6D3C52] justify-start'
                  : 'bg-[#4B3B48] justify-end'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#FADCD5] shadow-2xs" />
            </button>
          </div>

          {/* 6. Mobile App Download Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-[#342433] to-[#2D1F2C] border border-[#765D67]/40 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#6D3C52] text-[#FADCD5] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#FADCD5] truncate">
                  تطبيق أندرويد للهاتف (APK)
                </div>
                <div className="text-[10px] text-[#765D67] truncate">
                  تطبيق أصلي وسريع للهواتف
                </div>
              </div>
            </div>
            <a
              href="/lamma.apk"
              download="lamma.apk"
              className="px-3 py-1.5 rounded-xl bg-[#6D3C52] hover:bg-[#854B65] text-[#FADCD5] text-xs font-bold shadow-2xs flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل</span>
            </a>
          </div>

          {/* 7. Clear Local Media Cache (مسح الصور المحفوظة محلياً) */}
          <div className="p-3 rounded-2xl bg-[#2D1F2C] border border-[#765D67]/30 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#6D3C52] text-[#FADCD5] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#FADCD5] truncate">
                  مسح الصور المحفوظة محلياً
                </div>
                <div className="text-[10px] text-[#765D67] truncate">
                  {cacheFeedback || `تفريغ ذاكرة الصور (${cachedMediaCount} صورة مخزنة)`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              className="px-2.5 py-1.5 rounded-xl border border-[#F28482]/40 bg-[#F28482]/10 hover:bg-[#F28482]/20 text-[#F28482] text-xs font-bold transition active:scale-95 flex-shrink-0"
              title="مسح ذاكرة الصور المؤقتة"
            >
              مسح الصور
            </button>
          </div>

          {error && (
            <div className="p-2.5 bg-[#4B2138] border border-[#F28482]/40 rounded-xl text-xs text-[#F28482] text-center font-bold">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-3 rounded-2xl border border-[#765D67]/40 text-xs font-bold text-[#B5B9BC] hover:bg-[#342433] transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-2/3 py-2.5 px-4 rounded-2xl bg-[#6D3C52] hover:bg-[#854B65] text-[#FADCD5] text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'جارِ الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>

        {/* Switch User / Logout link */}
        <div className="pt-2 border-t border-[#765D67]/30 flex items-center justify-between text-xs">
          <span className="text-[#765D67]">تسجيل الدخول باسم آخر؟</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchUser();
            }}
            className="text-[#F28482] font-bold hover:underline flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تبديل الحساب</span>
          </button>
        </div>
      </div>
    </div>
  );
}
