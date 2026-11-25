'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/types';
import {
  Send,
  Image as ImageIcon,
  X,
  CornerUpRight,
  Loader2,
} from 'lucide-react';

interface ComposerBarProps {
  replyingTo: Message | null;
  onCancelReply: () => void;
  onSendMessage: (text: string, photoFile: File | null) => Promise<void>;
  onTyping?: () => void;
  composerClass?: string;
  isDark?: boolean;
}

export default function ComposerBar({
  replyingTo,
  onCancelReply,
  onSendMessage,
  onTyping,
  composerClass,
}: ComposerBarProps) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea up to 120px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صالح');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !selectedFile) return;
    if (isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(trimmed, selectedFile);
      setText('');
      removeSelectedFile();
      if (replyingTo) {
        onCancelReply();
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsSending(false);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <footer
      className={`sticky bottom-0 z-20 px-3 py-2.5 sm:px-6 sm:py-3 pb-safe transition-all select-none border-t bg-[var(--bg-surface)]/95 backdrop-blur-md border-[var(--border-subtle)] text-[var(--text-primary)] ${
        composerClass || ''
      }`}
    >
      <div className="max-w-3xl lg:max-w-4xl mx-auto">
        {/* Reply Quote Banner */}
        {replyingTo && (
          <div className="mb-2 p-2.5 bg-[var(--bg-elevated)] border-r-2 border-[var(--text-primary)] rounded-[10px] border border-[var(--border-subtle)] flex items-center justify-between text-xs animate-in fade-in">
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1 font-bold text-[var(--text-primary)] text-[11px] mb-0.5">
                <CornerUpRight className="w-3 h-3 rotate-180 text-[var(--text-primary)]" />
                <span>الرد على: {replyingTo.sender_name}</span>
              </div>
              <p className="text-[var(--text-muted)] truncate text-xs">
                {replyingTo.content || 'صورة'}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition active:scale-90 flex-shrink-0"
              title="إلغاء الرد"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Selected Image Thumbnail Preview */}
        {previewUrl && (
          <div className="mb-2 relative inline-block animate-in fade-in zoom-in-95">
            <div className="relative w-16 h-16 rounded-[10px] overflow-hidden border border-[var(--border-subtle)]">
              <img
                src={previewUrl}
                alt="معاينة الصورة"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeSelectedFile}
                className="absolute top-1 left-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition active:scale-90"
                title="إزالة الصورة"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Composer Row */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Photo Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition active:scale-95 flex-shrink-0 flex items-center justify-center"
            title="إرفاق صورة"
          >
            <ImageIcon className="w-5 h-5 text-[var(--text-primary)]" />
          </button>

          {/* Textarea with Enter/Shift+Enter shortcut */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                onTyping?.();
              }}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالة... (Enter للإرسال)"
              rows={1}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--text-primary)]/40 resize-none leading-normal transition select-text"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSending || (!text.trim() && !selectedFile)}
            className="w-10 h-10 rounded-[10px] bg-[var(--accent-primary)] hover:opacity-90 active:scale-95 text-[var(--text-primary)] transition flex-shrink-0 flex items-center justify-center border border-[var(--border-subtle)] disabled:opacity-30 disabled:pointer-events-none"
            title="إرسال (Enter)"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 -scale-x-100" />
            )}
          </button>
        </form>
      </div>
    </footer>
  );
}
