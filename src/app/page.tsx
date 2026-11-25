'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Member, MemberWithStatus, Message, ReactionEmoji, Room, BACKGROUND_THEMES, ChecklistItem } from '@/types';
import { chatService } from '@/lib/chat-service';
import {
  playNotificationSound,
  playUrgentBuzzSound,
  initAudioUnlock,
  requestNotificationPermission,
  triggerDesktopNotification,
  startTitleFlash,
  stopTitleFlash,
  isWindowUnfocused,
} from '@/lib/sound-utils';
import EntryScreen from '@/components/EntryScreen';
import Header from '@/components/Header';
import PinnedNoticeBanner from '@/components/PinnedNoticeBanner';
import MessageFeed from '@/components/MessageFeed';
import ComposerBar from '@/components/ComposerBar';
import ImageViewerModal from '@/components/ImageViewerModal';
import MembersModal from '@/components/MembersModal';
import SettingsModal from '@/components/SettingsModal';
import DesktopSidebar from '@/components/DesktopSidebar';
import ChecklistModal from '@/components/ChecklistModal';
import ClearChatModal from '@/components/ClearChatModal';
import { Loader2 } from 'lucide-react';

const PROFILE_STORAGE_KEY = 'family_chat_current_member';
const THEME_STORAGE_KEY = 'family_chat_theme_id';
const CUSTOM_BG_STORAGE_KEY = 'family_chat_custom_bg';
const FIXED_ROOM_ID = 'bayt-al-aela';

