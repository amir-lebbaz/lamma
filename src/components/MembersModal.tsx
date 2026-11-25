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
        className="w-full sm:max-w-xs bg-[#251824] text-[#FADCD5] rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl border border-[#765D67]/40 space-y-3 pb-safe animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zino Toast */}
        {zinoToast && (
          <div className="absolute top-2 left-2 right-2 z-30 p-2 rounded-xl bg-[var(--bubble-outgoing)] text-[var(--accent)] text-xs font-bold text-center border border-[var(--border)] shadow-lg animate-in fade-in">
            {ZINO_GREETING_TOAST}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#765D67]/30">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-[#FADCD5]">
              أفراد «لَمّة» العائلة
            </h3>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 text-[var(--accent)] font-bold border border-[#765D67]/40">
              {onlineMembers.length} متصل
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-[#B5B9BC] hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Lists */}
        <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 smooth-scroll text-xs">
          {/* SPECIAL PASSIVE FAMILY MEMBER: Our Siamese Cat ZINO (زينو) */}
          <div
            onClick={handleZinoClick}
            className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-[#3B2820]/30 to-[#251824]/40 border border-[#F5E6D3]/30 cursor-pointer hover:border-[#5BC0EB]/60 transition active:scale-98 shadow-2xs"
            title="انقر لتلقي سلام من زينو!"
          >
            <div className="flex items-center gap-2">
              <ZinoAvatar size={26} />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-[#F5E6D3]">
                    زينو (Zino)
                  </span>
                  <span className="text-[8.5px] px-1 rounded bg-[#3B2820]/60 text-[#F5E6D3] border border-[#F5E6D3]/20">
                    قط العائلة 🐾
                  </span>
                </div>
                <span className="text-[9.5px] text-[#5BC0EB]">
                  {ZINO_STATUSES[zinoStatusIndex]}
                </span>
              </div>
            </div>
            <span className="text-xs">🐱</span>
          </div>

          {/* Online Section */}
          {onlineMembers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[var(--accent)] mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                <span>المتصلون الآن ({onlineMembers.length})</span>
              </div>
              <div className="space-y-1.5">
                {onlineMembers.map(({ member, lastSeenText }) => {
                  const isMe = member.id === currentMember.id;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-black/25 border border-[#765D67]/30"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[#1B0C1A] font-bold text-xs shadow-2xs"
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
                            <span className="font-semibold text-xs text-[#FADCD5]">
                              {member.display_name}
                            </span>
                            {member.nickname && (
                              <span className="text-[9.5px] text-[#765D67]">
                                ({member.nickname})
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[9px] bg-black/40 text-[var(--accent)] px-1 rounded font-bold border border-[#765D67]/30">
                                أنت
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--accent)] font-medium">
                            {lastSeenText}
                          </span>
                        </div>
                      </div>

                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-xs animate-pulse"></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Offline Section */}
          {offlineMembers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#765D67] mb-1.5 flex items-center gap-1">
                <Circle className="w-1.5 h-1.5 text-[#765D67] fill-current" />
                <span>غير متصلين ({offlineMembers.length})</span>
              </div>
              <div className="space-y-1.5">
                {offlineMembers.map(({ member, lastSeenText }) => {
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-black/15 border border-[#765D67]/20 opacity-70"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[#1B0C1A] font-bold text-xs grayscale"
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
                            <span className="font-semibold text-xs text-[#B5B9BC]">
                              {member.display_name}
                            </span>
                            {member.nickname && (
                              <span className="text-[9.5px] text-[#765D67]">
                                ({member.nickname})
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#765D67]">
                            {lastSeenText}
                          </p>
                        </div>
                      </div>

                      <span className="w-2 h-2 rounded-full bg-[#765D67]/50"></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-2 rounded-xl bg-black/25 border border-[#765D67]/30 flex items-center justify-center gap-1.5 text-[10px] text-[#765D67] text-center">
          <Heart className="w-3 h-3 text-[var(--accent)] fill-current flex-shrink-0" />
          <span>مساحة «لَمّة» خاصة وموحدة لجميع أفراد الأسرة</span>
        </div>
      </div>
    </div>
  );
}
