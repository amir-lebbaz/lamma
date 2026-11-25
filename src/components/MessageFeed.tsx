'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Message, ReactionEmoji, Member } from '@/types';
import MessageItem from './MessageItem';
import { formatArabicDate } from '@/lib/format-date';
import { ArrowDown } from 'lucide-react';

interface MessageFeedProps {
  messages: Message[];
  currentMember: Member;
  onReply: (message: Message) => void;
  onToggleReaction: (messageId: string, emoji: ReactionEmoji) => void;
  onImageClick: (url: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export default function MessageFeed({
  messages,
  currentMember,
  onReply,
  onToggleReaction,
  onImageClick,
  onDeleteMessage,
}: MessageFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Group messages by date
  const groupedMessages: { date: string; items: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateLabel = formatArabicDate(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateLabel) {
      lastGroup.items.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, items: [msg] });
    }
  });

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const near = distanceFromBottom < 100;
    setIsNearBottom(near);
    setShowScrollBottom(!near);
  };

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom('smooth');
    }
  }, [messages.length, isNearBottom]);

  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4 relative overscroll-contain smooth-scroll"
    >
      {/* Centered Chat Pane with comfortable max-width (Telegram Web feel) */}
      <div className="max-w-3xl lg:max-w-4xl mx-auto flex flex-col min-h-full justify-end">
        {messages.length === 0 ? (
          <div className="my-auto text-center py-12 px-4 select-none">
            <div className="w-16 h-16 mx-auto mb-3 rounded-[14px] bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center justify-center text-3xl font-bold border border-[var(--border-subtle)]">
              🏡
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              مجلس «لَمّة» العائلي
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed font-normal">
              لا توجد رسائل سابقة بعد. ألقِ السلام وشارك أفراد أسرتك اليوم!
            </p>
          </div>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <div key={groupIdx} className="w-full">
              {/* Date Header: Centered Cleanly (Pill design) */}
              <div className="sticky top-2 z-10 flex items-center justify-center my-3 select-none pointer-events-none">
                <span className="date-pill pointer-events-auto px-3.5 py-1 rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-md text-[var(--text-primary)] text-[11px] font-medium border border-[var(--border-subtle)] transition-all">
                  {group.date}
                </span>
              </div>

              {/* Messages Group */}
              <div className="space-y-1">
                {group.items.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    currentMember={currentMember}
                    onReply={onReply}
                    onToggleReaction={onToggleReaction}
                    onImageClick={onImageClick}
                    onDeleteMessage={onDeleteMessage}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Floating Jump to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="fixed bottom-20 left-4 sm:left-8 z-20 px-3 py-1.5 rounded-full bg-[var(--bg-surface)]/95 backdrop-blur-md text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-md hover:bg-[var(--bg-surface)] active:scale-95 transition-all flex items-center gap-1.5 text-xs font-medium"
          title="أحدث الرسائل"
        >
          <ArrowDown className="w-3.5 h-3.5 text-[var(--text-primary)]" />
          <span>أحدث الرسائل</span>
        </button>
      )}
    </div>
  );
}