export default function FamilyChatPage() {
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [room, setRoom] = useState<Room>({
    id: FIXED_ROOM_ID,
    name: 'لَمّة العائلة',
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [membersWithStatus, setMembersWithStatus] = useState<MemberWithStatus[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClearChatOpen, setIsClearChatOpen] = useState(false);
  const [themeId, setThemeId] = useState('sakura-dusk');
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Register PWA Service Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration skipped:', err);
      });
    }
  }, []);

  // Synchronize document.documentElement theme class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-sakura-dusk', 'theme-velvet-ink');
      document.documentElement.classList.add(themeId === 'velvet-ink' ? 'theme-velvet-ink' : 'theme-sakura-dusk');
    }
  }, [themeId]);

  // Load saved profile, theme, and background on initial render
  useEffect(() => {
    // Desktop Force-Alert: unlock Web Audio on first click & request notification permission
    initAudioUnlock();
    requestNotificationPermission();

    const handleFocus = () => {
      stopTitleFlash();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        stopTitleFlash();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('click', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    try {
      // Purge any old demo localStorage entries
      const keysToClean = [
        'family_chat_bayt-al-aela_messages',
        'family_chat_bayt-al-aela_room_info',
        'family_chat_bayt-al-aela_members'
      ];
      keysToClean.forEach((k) => {
        const val = localStorage.getItem(k);
        if (val && (val.includes('demo-') || val.includes('member-') || val.includes('المبارك يوم الجمعة'))) {
          localStorage.removeItem(k);
        }
      });

      // Load theme and custom background (validate against exclusive 2-theme system)
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'sakura-dusk' || savedTheme === 'velvet-ink') {
        setThemeId(savedTheme);
      } else {
        setThemeId('sakura-dusk');
      }

      // Load Large Text Mode
      const savedLargeText = localStorage.getItem('lamma_large_text_mode');
      if (savedLargeText === 'true') {
        document.documentElement.classList.add('large-text-mode');
      } else {
        document.documentElement.classList.remove('large-text-mode');
      }

      const savedCustomBg = localStorage.getItem(CUSTOM_BG_STORAGE_KEY);
      if (savedCustomBg) setCustomBackgroundUrl(savedCustomBg);

      // Load profile
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed: Member = JSON.parse(saved);
        if (parsed && parsed.id && parsed.display_name) {
          parsed.room_id = FIXED_ROOM_ID;
          setCurrentMember(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to read stored profile:', e);
    } finally {
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('click', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Refresh members status
  const refreshMembers = useCallback(async (memberId: string) => {
    try {
      const list = await chatService.getAllMembersWithStatus(FIXED_ROOM_ID, memberId);
      setMembersWithStatus(list);
    } catch (e) {
      console.warn('Error refreshing members:', e);
    }
  }, []);

  // Fetch room data, real messages, and real members (respecting per-user cleared_at cutoff)
  const loadRoomData = useCallback(async (member: Member) => {
    try {
      const [roomData, messageList, initialChecklist] = await Promise.all([
        chatService.getRoom(FIXED_ROOM_ID),
        chatService.getMessages(FIXED_ROOM_ID, member.cleared_at),
        chatService.getChecklist(FIXED_ROOM_ID),
      ]);

      setRoom(roomData);
      setMessages(messageList);
      setChecklistItems(initialChecklist);

      // Register presence for current member
      await chatService.registerPresence(FIXED_ROOM_ID, member);
      await refreshMembers(member.id);
    } catch (err) {
      console.error('Error loading room data:', err);
    }
  }, [refreshMembers]);

  // Setup real-time updates and subscriptions
  useEffect(() => {
    if (!currentMember) return;

    loadRoomData(currentMember);

    // Subscribe to shared cross-platform real-time events & presence
    const unsubscribe = chatService.subscribeToRoom(FIXED_ROOM_ID, currentMember, {
      onMessage: (newMsg) => {
        if (currentMember && newMsg.sender_id !== currentMember.id) {
          if (newMsg.is_urgent || newMsg.message_type === 'urgent') {
            playUrgentBuzzSound();
            triggerDesktopNotification(`🚨 نداء عاجل: ${newMsg.sender_name}`, newMsg.content || 'نداء عائلي عاجل');
            startTitleFlash('🚨 نداء عاجل في لَمّة! 🔔');
          } else {
            playNotificationSound();
            if (isWindowUnfocused()) {
              const previewText = newMsg.content || (newMsg.image_url ? '📷 أرسل صورة جديدة' : 'رسالة جديدة');
              triggerDesktopNotification(newMsg.sender_name, previewText);
              startTitleFlash('🔴 (1) رسالة جديدة في لَمّة! ⚡');
            }
          }
        }
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMsg.id);
          let next: Message[];
          if (exists) {
            next = prev.map((m) => (m.id === newMsg.id ? { ...m, ...newMsg } : m));
          } else {
            next = [...prev, newMsg];
          }
          return next.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      },
      onMessageUpdated: (updatedMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
        );
      },
      onMessageDeleted: (deletedId) => {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      },
      onTyping: ({ memberName }) => {
        if (currentMember && memberName !== currentMember.display_name) {
          setTypingUser(memberName);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 3500);
        }
      },
      onReaction: ({ messageId, reaction, action }) => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            const existingReactions = msg.reactions ? [...msg.reactions] : [];
            let updatedReactions: typeof existingReactions;

            if (action === 'DELETE') {
              updatedReactions = existingReactions.filter(
                (r) => !(r.sender_id === reaction.sender_id && r.emoji === reaction.emoji)
              );
            } else {
              const alreadyHas = existingReactions.some(
                (r) => r.sender_id === reaction.sender_id && r.emoji === reaction.emoji
              );
              if (alreadyHas) {
                updatedReactions = existingReactions;
              } else {
                updatedReactions = [...existingReactions, reaction];
              }
            }

            return { ...msg, reactions: updatedReactions };
          })
        );
      },
      onRoomUpdate: (updatedRoom) => {
        setRoom((prev) => ({ ...prev, ...updatedRoom }));
      },
      onChecklistUpdate: (items) => {
        setChecklistItems(items);
      },
      onPresenceChange: () => {
        refreshMembers(currentMember.id);
      },
    });

    // Heartbeat every 20s to maintain genuine online status
    const heartbeat = setInterval(() => {
      chatService.registerPresence(FIXED_ROOM_ID, currentMember);
      refreshMembers(currentMember.id);
    }, 20000);

    // Unload hook
    const handleBeforeUnload = () => {
      chatService.leavePresence(FIXED_ROOM_ID, currentMember);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentMember, loadRoomData, refreshMembers]);

  // Handle Successful Authentication (Login or Register)
  const handleAuthenticated = (member: Member) => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(member));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
    setCurrentMember(member);
  };

  // Handle Updating Profile from Settings
  const handleUpdateProfile = async (updated: {
    displayName: string;
    nickname: string | null;
    avatarColor: string;
    avatarUrl: string | null;
  }) => {
    if (!currentMember) return;

    const modifiedMember = await chatService.updateMemberProfile(currentMember.id, updated);

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(modifiedMember));
    } catch (e) {
      console.warn('Storage save error:', e);
    }

    setCurrentMember(modifiedMember);
    await refreshMembers(modifiedMember.id);
  };

  // Handle Background Theme Change
  const handleSelectTheme = (id: string) => {
    setThemeId(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch (e) {
      console.warn(e);
    }
  };

  // Handle Custom Background Image
  const handleSetCustomBackground = (url: string | null) => {
    setCustomBackgroundUrl(url);
    try {
      if (url) {
        localStorage.setItem(CUSTOM_BG_STORAGE_KEY, url);
      } else {
        localStorage.removeItem(CUSTOM_BG_STORAGE_KEY);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Handle Switch User / Exit
  const handleSwitchUser = async () => {
    if (currentMember) {
      await chatService.leavePresence(FIXED_ROOM_ID, currentMember);
    }
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
    setCurrentMember(null);
  };

  // Handle Sending Messages
  const handleSendMessage = async (text: string, photoFile: File | null, isUrgent?: boolean) => {
    if (!currentMember) return;

    let imageUrl: string | null = null;
    let imageId: string | undefined = undefined;
    if (photoFile) {
      const uploadRes = await chatService.uploadPhoto(FIXED_ROOM_ID, photoFile);
      imageUrl = uploadRes.dataUrl;
      imageId = uploadRes.imageId;
    }

    const created = await chatService.sendMessage(FIXED_ROOM_ID, {
      room_id: FIXED_ROOM_ID,
      sender_id: currentMember.id,
      sender_name: currentMember.display_name,
      sender_nickname: currentMember.nickname || null,
      sender_color: currentMember.avatar_color,
      sender_avatar_url: currentMember.avatar_url || null,
      content: text,
      message_type: isUrgent ? 'urgent' : (imageUrl ? 'image' : 'text'),
      is_urgent: Boolean(isUrgent),
      image_url: imageUrl,
      image_id: imageId,
      audio_url: null,
      reply_to_id: replyingTo ? replyingTo.id : null,
      reply_to_text: replyingTo
        ? replyingTo.content || (replyingTo.image_url ? 'صورة' : (replyingTo.audio_url ? 'رسالة صوتية' : ''))
        : null,
      reply_to_sender: replyingTo ? replyingTo.sender_name : null,
    });

    setMessages((prev) => {
      const exists = prev.some((m) => m.id === created.id);
      let next: Message[];
      if (exists) {
        next = prev.map((m) => (m.id === created.id ? { ...m, ...created } : m));
      } else {
        next = [...prev, created];
      }
      return next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  };

  // Handle Per-User Non-Destructive "Clear Chat" (Delete for Me Only)
  const handleClearChatForMe = async () => {
    if (!currentMember) return;
    try {
      const newClearedAt = await chatService.clearChatForMember(FIXED_ROOM_ID, currentMember);
      const updatedMember: Member = {
        ...currentMember,
        cleared_at: newClearedAt,
      };
      setCurrentMember(updatedMember);
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedMember));
      } catch (e) {
        console.warn('Storage save error:', e);
      }
      const cutoffTime = new Date(newClearedAt).getTime();
      setMessages((prev) => prev.filter((m) => new Date(m.created_at).getTime() > cutoffTime));
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  // Handle Deleting Message
  const handleDeleteMessage = async (messageId: string) => {
    if (!currentMember) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    await chatService.deleteMessage(FIXED_ROOM_ID, messageId, currentMember.id);
  };

  // Handle Typing Ping
  const handleTyping = () => {
    if (!currentMember) return;
    chatService.sendTypingPing(FIXED_ROOM_ID, currentMember.display_name);
  };

  // Handle Reaction Toggle
  const handleToggleReaction = async (messageId: string, emoji: ReactionEmoji) => {
    if (!currentMember) return;

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = msg.reactions ? [...msg.reactions] : [];
        const existingIdx = reactions.findIndex(
          (r) => r.sender_id === currentMember.id && r.emoji === emoji
        );

        if (existingIdx >= 0) {
          reactions.splice(existingIdx, 1);
        } else {
          reactions.push({
            id: 'temp-' + Date.now(),
            room_id: FIXED_ROOM_ID,
            message_id: messageId,
            sender_id: currentMember.id,
            sender_name: currentMember.display_name,
            emoji,
            created_at: new Date().toISOString(),
          });
        }
        return { ...msg, reactions };
      })
    );

    await chatService.toggleReaction(
      FIXED_ROOM_ID,
      messageId,
      emoji,
      currentMember.id,
      currentMember.display_name
    );
  };

  // Handle Updating Pinned Notice
  const handleUpdateNotice = async (newNotice: string | null) => {
    if (!currentMember) return;

    const updated = await chatService.updatePinnedNotice(
      FIXED_ROOM_ID,
      newNotice,
      currentMember.display_name
    );
    setRoom(updated);
  };

  // Handle Household Checklist Actions
  const handleAddChecklistItem = async (text: string) => {
    if (!currentMember) return;
    const item = await chatService.addChecklistItem(FIXED_ROOM_ID, text, currentMember.display_name);
    setChecklistItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    if (!currentMember) return;
    setChecklistItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const nextCompleted = !i.is_completed;
        return {
          ...i,
          is_completed: nextCompleted,
          completed_by: nextCompleted ? currentMember.display_name : null,
        };
      })
    );
    await chatService.toggleChecklistItem(FIXED_ROOM_ID, itemId, currentMember.display_name);
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    setChecklistItems((prev) => prev.filter((i) => i.id !== itemId));
    await chatService.deleteChecklistItem(FIXED_ROOM_ID, itemId);
  };

  // Toggle Sound Notifications
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('family_chat_sound_enabled', String(nextVal));
  };

  // Resolve active background
  const currentTheme = BACKGROUND_THEMES.find((t) => t.id === themeId) || BACKGROUND_THEMES[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-2.5">
          <Loader2 className="w-6 h-6 text-[var(--text-primary)] animate-spin" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            جارِ فتح لَمّة العائلة...
          </span>
        </div>
      </div>
    );
  }

  if (!currentMember) {
    return <EntryScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div
      className={`flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden transition-all duration-300 ${
        themeId === 'velvet-ink' ? 'theme-velvet-ink' : 'theme-sakura-dusk'
      } ${customBackgroundUrl ? 'bg-cover bg-center' : currentTheme.bgClass}`}
      style={
        customBackgroundUrl
          ? {
              backgroundImage: `url(${customBackgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {/* 1. Desktop Family Control Sidebar (Visible on md+ screens) */}
      <DesktopSidebar
        currentMember={currentMember}
        room={room}
        membersWithStatus={membersWithStatus}
        messages={messages}
        currentThemeId={themeId}
        customBackgroundUrl={customBackgroundUrl}
        soundEnabled={soundEnabled}
        checklistItems={checklistItems}
        onAddChecklistItem={handleAddChecklistItem}
        onToggleChecklistItem={handleToggleChecklistItem}
        onDeleteChecklistItem={handleDeleteChecklistItem}
        onToggleSound={handleToggleSound}
        onSelectTheme={handleSelectTheme}
        onSetCustomBackground={handleSetCustomBackground}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPinnedNotice={() => setIsNoticeOpen(true)}
        onSwitchUser={handleSwitchUser}
        onImageClick={(url) => setEnlargedImage(url)}
      />

      {/* 2. Main Chat Area (Full width on mobile, flexible with centered feed on desktop) */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Compact Header */}
        <Header
          room={room}
          currentMember={currentMember}
          membersWithStatus={membersWithStatus}
          isNoticePinned={Boolean(room.pinned_notice)}
          isNoticeOpen={isNoticeOpen}
          typingUser={typingUser}
          headerClass={currentTheme.headerClass}
          isDark={currentTheme.isDark}
          pendingChecklistCount={checklistItems.filter((i) => !i.is_completed).length}
          onOpenChecklist={() => setIsChecklistModalOpen(true)}
          onToggleNotice={() => setIsNoticeOpen(!isNoticeOpen)}
          onOpenMembers={() => setIsMembersModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onClearChat={() => setIsClearChatOpen(true)}
        />

        {/* Sleek Collapsible Pinned Banner */}
        <PinnedNoticeBanner
          notice={room.pinned_notice || null}
          pinnedBy={room.pinned_by || null}
          pinnedAt={room.pinned_at || null}
          currentMemberName={currentMember.display_name}
          isOpen={isNoticeOpen}
          onToggleOpen={() => setIsNoticeOpen(!isNoticeOpen)}
          onUpdateNotice={handleUpdateNotice}
        />

        {/* Message Feed */}
        <MessageFeed
          messages={messages}
          currentMember={currentMember}
          onReply={(msg) => setReplyingTo(msg)}
          onToggleReaction={handleToggleReaction}
          onImageClick={(url) => setEnlargedImage(url)}
          onDeleteMessage={handleDeleteMessage}
        />

        {/* Compact Composer Bar */}
        <ComposerBar
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          composerClass={currentTheme.composerClass}
          isDark={currentTheme.isDark}
        />
      </div>

      {/* Image Lightbox */}
      <ImageViewerModal
        url={enlargedImage}
        onClose={() => setEnlargedImage(null)}
      />

      {/* Members Modal */}
      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        membersWithStatus={membersWithStatus}
        currentMember={currentMember}
      />

      {/* Household Checklist Modal for Mobile Viewports */}
      <ChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        items={checklistItems}
        currentMember={currentMember}
        onAddItem={handleAddChecklistItem}
        onToggleItem={handleToggleChecklistItem}
        onDeleteItem={handleDeleteChecklistItem}
      />

      {/* Settings Modal (Name, Nickname, Avatar Photo, Wallpaper) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentMember={currentMember}
        currentThemeId={themeId}
        customBackgroundUrl={customBackgroundUrl}
        onUpdateProfile={handleUpdateProfile}
        onSelectTheme={handleSelectTheme}
        onSetCustomBackground={handleSetCustomBackground}
        onSwitchUser={handleSwitchUser}
        onClearChat={() => {
          setIsSettingsOpen(false);
          setIsClearChatOpen(true);
        }}
      />

      {/* Per-User Clear Chat Confirmation Modal */}
      <ClearChatModal
        isOpen={isClearChatOpen}
        onClose={() => setIsClearChatOpen(false)}
        onConfirm={handleClearChatForMe}
      />
    </div>
  );
}
