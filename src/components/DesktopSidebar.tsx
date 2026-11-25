'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Member, MemberWithStatus, Message, Room, BACKGROUND_THEMES, ChecklistItem } from '@/types';
import {
  Pin,
  Settings,
  Bell,
  BellOff,
  LogOut,
  Check,
  Image as ImageIcon,
  Trash2,
  Camera,
  Palette,
  Users,
  Smartphone,
  Download,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-date';
import { compressImage } from '@/lib/image-utils';
import ZinoAvatar from './ZinoAvatar';
import HouseholdChecklist from './HouseholdChecklist';
import { ZINO_STATUSES, ZINO_GREETING_TOAST } from '@/lib/zino-bot';

interface DesktopSidebarProps {
  currentMember: Member;
  room: Room;
  membersWithStatus: MemberWithStatus[];
  messages: Message[];
  currentThemeId: string;
  customBackgroundUrl: string | null;
  soundEnabled: boolean;
  checklistItems?: ChecklistItem[];
  onAddChecklistItem?: (text: string) => Promise<void>;
  onToggleChecklistItem?: (itemId: string) => Promise<void>;
  onDeleteChecklistItem?: (itemId: string) => Promise<void>;
  onToggleSound: () => void;
  onSelectTheme: (themeId: string) => void;
  onSetCustomBackground: (url: string | null) => void;
  onOpenSettings: () => void;
  onOpenPinnedNotice: () => void;
  onSwitchUser: () => void;
  onImageClick: (url: string) => void;
}

export default function DesktopSidebar({
  currentMember,
  room,
  membersWithStatus,
  messages,
  currentThemeId,
  customBackgroundUrl,
  soundEnabled,
  checklistItems,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  onToggleSound,
  onSelectTheme,
  onSetCustomBackground,
  onOpenSettings,
  onOpenPinnedNotice,
  onSwitchUser,
  onImageClick,
}: DesktopSidebarProps) {
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [zinoStatusIndex, setZinoStatusIndex] = useState(0);
  const [zinoToast, setZinoToast] = useState(false);

  // Rotate Zino's status every 45s without any DB writes
  useEffect(() => {
    const timer = setInterval(() => {
      setZinoStatusIndex((prev) => (prev + 1) % ZINO_STATUSES.length);
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  const handleZinoClick = () => {
    setZinoToast(true);
    setTimeout(() => setZinoToast(false), 3000);
  };

  const onlineMembers = membersWithStatus.filter((m) => m.isOnline);
  const offlineMembers = membersWithStatus.filter((m) => !m.isOnline);

  // Extract shared images from messages
  const sharedImages = messages
    .filter((m) => Boolean(m.image_url))
    .map((m) => m.image_url!)
    .reverse();

  const handleCustomBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 900, 900, 0.7);
        onSetCustomBackground(compressed);
      } catch (err) {
        console.error('Custom bg error:', err);
      }
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-80 lg:w-[350px] border-l border-[var(--border)]/40 bg-[var(--bg-surface)]/85 backdrop-blur-xl h-full overflow-y-auto select-none p-4 space-y-3.5 smooth-scroll text-[var(--text-primary)] shadow-xs">
      {/* 1. User Profile & Quick Actions */}
      <div className="p-3.5 bg-black/20 rounded-2xl border border-[var(--border)]/40 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center text-[#1B0C1A] font-bold text-sm shadow-2xs flex-shrink-0 ring-2 ring-white/20"
            style={{ backgroundColor: currentMember.avatar_color }}
          >
            {currentMember.avatar_url ? (
              <img
                src={currentMember.avatar_url}
                alt={currentMember.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{currentMember.display_name.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-[var(--text-primary)] truncate flex items-center gap-1.5">
              <span>{currentMember.display_name}</span>
              {currentMember.nickname && (
                <span className="text-[11px] text-[var(--text-muted)] font-semibold truncate">
                  ({currentMember.nickname})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--accent)] font-semibold mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
              <span>متصل في «لَمّة»</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Toolbar */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--accent)] transition active:scale-95"
            title={soundEnabled ? 'صوت الإشعارات مفعل' : 'صوت الإشعارات مكتوم'}
          >
            {soundEnabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4 text-[#F28482]" />
            )}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--accent)] transition active:scale-95"
            title="الإعدادات والمظهر"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onSwitchUser}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-[#F28482]/20 hover:text-[#F28482] transition active:scale-95"
            title="تبديل الحساب / تسجيل خروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Standalone App Download Card (Lamma APK) */}
      <div className="p-3 bg-gradient-to-r from-[var(--bubble-outgoing)]/40 to-[var(--bg-surface)] rounded-2xl border border-[var(--border)]/50 shadow-2xs flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[var(--bubble-outgoing)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 shadow-2xs border border-[var(--border)]/40">
            <Smartphone className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-[var(--text-primary)] truncate">
              تطبيق «لَمّة» للهاتف (APK)
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">
              تطبيق مستقل وسريع للأندرويد
            </div>
          </div>
        </div>
        <a
          href="/lamma.apk"
          download="lamma.apk"
          className="px-3 py-1.5 rounded-xl bg-[var(--bubble-outgoing)] hover:opacity-90 text-[var(--accent)] text-[11px] font-bold shadow-2xs flex items-center gap-1.5 transition active:scale-95 flex-shrink-0 border border-[var(--border)]/50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تحميل</span>
        </a>
      </div>

      {/* 3. Pinned Family Notice */}
      <div className="p-3.5 bg-black/20 rounded-2xl border border-[var(--border)]/40 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--accent)]">
          <div className="flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 fill-current text-[var(--accent)]" />
            <span>التنبيه العائلي المثبت</span>
          </div>
          <button
            type="button"
            onClick={onOpenPinnedNotice}
            className="text-[10px] font-bold text-[var(--accent)] hover:underline"
          >
            {room.pinned_notice ? 'تعديل' : 'إضافة'}
          </button>
        </div>

        {room.pinned_notice ? (
          <div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed break-words font-medium">
              {room.pinned_notice}
            </p>
            {room.pinned_by && (
              <div className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center justify-between">
                <span>ثبته: {room.pinned_by}</span>
                {room.pinned_at && <span>{formatRelativeTime(room.pinned_at)}</span>}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-[var(--text-muted)] italic">
            لا يوجد تنبيه عائلي مثبت حالياً. يمكنك تثبيت تذكير أو موعد لجميع أفراد الأسرة.
          </p>
        )}
      </div>

      {/* 4. Exclusive 2 Themes Switcher */}
      <div className="p-3.5 bg-black/20 rounded-2xl border border-[var(--border)]/40 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>سمة «لَمّة» الحصرية</span>
          </span>
          {customBackgroundUrl && (
            <button
              type="button"
              onClick={() => {
                onSetCustomBackground(null);
                onSelectTheme('sakura-dusk');
              }}
              className="text-[10px] text-[#F28482] hover:underline flex items-center gap-0.5"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>إزالة الخلفية</span>
            </button>
          )}
        </div>

        {/* 2 Themes Grid */}
        <div className="grid grid-cols-2 gap-2">
          {BACKGROUND_THEMES.map((theme) => {
            const isSelected =
              currentThemeId === theme.id && !customBackgroundUrl;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  onSetCustomBackground(null);
                  onSelectTheme(theme.id);
                }}
                className={`flex flex-col items-start p-2.5 rounded-xl border transition active:scale-95 text-right ${
                  isSelected
                    ? 'border-[var(--accent)] bg-black/40 ring-1.5 ring-[var(--accent)]/50'
                    : 'border-[var(--border)]/40 bg-black/15 hover:bg-black/25'
                }`}
                title={theme.name}
              >
                <div className="w-full flex items-center justify-between mb-1.5">
                  <div
                    className="w-5 h-5 rounded-full shadow-2xs border border-white/20 flex items-center justify-center"
                    style={{ backgroundColor: theme.colorPreview }}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-[var(--accent)] stroke-[3]" />
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-[var(--text-muted)]">
                    {theme.id === 'sakura-dusk' ? 'افتراضي' : 'ليلي'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[var(--text-primary)] truncate w-full">
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Wallpaper Upload Button */}
        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          onChange={handleCustomBg}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => bgInputRef.current?.click()}
          className="w-full py-2 px-2.5 rounded-xl border border-dashed border-[var(--border)]/50 bg-black/10 hover:bg-black/20 text-[11px] font-semibold text-[var(--text-muted)] transition flex items-center justify-center gap-1.5"
        >
          <ImageIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>
            {customBackgroundUrl ? 'تغيير صورة الخلفية' : 'اختيار صورة خلفية من جهازك'}
          </span>
        </button>
      </div>

      {/* 5. Shared Household Checklist (نواقص البيت) */}
      {onAddChecklistItem && onToggleChecklistItem && onDeleteChecklistItem && (
        <div className="p-3.5 bg-black/20 rounded-2xl border border-[var(--border)]/40 shadow-2xs">
          <HouseholdChecklist
            items={checklistItems || []}
            currentMember={currentMember}
            onAddItem={onAddChecklistItem}
            onToggleItem={onToggleChecklistItem}
            onDeleteItem={onDeleteChecklistItem}
            isCompact={true}
          />
        </div>
      )}

      {/* 6. Family Members + Our Siamese Cat ZINO */}
      <div className="p-3.5 bg-black/20 rounded-2xl border border-[var(--border)]/40 shadow-2xs space-y-2 flex-1 relative">
        {/* Zino Click Toast */}
        {zinoToast && (
          <div className="absolute top-2 left-2 right-2 z-30 p-2 rounded-xl bg-[var(--bubble-outgoing)] text-[var(--accent)] text-xs font-bold text-center border border-[var(--border)] shadow-lg animate-in fade-in zoom-in-95">
            {ZINO_GREETING_TOAST}
          </div>
        )}

        <div className="flex items-center justify-between text-xs font-bold text-[var(--accent)]">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>أفراد العائلة</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-[var(--accent)] font-bold border border-[var(--border)]/40">
            {onlineMembers.length} متصل
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 smooth-scroll text-xs">
          {/* SPECIAL PASSIVE FAMILY MEMBER: Our Siamese Cat ZINO (زينو) */}
          <div
            onClick={handleZinoClick}
            className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-[#3B2820]/30 to-[#251824]/40 border border-[#F5E6D3]/30 cursor-pointer hover:border-[#5BC0EB]/60 transition active:scale-98 shadow-2xs group/zino"
            title="انقر لتلقي سلام من زينو!"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ZinoAvatar size={28} />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#F5E6D3] group-hover/zino:text-[#5BC0EB] transition">
                    زينو (Zino)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#3B2820]/60 text-[#F5E6D3] border border-[#F5E6D3]/20">
                    قط العائلة 🐾
                  </span>
                </div>
                <div className="text-[9.5px] text-[#5BC0EB] font-medium mt-0.5">
                  {ZINO_STATUSES[zinoStatusIndex]}
                </div>
              </div>
            </div>
            <span className="text-xs group-hover/zino:scale-125 transition-transform select-none">
              🐱
            </span>
          </div>

          {/* Online Human Members */}
          {onlineMembers.map(({ member }) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 rounded-xl bg-black/25 border border-[var(--border)]/30 shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[#1B0C1A] text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: member.avatar_color }}
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{member.display_name.charAt(0)}</span>
                  )}
                </div>
                <div className="truncate">
                  <span className="font-semibold text-xs text-[var(--text-primary)]">
                    {member.display_name}
                  </span>
                  {member.nickname && (
                    <span className="text-[9.5px] text-[var(--text-muted)] mr-1">
                      ({member.nickname})
                    </span>
                  )}
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse flex-shrink-0"></span>
            </div>
          ))}

          {/* Offline Human Members */}
          {offlineMembers.map(({ member, lastSeenText }) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 rounded-xl bg-black/10 border border-[var(--border)]/20 opacity-70"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[#1B0C1A] text-[10px] font-bold flex-shrink-0 grayscale"
                  style={{ backgroundColor: member.avatar_color }}
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{member.display_name.charAt(0)}</span>
                  )}
                </div>
                <div className="truncate">
                  <span className="text-xs text-[var(--text-muted)]">
                    {member.display_name}
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-[var(--text-muted)] truncate">
                {lastSeenText}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Shared Family Photos Gallery Preview */}
      {sharedImages.length > 0 && (
        <div className="p-3.5 bg-black/20 rounded-2xl border border-[var(--border)]/40 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--accent)]">
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>ألبوم صور «لَمّة» ({sharedImages.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {sharedImages.slice(0, 8).map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onImageClick(url)}
                className="aspect-square rounded-xl overflow-hidden border border-[var(--border)]/40 hover:opacity-90 active:scale-95 transition shadow-2xs"
              >
                <img
                  src={url}
                  alt="صورة عائلية"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
