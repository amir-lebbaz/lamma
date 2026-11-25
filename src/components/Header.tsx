'use client';

import React from 'react';
import { Member, Room, MemberWithStatus } from '@/types';
import { Pin, Users, Settings, Download, ShoppingCart, Eraser } from 'lucide-react';

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
  onClearChat?: () => void;
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
  onClearChat,
}: HeaderProps) {
  const onlineCount = membersWithStatus.filter((m) => m.isOnline).length;
  const offlineCount = membersWithStatus.filter((m) => !m.isOnline).length;

  return (
    <header
      className={`sticky top-0 z-30 px-4 py-2.5 transition-all select-none border-b ${
        headerClass ||
        'bg-[var(--bg-surface)]/90 backdrop-blur-md border-[var(--border-subtle)] text-[var(--text-primary)]'
      }`}
    >
      <div className="max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between gap-2.5">
        {/* User Avatar + Room Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar (Clicking opens settings!) */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[#1B0C1A] font-bold text-xs active:scale-95 transition ring-1 ring-[var(--border-subtle)]"
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
              <h1 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] truncate">
                {room.name || 'لَمّة العائلة'}
              </h1>
              {currentMember.nickname && (
                <span className="text-[11px] text-[var(--text-muted)] truncate font-normal">
                  ({currentMember.nickname})
                </span>
              )}
            </div>

            {/* Live Typing or Online Count */}
            {typingUser ? (
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-primary)] font-medium animate-pulse">
                <span>✍️ {typingUser} يكتب الآن...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenMembers}
                className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                <span className="font-medium text-[var(--text-primary)]">{onlineCount} متصل</span>
                {offlineCount > 0 && (
                  <span className="hidden sm:inline text-[var(--text-muted)] font-normal">
                    • {offlineCount} غير متصل
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Download App APK Link (Desktop/Tablet) */}
          <a
            href="/lamma.apk"
            download="lamma.apk"
            className="hidden sm:flex px-2.5 py-1.5 rounded-[10px] text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-subtle)] transition active:scale-95 items-center gap-1.5 text-[11px] font-medium"
            title="تحميل تطبيق لَمّة للهاتف (APK أندرويد)"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-primary)]" />
            <span>التطبيق</span>
          </a>

          {/* Pinned Notice Button */}
          <button
            type="button"
            onClick={onToggleNotice}
            className={`relative p-2 rounded-[10px] text-xs flex items-center gap-1 transition active:scale-95 border ${
              isNoticeOpen
                ? 'bg-[var(--accent-primary)] text-[var(--text-primary)] border-[var(--border-subtle)]'
                : isNoticePinned
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 border-transparent'
            }`}
            title="التنبيه العائلي"
          >
            <Pin
              className={`w-4 h-4 ${isNoticePinned ? 'fill-current text-[var(--text-primary)]' : ''}`}
            />
            {isNoticePinned && !isNoticeOpen && (
              <span className="w-2 h-2 rounded-full bg-[var(--text-primary)] absolute top-1 right-1 animate-ping"></span>
            )}
          </button>

          {/* Household Checklist Button */}
          {onOpenChecklist && (
            <button
              type="button"
              onClick={onOpenChecklist}
              className="relative p-2 rounded-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-transparent hover:border-[var(--border-subtle)] transition active:scale-95"
              title="نواقص البيت"
            >
              <ShoppingCart className="w-4 h-4" />
              {pendingChecklistCount !== undefined && pendingChecklistCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[var(--accent-primary)] text-[var(--text-primary)] text-[9px] font-bold border border-[var(--border-subtle)]">
                  {pendingChecklistCount}
                </span>
              )}
            </button>
          )}

          {/* Members Button */}
          <button
            type="button"
            onClick={onOpenMembers}
            className="p-2 rounded-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-transparent hover:border-[var(--border-subtle)] transition active:scale-95"
            title="أفراد العائلة"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Clear Chat Button */}
          {onClearChat && (
            <button
              type="button"
              onClick={onClearChat}
              className="p-2 rounded-[10px] text-[var(--text-muted)] hover:text-[#C85A65] hover:bg-white/5 border border-transparent hover:border-[var(--border-subtle)] transition active:scale-95"
              title="محو المحادثة لدي (إخفاء الرسائل السابقة من شاشتي فقط)"
            >
              <Eraser className="w-4 h-4" />
            </button>
          )}

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-transparent hover:border-[var(--border-subtle)] transition active:scale-95"
            title="إعدادات الحساب والمظهر"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
