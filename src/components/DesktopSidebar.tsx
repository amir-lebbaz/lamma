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
    <aside className="hidden md:flex flex-col w-80 lg:w-[350px] border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-xl h-full overflow-y-auto select-none p-4 space-y-3.5 smooth-scroll text-[var(--text-primary)]">
      {/* 1. User Profile & Quick Actions */}
      <div className="p-3 bg-[var(--bg-elevated)]/30 rounded-[14px] border border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-[#1B0C1A] font-bold text-sm flex-shrink-0 ring-1 ring-[var(--border-subtle)]"
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
            <div className="font-semibold text-sm text-[var(--text-primary)] truncate flex items-center gap-1.5">
              <span>{currentMember.display_name}</span>
              {currentMember.nickname && (
                <span className="text-[11px] text-[var(--text-muted)] font-normal truncate">
                  ({currentMember.nickname})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)] font-medium mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
              <span>متصل في «لَمّة»</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Toolbar */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition active:scale-95"
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
            className="p-1.5 rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition active:scale-95"
            title="الإعدادات والمظهر"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onSwitchUser}
            className="p-1.5 rounded-[10px] text-[var(--text-muted)] hover:bg-[#F28482]/20 hover:text-[#F28482] transition active:scale-95"
            title="تبديل الحساب / تسجيل خروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Standalone App Download Card (Lamma APK) */}
      <div className="p-2.5 bg-[var(--bg-elevated)]/40 rounded-[14px] border border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-[10px] bg-[var(--accent-primary)]/40 text-[var(--text-primary)] flex items-center justify-center flex-shrink-0 border border-[var(--border-subtle)]">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-xs text-[var(--text-primary)]">
              تطبيق «لَمّة» (APK)
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">
              تطبيق أندرويد مستقل وخفيف
            </div>
          </div>
        </div>
        <a
          href="/lamma.apk"
          download="lamma.apk"
          className="px-2.5 py-1.5 rounded-[10px] bg-[var(--accent-primary)] hover:opacity-90 text-[var(--text-primary)] text-[11px] font-medium flex items-center gap-1 transition active:scale-95 flex-shrink-0 border border-[var(--border-subtle)]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تحميل</span>
        </a>
      </div>

      {/* 3. Pinned Family Notice */}
      <div className="p-3.5 bg-[var(--bg-elevated)]/30 rounded-[14px] border border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
          <div className="flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 fill-current text-[var(--text-primary)]" />
            <span>التنبيه العائلي المثبت</span>
          </div>
          <button
            type="button"
            onClick={onOpenPinnedNotice}
            className="text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline"
          >
            {room.pinned_notice ? 'تعديل' : 'إضافة'}
          </button>
        </div>

        {room.pinned_notice ? (
          <div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed break-words font-normal">
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
      <div className="p-3.5 bg-[var(--bg-elevated)]/30 rounded-[14px] border border-[var(--border-subtle)] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[var(--text-primary)]" />
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
                className={`flex flex-col items-start p-2.5 rounded-[10px] border transition active:scale-95 text-right ${
                  isSelected
                    ? 'border-[var(--text-primary)]/50 bg-[var(--accent-primary)]/40 ring-1 ring-[var(--text-primary)]/30'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]/50'
                }`}
                title={theme.name}
              >
                <div className="w-full flex items-center justify-between mb-1.5">
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center"
                    style={{ backgroundColor: theme.colorPreview }}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-[var(--text-primary)] stroke-[3]" />
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-[var(--text-muted)]">
                    {theme.id === 'sakura-dusk' ? 'افتراضي' : 'ليلي'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate w-full">
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
          className="w-full py-2 px-2.5 rounded-[10px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]/40 text-[11px] font-medium text-[var(--text-muted)] transition flex items-center justify-center gap-1.5"
        >
          <ImageIcon className="w-3.5 h-3.5 text-[var(--text-primary)]" />
          <span>
            {customBackgroundUrl ? 'تغيير صورة الخلفية' : 'اختيار صورة خلفية من جهازك'}
          </span>
        </button>
      </div>

      {/* 5. Shared Household Checklist (نواقص البيت) */}
      {onAddChecklistItem && onToggleChecklistItem && onDeleteChecklistItem && (
        <div className="p-3.5 bg-[var(--bg-elevated)]/30 rounded-[14px] border border-[var(--border-subtle)]">
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
      <div className="p-3.5 bg-[var(--bg-elevated)]/30 rounded-[14px] border border-[var(--border-subtle)] space-y-2 flex-1 relative">
        {/* Zino Click Toast */}
        {zinoToast && (
          <div className="absolute top-2 left-2 right-2 z-30 p-2 rounded-[10px] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-semibold text-center border border-[var(--border-subtle)] animate-in fade-in zoom-in-95">
            {ZINO_GREETING_TOAST}
          </div>
        )}

        <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--text-primary)]" />
            <span>أفراد العائلة</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] font-medium border border-[var(--border-subtle)]">
            {onlineMembers.length} متصل
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 smooth-scroll text-xs">
          {/* SPECIAL PASSIVE FAMILY MEMBER: Our Siamese Cat ZINO (زينو) */}
          <div
            onClick={handleZinoClick}
            className="flex items-center justify-between p-2 rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--bg-elevated)]/50 transition active:scale-98 group/zino"
            title="انقر لتلقي سلام من زينو!"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ZinoAvatar size={28} />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-[var(--text-primary)]">
                    زينو (Zino)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                    قط العائلة 🐾
                  </span>
                </div>
                <div className="text-[9.5px] text-[var(--text-muted)] font-normal mt-0.5">
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
              className="flex items-center justify-between p-2 rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[#1B0C1A] text-[10px] font-bold flex-shrink-0 ring-1 ring-[var(--border-subtle)]"
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
                  <span className="font-medium text-xs text-[var(--text-primary)]">
                    {member.display_name}
                  </span>
                  {member.nickname && (
                    <span className="text-[9.5px] text-[var(--text-muted)] mr-1">
                      ({member.nickname})
                    </span>
                  )}
                </div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0"></span>
            </div>
          ))}

          {/* Offline Human Members */}
          {offlineMembers.map(({ member, lastSeenText }) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 rounded-[10px] bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)] opacity-70"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[#1B0C1A] text-[10px] font-bold flex-shrink-0 grayscale ring-1 ring-[var(--border-subtle)]"
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
                  <span className="text-xs text-[var(--text-muted)] font-normal">
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
        <div className="p-3.5 bg-[var(--bg-elevated)]/30 rounded-[14px] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[var(--text-primary)]" />
              <span>ألبوم صور «لَمّة» ({sharedImages.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {sharedImages.slice(0, 8).map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onImageClick(url)}
                className="aspect-square rounded-[10px] overflow-hidden border border-[var(--border-subtle)] hover:opacity-90 active:scale-95 transition"
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
