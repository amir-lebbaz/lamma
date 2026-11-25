'use client';

import React, { useState } from 'react';
import { Eraser, X, AlertCircle, Loader2 } from 'lucide-react';

interface ClearChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ClearChatModal({
  isOpen,
  onClose,
  onConfirm,
}: ClearChatModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in">
      <div
        className="w-full max-w-sm rounded-[14px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 text-[var(--text-primary)] shadow-xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[#C85A65]/20 border border-[#C85A65]/40 flex items-center justify-center text-[#FADCD5]">
              <Eraser className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-[var(--text-primary)]">
              محو المحادثة لديك
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content explanation */}
        <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
          سيتم إخفاء جميع الرسائل السابقة من شاشتك وجهازك فقط. لن تُحذف الرسائل عند باقي أفراد العائلة، وستصلك أي رسائل جديدة ترسل بعد الآن بشكل طبيعي.
        </p>

        <div className="p-2.5 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-start gap-2 mb-5">
          <AlertCircle className="w-4 h-4 text-[var(--text-primary)] flex-shrink-0 mt-0.5" />
          <span className="text-[11px] text-[var(--text-muted)] leading-tight">
            خاصية الحذف المحلي: لا يتم مسح أي رسالة من قاعدة بيانات العائلة، ويبقى الأرشيف محفوظاً لدى الجميع.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-[10px] text-xs font-medium bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition active:scale-95"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-[10px] text-xs font-semibold bg-[#C85A65] hover:opacity-90 text-[#FADCD5] border border-[#C85A65]/60 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري المحو...</span>
              </>
            ) : (
              <span>محو من جهازي</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
