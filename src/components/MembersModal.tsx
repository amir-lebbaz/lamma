'use client';

import React, { useState, useEffect } from 'react';
import { Member, MemberWithStatus } from '@/types';
import { X, Circle, Heart } from 'lucide-react';
import ZinoAvatar from './ZinoAvatar';
import { ZINO_STATUSES, ZINO_GREETING_TOAST } from '@/lib/zino-bot';

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  membersWithStatus: MemberWithStatus[];
  currentMember: Member;
}

export default function MembersModal({
  isOpen,
  onClose,
  membersWithStatus,
  currentMember,
}: MembersModalProps) {
  const [zinoToast, setZinoToast] = useState(false);
  const [zinoStatusIndex, setZinoStatusIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setZinoStatusIndex((prev) => (prev + 1) % ZINO_STATUSES.length);
    }, 25000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const onlineMembers = membersWithStatus.filter((m) => m.isOnline);
  const offlineMembers = membersWithStatus.filter((m) => !m.isOnline);

  const handleZinoClick = () => {
    setZinoToast(true);
    setTimeout(() => setZinoToast(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xs bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-t-[14px] sm:rounded-[14px] p-4 border border-[var(--border-subtle)] space-y-3 pb-safe animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zino Toast */}
        {zinoToast && (
          <div className="absolute top-2 left-2 right-2 z-30 p-2 rounded-[10px] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-semibold text-center border border-[var(--border-subtle)] animate-in fade-in">
            {ZINO_GREETING_TOAST}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">
              أفراد «لَمّة» العائلة
            </h3>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-canvas)] text-[var(--text-muted)] font-medium border border-[var(--border-subtle)]">
              {onlineMembers.length} متصل
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Lists */}
        <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 smooth-scroll text-xs">
          {/* SPECIAL PASSIVE FAMILY MEMBER: Our Siamese Cat ZINO (زينو) */}
          <div
            onClick={handleZinoClick}
            className="flex items-center justify-between p-2 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--bg-elevated)]/40 transition active:scale-98"
            title="انقر لتلقي سلام من زينو!"
          >
            <div className="flex items-center gap-2">
              <ZinoAvatar size={26} />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-xs text-[var(--text-primary)]">
                    زينو (Zino)
                  </span>
                  <span className="text-[8.5px] px-1 rounded-full bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                    قط العائلة 🐾
                  </span>
                </div>
                <span className="text-[9.5px] text-[var(--text-muted)]">
                  {ZINO_STATUSES[zinoStatusIndex]}
                </span>
              </div>
            </div>
            <span className="text-xs">🐱</span>
          </div>

          {/* Online Section */}
          {onlineMembers.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-[var(--text-primary)] mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                <span>المتصلون الآن ({onlineMembers.length})</span>
              </div>
              <div className="space-y-1.5">
                {onlineMembers.map(({ member, lastSeenText }) => {
                  const isMe = member.id === currentMember.id;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[#1B0C1A] font-bold text-xs ring-1 ring-[var(--border-subtle)]"
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
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-xs text-[var(--text-primary)]">
                              {member.display_name}
                            </span>
                            {member.nickname && (
                              <span className="text-[9.5px] text-[var(--text-muted)]">
                                ({member.nickname})
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[9px] bg-[var(--bg-elevated)] text-[var(--text-primary)] px-1 rounded-full font-medium border border-[var(--border-subtle)]">
                                أنت
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">
                            {lastSeenText}
                          </span>
                        </div>
                      </div>

                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Offline Section */}
          {offlineMembers.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
                <Circle className="w-1.5 h-1.5 text-[var(--text-muted)]" />
                <span>غير متصلين ({offlineMembers.length})</span>
              </div>
              <div className="space-y-1.5">
                {offlineMembers.map(({ member, lastSeenText }) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-[10px] bg-[var(--bg-canvas)]/50 border border-[var(--border-subtle)]/50 opacity-70"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[#1B0C1A] font-bold text-xs grayscale ring-1 ring-[var(--border-subtle)]"
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
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-normal text-xs text-[var(--text-muted)]">
                            {member.display_name}
                          </span>
                        </div>
                        <span className="text-[9px] text-[var(--text-muted)]">
                          {lastSeenText}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-2 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)] text-center">
          <Heart className="w-3 h-3 text-[var(--text-primary)] fill-current flex-shrink-0" />
          <span>مساحة «لَمّة» خاصة وموحدة لجميع أفراد الأسرة</span>
        </div>
      </div>
    </div>
  );
}
