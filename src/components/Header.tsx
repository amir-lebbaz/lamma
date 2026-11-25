'use client';

import React from 'react';
import { Member, Room, MemberWithStatus } from '@/types';
import { Pin, Users, Settings, Download, ShoppingCart } from 'lucide-react';

interface HeaderProps {
  room: Room;
  currentMember: Member;
  membersWithStatus: MemberWithStatus[];
  isNoticePinned: boolean;
  isNoticeOpen: boolean;
  typingUser?: string | null;
  headerClass?: string;
  isDark?: boolean;
  pendingChecklistCount?: number;
  onToggleNotice: () => void;
  onOpenMembers: () => void;
  onOpenSettings: () => void;
  onOpenChecklist?: () => void;
}

export default function Header({
  room,
  currentMember,
  membersWithStatus,
  isNoticePinned,
  isNoticeOpen,
  typingUser,
  headerClass,
  isDark,
  pendingChecklistCount,
  onToggleNotice,
  onOpenMembers,
  onOpenSettings,
  onOpenChecklist,
}: HeaderProps) {
  const onlineCount = membersWithStatus.filter((m) => m.isOnline).length;
  const offlineCount = membersWithStatus.filter((m) => !m.isOnline).length;

  return (
    <header
      className={`sticky top-0 z-30 px-3.5 py-2.5 transition-all select-none border-b shadow-2xs ${
        headerClass ||
        'bg-[var(--bg-surface)]/85 backdrop-blur-md border-[var(--border)]/40 text-[var(--text-primary)]'
      }`}
    >
      <div className="max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between gap-2.5">
        {/* User Avatar + Room Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar (Clicking opens settings!) */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-[#1B0C1A] font-bold text-xs shadow-2xs active:scale-95 transition ring-2 ring-white/20"
            style={{ backgroundColor: currentMember.avatar_color }}
            title="إعدادات الحساب والمظهر"
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
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none mb-1">
              <h1 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">
                {room.name || 'لَمّة العائلة'}
              </h1>
              {currentMember.nickname && (
                <span className="text-[11px] text-[var(--text-muted)] truncate font-medium">
                  ({currentMember.nickname})
                </span>
              )}
            </div>

            {/* Live Typing or Online Count */}
            {typingUser ? (
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] font-bold animate-pulse">
                <span>✍️ {typingUser} يكتب الآن...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenMembers}
                className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] hover:underline"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
                <span className="font-semibold">{onlineCount} متصل الآن</span>
                {offlineCount > 0 && (
                  <span className="text-[var(--text-muted)] font-normal">
                    • {offlineCount} غير متصل
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Download App APK Link */}
          <a
            href="/lamma.apk"
            download="lamma.apk"
            className="px-2.5 py-1.5 rounded-xl text-[var(--accent)] hover:bg-white/10 border border-transparent hover:border-[var(--border)]/40 transition active:scale-90 flex items-center gap-1.5 text-[11px] font-bold shadow-2xs"
            title="تحميل تطبيق لَمّة للهاتف (APK أندرويد)"
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">التطبيق</span>
          </a>

          {/* Pinned Notice Button */}
          <button
            type="button"
            onClick={onToggleNotice}
            className={`relative p-2 rounded-xl text-xs flex items-center gap-1 transition active:scale-90 ${
              isNoticeOpen
                ? 'bg-[var(--bubble-outgoing)] text-[var(--accent)] border border-[var(--border)]'
                : isNoticePinned
                ? 'bg-black/30 text-[var(--accent)] border border-[var(--border)]/50'
                : 'text-[var(--text-muted)] hover:bg-white/10'
            }`}
            title="التنبيه العائلي"
          >
            <Pin
              className={`w-4 h-4 ${isNoticePinned ? 'fill-current text-[var(--accent)]' : ''}`}
            />
            {isNoticePinned && !isNoticeOpen && (
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] absolute top-1 right-1 animate-ping"></span>
            )}
          </button>

          {/* Household Checklist Button */}
          {onOpenChecklist && (
            <button
              type="button"
              onClick={onOpenChecklist}
              className="relative p-2 rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition active:scale-90"
              title="نواقص البيت"
            >
              <ShoppingCart className="w-4 h-4" />
              {pendingChecklistCount !== undefined && pendingChecklistCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[var(--bubble-outgoing)] text-[var(--accent)] text-[9px] font-bold border border-[var(--border)]">
                  {pendingChecklistCount}
                </span>
              )}
            </button>
          )}

          {/* Members Button */}
          <button
            type="button"
            onClick={onOpenMembers}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition active:scale-90"
            title="أفراد العائلة"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition active:scale-90"
            title="إعدادات الحساب والمظهر"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
