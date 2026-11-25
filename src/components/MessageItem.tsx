'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, ReactionEmoji, ALLOWED_EMOJIS, Member } from '@/types';
import { formatArabicTime } from '@/lib/format-date';
import { getMediaLocally, saveMediaLocally } from '@/lib/media-storage';
import {
  Reply,
  CornerUpRight,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  Image as ImageIcon,
  HardDriveDownload,
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  currentMember: Member;
  onReply: (message: Message) => void;
  onToggleReaction: (messageId: string, emoji: ReactionEmoji) => void;
  onImageClick: (url: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export default function MessageItem({
  message,
  currentMember,
  onReply,
  onToggleReaction,
  onImageClick,
  onDeleteMessage,
}: MessageItemProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [isPurgedFallback, setIsPurgedFallback] = useState(false);

  // Swipe-to-reply state for mobile touch ergonomics
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const isSwipingRef = useRef(false);

  const isOwn = message.sender_id === currentMember.id;

  // Resolve Zero-Database-Quota Media from local IndexedDB or direct payload
  useEffect(() => {
    let isMounted = true;

    async function resolveMedia() {
      const rawUrl = message.image_url;
      if (!rawUrl) {
        setResolvedImageUrl(null);
        setIsPurgedFallback(false);
        return;
      }

      // If it is a direct dataUrl or blob url
      if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.startsWith('http')) {
        setResolvedImageUrl(rawUrl);
        setIsPurgedFallback(false);
        // Cache to IndexedDB if it's base64
        if (rawUrl.startsWith('data:')) {
          const imgId =
            message.image_id ||
            (rawUrl.startsWith('media-stub:')
              ? rawUrl.replace('media-stub:', '')
              : message.id);
          saveMediaLocally(imgId, rawUrl).catch(() => {});
        }
        return;
      }

      // If it is a lightweight stub ('media-stub:<image_id>')
      if (rawUrl.startsWith('media-stub:') || message.image_id) {
        const imgId = rawUrl.startsWith('media-stub:')
          ? rawUrl.replace('media-stub:', '')
          : (message.image_id || message.id);

        const localCached = await getMediaLocally(imgId);
        if (!isMounted) return;

        if (localCached) {
          setResolvedImageUrl(localCached);
          setIsPurgedFallback(false);
        } else {
          // Payload was purged from Supabase and not cached on this device
          setResolvedImageUrl(null);
          setIsPurgedFallback(true);
        }
      }
    }

    resolveMedia();
    return () => {
      isMounted = false;
    };
  }, [message.image_url, message.image_id, message.id]);

  // Swipe-to-reply handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    isSwipingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || !isSwipingRef.current) return;
    const diff = e.touches[0].clientX - touchStartX;
    // Allow dragging up to 75px in both directions
    const pull = Math.max(-75, Math.min(75, diff));
    setSwipeOffset(pull);
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) > 42) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {}
      }
      onReply(message);
    }
    setSwipeOffset(0);
    setTouchStartX(null);
    isSwipingRef.current = false;
  };

  // Group reactions by emoji
  const reactionsByEmoji = (message.reactions || []).reduce<
    Record<string, { count: number; users: string[]; hasReacted: boolean }>
  >((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, users: [], hasReacted: false };
    }
    acc[r.emoji].count += 1;
    acc[r.emoji].users.push(r.sender_name);
    if (r.sender_id === currentMember.id) {
      acc[r.emoji].hasReacted = true;
    }
    return acc;
  }, {});

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.content) {
      navigator.clipboard.writeText(message.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل تريد حذف هذه الرسالة؟')) {
      onDeleteMessage?.(message.id);
      setShowToolbar(false);
    }
  };

  /* Action toolbar for reactions, reply, copy, and delete */
  const renderToolbar = () => (
    <div
      className={`absolute -top-9.5 z-20 flex items-center gap-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm rounded-full px-2 py-1 transition-all duration-150 ${
        isOwn ? 'right-0' : 'left-0'
      } ${
        showToolbar
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-95 pointer-events-none sm:group-hover:opacity-100 sm:group-hover:scale-100 sm:group-hover:pointer-events-auto'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {ALLOWED_EMOJIS.map((emoji) => {
        const hasReacted = reactionsByEmoji[emoji]?.hasReacted;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onToggleReaction(message.id, emoji);
              setShowToolbar(false);
            }}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs transition-transform active:scale-125 ${
              hasReacted
                ? 'bg-[var(--bubble-outgoing)] scale-110 shadow-2xs'
                : 'hover:scale-115'
            }`}
            title={`تفاعل بـ ${emoji}`}
          >
            {emoji}
          </button>
        );
      })}

      <div className="w-[1px] h-3.5 bg-[var(--border)]/60 mx-0.5" />

      {/* Reply Button */}
      <button
        type="button"
        onClick={() => {
          onReply(message);
          setShowToolbar(false);
        }}
        className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-white/10 transition active:scale-90"
        title="رد على الرسالة"
      >
        <Reply className="w-3.5 h-3.5" />
      </button>

      {/* Copy Button (if message has text content) */}
      {message.content && (
        <button
          type="button"
          onClick={handleCopyText}
          className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-white/10 transition active:scale-90"
          title={copied ? 'تم النسخ!' : 'نسخ النص'}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[var(--accent)] stroke-[2.5]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Delete Button (Only for own messages) */}
      {isOwn && (
        <button
          type="button"
          onClick={handleDelete}
          className="w-6 h-6 flex items-center justify-center rounded-full text-[#F28482] hover:bg-[#F28482]/20 transition active:scale-90"
          title="حذف الرسالة"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  /* Reaction badges row */
  const renderReactions = () => {
    if (Object.entries(reactionsByEmoji).length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-1 px-1">
        {Object.entries(reactionsByEmoji).map(([emoji, data]) => (
          <button
            key={emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleReaction(message.id, emoji as ReactionEmoji);
            }}
            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition active:scale-90 shadow-2xs ${
              data.hasReacted
                ? 'bg-[var(--bubble-outgoing)] border-[var(--border)] text-[var(--accent)] font-bold'
                : 'bg-[var(--bg-surface)] border-[var(--border)]/60 text-[var(--text-primary)] hover:bg-white/10'
            }`}
            title={data.users.join('، ')}
          >
            <span>{emoji}</span>
            <span className="font-mono text-[10px]">{data.count}</span>
          </button>
        ))}
      </div>
    );
  };

  /* Quoted reply banner */
  const renderReplyBanner = () => {
    if (!message.reply_to_text) return null;
    return (
      <div
        className={`mb-1.5 p-2 rounded-xl text-[11px] border-r-2 select-none transition ${
          isOwn
            ? 'bg-white/10 border-[var(--accent)] text-[var(--bubble-outgoing-text)] backdrop-blur-xs'
            : 'bg-black/25 border-[var(--accent)] text-[var(--bubble-incoming-text)]'
        }`}
      >
        <div className="flex items-center gap-1 font-bold text-[10px] mb-0.5 text-[var(--accent)]">
          <CornerUpRight className="w-3 h-3 rotate-180" />
          <span>رد على {message.reply_to_sender || 'رسالة'}</span>
        </div>
        <p className="line-clamp-2 italic break-words opacity-90">
          {message.reply_to_text}
        </p>
      </div>
    );
  };

  /* Photo or Clean Zero-Quota Fallback Card */
  const renderMediaContent = () => {
    // 1. Resolved Image from IndexedDB or direct payload
    if (resolvedImageUrl) {
      return (
        <div className="mb-2 overflow-hidden rounded-xl bg-black/25 border border-white/10 relative group/img">
          <img
            src={resolvedImageUrl}
            alt="صورة مرفقة"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(resolvedImageUrl);
            }}
            className="w-full max-h-72 object-cover rounded-xl cursor-pointer hover:opacity-95 transition active:scale-[0.99]"
            loading="lazy"
          />
        </div>
      );
    }

    // 2. Clean Fallback Card (when payload has been purged from Supabase and not cached locally)
    if (isPurgedFallback) {
      return (
        <div className="mb-2 p-2.5 rounded-xl bg-black/25 border border-[var(--border)]/50 flex items-center gap-2.5 select-none text-right">
          <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
            <HardDriveDownload className="w-4 h-4 opacity-80" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-bold text-[var(--accent)] leading-tight">
              صورة محفوظة على أجهزة العائلة
            </div>
            <div className="text-[9.5px] text-[var(--text-muted)] mt-0.5 leading-tight">
              مساحة سحابية 0% • محفوظة محلياً في جهاز المرسل
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // 1. My Messages (رسائلي): Sender's side (Right side in RTL)
  if (isOwn) {
    return (
      <div
        className="group relative w-full flex justify-start my-2 px-1 transition-all"
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => setShowToolbar(false)}
      >
        {/* Swipe-to-Reply Behind Indicator */}
        {Math.abs(swipeOffset) > 15 && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-[var(--bubble-outgoing)] text-[var(--accent)] shadow-md transition-opacity pointer-events-none ${
              swipeOffset > 0 ? 'right-2' : 'left-2'
            }`}
          >
            <Reply className="w-4 h-4" />
          </div>
        )}

        {/* Hover-Reply Desktop Action Button */}
        <div className="hidden sm:group-hover:flex items-center mr-1.5 self-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onReply(message)}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-white/10 transition active:scale-90"
            title="رد سريع"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ transform: `translateX(${swipeOffset}px)` }}
          className="relative max-w-[82%] sm:max-w-[72%] flex flex-col items-end transition-transform duration-75"
        >
          {/* Action Toolbar */}
          {renderToolbar()}

          {/* Bubble Card (Styled with --bubble-outgoing) */}
          <div
            onClick={() => setShowToolbar((prev) => !prev)}
            className={`relative rounded-2xl rounded-br-[4px] px-3.5 py-2 border text-[var(--text-primary)] cursor-pointer sm:cursor-default select-text transition active:scale-[0.99] ${
              message.is_urgent || message.message_type === 'urgent'
                ? 'bg-[var(--accent-primary)] border-[#C85A65] shadow-[0_0_12px_rgba(200,90,101,0.25)]'
                : 'bg-[var(--accent-primary)] border-[var(--border-subtle)]'
            }`}
          >
            {/* Header tag */}
            <div className="flex items-center justify-between gap-2 mb-1 select-none">
              <span className="text-[9.5px] font-bold text-[var(--text-primary)] bg-black/20 px-1.5 py-0.5 rounded-md">
                أنت
              </span>
              {(message.is_urgent || message.message_type === 'urgent') && (
                <span className="flex items-center gap-1 text-[10.5px] font-bold text-[#FADCD5] bg-[#C85A65]/30 border border-[#C85A65]/50 px-2 py-0.5 rounded-full">
                  <span>🚨</span>
                  <span>نداء عاجل</span>
                </span>
              )}
            </div>

            {/* Quoted Message */}
            {renderReplyBanner()}

            {/* Attached Image or Fallback */}
            {renderMediaContent()}

            {/* Text Content */}
            {message.content && (
              <p
                dir="auto"
                className="message-content text-[13.5px] leading-relaxed whitespace-pre-wrap break-words font-normal text-[var(--text-primary)] select-text"
              >
                {message.content}
              </p>
            )}

            {/* Timestamp & Status Ticks */}
            <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-[var(--text-muted)] select-none font-mono">
              <span>{formatArabicTime(message.created_at)}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[var(--text-primary)] stroke-[2.2]" />
            </div>
          </div>

          {/* Reactions */}
          {renderReactions()}
        </div>
      </div>
    );
  }

  // 2. Others' Messages (رسائل الآخرين): Opposite side (Left side in RTL)
  return (
    <div
      className="group relative w-full flex justify-end my-2 px-1 transition-all"
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Swipe-to-Reply Behind Indicator */}
      {Math.abs(swipeOffset) > 15 && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-[var(--bubble-outgoing)] text-[var(--accent)] shadow-md transition-opacity pointer-events-none ${
            swipeOffset > 0 ? 'right-2' : 'left-2'
          }`}
        >
          <Reply className="w-4 h-4" />
        </div>
      )}

      {/* Hover-Reply Desktop Action Button */}
      <div className="hidden sm:group-hover:flex items-center ml-1.5 self-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onReply(message)}
          className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-white/10 transition active:scale-90"
          title="رد سريع"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className="relative max-w-[82%] sm:max-w-[72%] flex items-start gap-2 transition-transform duration-75"
      >
        {/* Bubble + Reactions Column */}
        <div className="flex-1 min-w-0 flex flex-col items-start">
          {/* Action Toolbar */}
          {renderToolbar()}

          {/* Sender Name & Nickname */}
          <div className="flex items-center gap-1.5 mb-1 px-1 select-none">
            <span
              className="text-xs font-bold"
              style={{ color: message.sender_color }}
            >
              {message.sender_name}
            </span>
            {message.sender_nickname && (
              <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                ({message.sender_nickname})
              </span>
            )}
          </div>

          {/* Bubble Card (Styled with --bg-elevated) */}
          <div
            onClick={() => setShowToolbar((prev) => !prev)}
            className={`relative w-full rounded-2xl rounded-bl-[4px] px-3.5 py-2 border text-[var(--text-primary)] cursor-pointer sm:cursor-default select-text transition active:scale-[0.99] ${
              message.is_urgent || message.message_type === 'urgent'
                ? 'bg-[var(--bg-elevated)] border-[#C85A65] shadow-[0_0_12px_rgba(200,90,101,0.25)]'
                : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'
            }`}
          >
            {/* Urgent Badge */}
            {(message.is_urgent || message.message_type === 'urgent') && (
              <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full bg-[#C85A65]/30 border border-[#C85A65]/50 text-[#FADCD5] text-[10.5px] font-bold w-fit">
                <span>🚨</span>
                <span>نداء عاجل</span>
              </div>
            )}
            {/* Quoted Message */}
            {renderReplyBanner()}

            {/* Attached Image or Fallback */}
            {renderMediaContent()}

            {/* Text Content */}
            {message.content && (
              <p
                dir="auto"
                className="message-content text-[13.5px] leading-relaxed whitespace-pre-wrap break-words font-normal text-[var(--text-primary)] select-text"
              >
                {message.content}
              </p>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-start gap-1 mt-1 text-[11px] text-[var(--text-muted)] select-none font-mono">
              <span>{formatArabicTime(message.created_at)}</span>
            </div>
          </div>

          {/* Reactions */}
          {renderReactions()}
        </div>

        {/* Sender Avatar (Positioned at left edge next to bubble) */}
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[#1B0C1A] text-xs font-bold shadow-2xs mt-4 select-none ring-2 ring-white/20"
          style={{ backgroundColor: message.sender_color }}
          title={message.sender_name}
        >
          {message.sender_avatar_url ? (
            <img
              src={message.sender_avatar_url}
              alt={message.sender_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{message.sender_name.charAt(0)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
