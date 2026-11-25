'use client';

import React, { useState } from 'react';
import { Pin, Edit3, X, Check, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-date';

interface PinnedNoticeBannerProps {
  notice: string | null;
  pinnedBy: string | null;
  pinnedAt: string | null;
  currentMemberName: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onUpdateNotice: (newNotice: string | null) => Promise<void>;
}

export default function PinnedNoticeBanner({
  notice,
  pinnedBy,
  pinnedAt,
  isOpen,
  onToggleOpen,
  onUpdateNotice,
}: PinnedNoticeBannerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftNotice, setDraftNotice] = useState(notice || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setDraftNotice(notice || '');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draftNotice.trim();
    setIsSaving(true);
    try {
      await onUpdateNotice(trimmed ? trimmed : null);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpin = async () => {
    setIsSaving(true);
    try {
      await onUpdateNotice(null);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Compact 1-line pill on mobile when not fully expanded
  if (!isOpen && notice) {
    return (
      <div className="bg-[var(--bg-surface)]/80 border-b border-[var(--border-subtle)] px-3.5 py-1.5 transition-all">
        <div className="max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onToggleOpen}
            className="flex items-center gap-1.5 text-[var(--text-primary)] min-w-0 text-right flex-1"
          >
            <Pin className="w-3.5 h-3.5 fill-current text-[var(--text-primary)] flex-shrink-0" />
            <span className="font-semibold text-[var(--text-primary)] flex-shrink-0 text-[11px]">تنبيه:</span>
            <span className="truncate text-[var(--text-primary)] text-xs font-normal">{notice}</span>
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] flex-shrink-0"
            title="عرض التفاصيل"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen && !notice) {
    return null;
  }

  // Expanded View
  return (
    <div className="bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] px-3.5 py-3 sm:px-6 transition-all text-[var(--text-primary)]">
      <div className="max-w-3xl lg:max-w-4xl mx-auto">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 fill-current text-[var(--text-primary)]" />
                تثبيت تذكير عائلي
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-[var(--text-muted)] p-1 hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={draftNotice}
              onChange={(e) => setDraftNotice(e.target.value)}
              placeholder="اكتب التذكير هنا (مثلاً: موعد العشاء الساعة 8:30، لا تنسوا الخبز...)"
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none"
              autoFocus
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              {notice ? (
                <button
                  type="button"
                  onClick={handleUnpin}
                  disabled={isSaving}
                  className="text-xs text-[#F28482] hover:underline font-medium"
                >
                  إزالة التثبيت
                </button>
              ) : <span />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-[10px] text-xs text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !draftNotice.trim()}
                  className="px-4 py-1.5 rounded-[10px] bg-[var(--accent-primary)] hover:opacity-90 text-[var(--text-primary)] text-xs font-medium flex items-center gap-1 disabled:opacity-50 border border-[var(--border-subtle)]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'جارِ الحفظ...' : 'تثبيت التنبيه'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : notice ? (
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] flex-shrink-0 mt-0.5">
                <Pin className="w-3.5 h-3.5 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mb-0.5">
                  <span className="font-semibold text-[var(--text-primary)]">تذكير عائلي مثبت</span>
                  {pinnedBy && <span>• {pinnedBy}</span>}
                  {pinnedAt && <span>• {formatRelativeTime(pinnedAt)}</span>}
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-primary)] font-medium leading-relaxed break-words whitespace-pre-wrap">
                  {notice}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleStartEdit}
                className="p-1.5 rounded-[10px] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
                title="تعديل التنبيه"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onToggleOpen}
                className="p-1.5 rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition"
                title="طي"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Bell className="w-3.5 h-3.5 text-[var(--text-primary)]" />
              <span>لا يوجد تنبيه مثبت حالياً</span>
            </div>
            <button
              type="button"
              onClick={handleStartEdit}
              className="px-3 py-1 rounded-[10px] bg-[var(--accent-primary)] text-[var(--text-primary)] text-xs font-medium hover:opacity-90 transition flex items-center gap-1 border border-[var(--border-subtle)]"
            >
              <Pin className="w-3 h-3" />
              <span>إضافة تنبيه</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
