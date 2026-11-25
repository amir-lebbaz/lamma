import { isSupabaseConfigured, supabase } from './supabase';
import { Member, MemberWithStatus, Message, Reaction, ReactionEmoji, Room, ChecklistItem } from '@/types';
import { compressPhotoForTransfer, saveMediaLocally } from './media-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { formatRelativeTime } from './format-date';
import { hashPassword } from './auth-utils';

const DEFAULT_ROOM_NAME = 'بيت العائلة';
const ONLINE_THRESHOLD_MS = 45 * 1000; // 45 seconds

function getStorageKey(key: string, roomId: string): string {
  return `family_chat_${roomId}_${key}`;
}

function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage error:', error);
  }
}

class ChatService {
  private channels = new Map<string, BroadcastChannel>();
  private presenceChannel: RealtimeChannel | null = null;
  private activePresenceIds = new Set<string>();

  private getBroadcastChannel(roomId: string): BroadcastChannel | null {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return null;
    }
    if (!this.channels.has(roomId)) {
      this.channels.set(roomId, new BroadcastChannel(`family_chat_${roomId}`));
    }
    return this.channels.get(roomId)!;
  }

  async getRoom(roomId: string): Promise<Room> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('family_rooms')
          .select('*')
          .eq('id', roomId)
          .maybeSingle();

        if (error) throw error;
        if (data) return data as Room;

        const newRoom: Room = {
          id: roomId,
          name: DEFAULT_ROOM_NAME,
          pinned_notice: null,
          pinned_by: null,
          pinned_at: null,
          created_at: new Date().toISOString(),
        };

        const { data: created, error: insertError } = await supabase
          .from('family_rooms')
          .insert(newRoom)
          .select()
          .single();

        if (!insertError && created) return created as Room;
      } catch (err) {
        console.warn('Supabase getRoom fallback:', err);
      }
    }

    const key = getStorageKey('room_info', roomId);
    const existing = safeGetItem<Room | null>(key, null);
    if (existing) {
      // Purge legacy demo notice if present
      if (existing.pinned_notice?.includes('المبارك يوم الجمعة') || existing.pinned_by === 'الوالد') {
        existing.pinned_notice = null;
        existing.pinned_by = null;
        existing.pinned_at = null;
        safeSetItem(key, existing);
      }
      return existing;
    }

    const initialRoom: Room = {
      id: roomId,
      name: DEFAULT_ROOM_NAME,
      pinned_notice: null,
      pinned_by: null,
      pinned_at: null,
      created_at: new Date().toISOString(),
    };
    safeSetItem(key, initialRoom);
    return initialRoom;
  }

  async updatePinnedNotice(
    roomId: string,
    notice: string | null,
    pinnedBy: string | null
  ): Promise<Room> {
    const pinnedAt = notice ? new Date().toISOString() : null;
    const author = notice ? pinnedBy : null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('family_rooms')
          .update({
            pinned_notice: notice,
            pinned_by: author,
            pinned_at: pinnedAt,
          })
          .eq('id', roomId)
          .select()
          .single();

        if (!error && data) {
          return data as Room;
        }
      } catch (err) {
        console.warn('Supabase updatePinnedNotice fallback:', err);
      }
    }

    const currentRoom = await this.getRoom(roomId);
    const updated: Room = {
      ...currentRoom,
      pinned_notice: notice,
      pinned_by: author,
      pinned_at: pinnedAt,
    };

    safeSetItem(getStorageKey('room_info', roomId), updated);

    const channel = this.getBroadcastChannel(roomId);
    if (channel) {
      channel.postMessage({
        type: 'ROOM_UPDATE',
        payload: updated,
      });
    }

    return updated;
  }

  async getMessages(roomId: string = 'bayt-al-aela', clearedAt?: string | null): Promise<Message[]> {
    const cutoffMs = clearedAt ? new Date(clearedAt).getTime() : 0;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: messages, error } = await supabase
          .from('family_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Supabase getMessages error:', error);
        } else if (messages) {
          const { data: reactions } = await supabase
            .from('family_reactions')
            .select('*');

          const reactionsByMsg = (reactions || []).reduce<Record<string, Reaction[]>>(
            (acc, r) => {
              acc[r.message_id] = acc[r.message_id] || [];
              acc[r.message_id].push(r);
              return acc;
            },
            {}
          );

          // Filter out checklist records, legacy demo messages, and messages before per-user cleared_at cutoff
          const filtered = messages.filter(
            (m) =>
              !m.id.startsWith('checklist-') &&
              !m.id.startsWith('demo-') &&
              !(m.content && m.content.startsWith('__CHECKLIST__')) &&
              (!cutoffMs || new Date(m.created_at).getTime() > cutoffMs)
          );

          // Auto-cache any received live image payloads into IndexedDB before Supabase purges them
          filtered.forEach((m) => {
            if (m.image_url && m.image_url.startsWith('data:')) {
              const imageId = m.image_id || (m.image_url.startsWith('media-stub:') ? m.image_url.replace('media-stub:', '') : m.id);
              saveMediaLocally(imageId, m.image_url).catch(() => {});
            }
          });

          return filtered.map((m) => ({
            ...m,
            reactions: reactionsByMsg[m.id] || [],
          }));
        }
      } catch (err) {
        console.error('Supabase getMessages fallback:', err);
      }
    }

    const key = getStorageKey('messages', roomId);
    const local = safeGetItem<Message[]>(key, []);
    const clean = local.filter(
      (m) =>
        !m.id.startsWith('demo-') &&
        !m.id.startsWith('checklist-') &&
        !(m.content && m.content.startsWith('__CHECKLIST__')) &&
        (!cutoffMs || new Date(m.created_at).getTime() > cutoffMs)
    );
    if (clean.length !== local.length && !cutoffMs) {
      safeSetItem(key, clean);
    }
    return clean;
  }

  async sendMessage(
    roomId: string = 'bayt-al-aela',
    messageData: Omit<Message, 'id' | 'created_at' | 'reactions'>
  ): Promise<Message> {
    const isUrgent = Boolean(messageData.is_urgent);
    const msgId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    const newMessage: Message = {
      ...messageData,
      id: msgId,
      room_id: roomId,
      message_type: messageData.message_type || (isUrgent ? 'urgent' : (messageData.image_url ? 'image' : 'text')),
      is_urgent: isUrgent,
      created_at: new Date().toISOString(),
      reactions: [],
    };

    // If message contains an image, manage local caching and ephemeral transfer
    const imagePayload = newMessage.image_url;
    let imageId = newMessage.image_id;

    if (imagePayload && imagePayload.startsWith('data:')) {
      if (!imageId) {
        imageId = 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        newMessage.image_id = imageId;
      }
      // 1. Immediately store sent image in local IndexedDB
      saveMediaLocally(imageId, imagePayload).catch(() => {});

      // 2. Broadcast ephemeral image payload to all online clients in realtime
      this.broadcastImage(roomId, imageId, imagePayload);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('family_messages')
          .insert({
            id: newMessage.id,
            room_id: newMessage.room_id,
            sender_id: newMessage.sender_id,
            sender_name: newMessage.sender_name,
            sender_nickname: newMessage.sender_nickname || null,
            sender_color: newMessage.sender_color,
            sender_avatar_url: newMessage.sender_avatar_url || null,
            content: newMessage.content,
            message_type: newMessage.message_type || (newMessage.is_urgent ? 'urgent' : (newMessage.image_url ? 'image' : 'text')),
            is_urgent: Boolean(newMessage.is_urgent),
            image_url: newMessage.image_url || null,
            audio_url: null,
            reply_to_id: newMessage.reply_to_id || null,
            reply_to_text: newMessage.reply_to_text || null,
            reply_to_sender: newMessage.reply_to_sender || null,
            created_at: newMessage.created_at,
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase sendMessage error:', error);
        } else if (data) {
          // Zero-Database-Quota Auto-Purge:
          // Purge base64 payload from Supabase after 10 seconds, leaving only lightweight stub 'media-stub:<image_id>'
          if (imagePayload && imagePayload.startsWith('data:') && imageId) {
            const currentMsgId = data.id;
            const targetImageId = imageId;
            setTimeout(async () => {
              try {
                if (supabase) {
                  await supabase
                    .from('family_messages')
                    .update({ image_url: `media-stub:${targetImageId}` })
                    .eq('id', currentMsgId);
                }
              } catch (purgeErr) {
                console.warn('Auto-purge image stub error:', purgeErr);
              }
            }, 10000);
          }

          return { ...data, reactions: [] };
        }
      } catch (err) {
        console.error('Supabase sendMessage catch:', err);
      }
    }

    const key = getStorageKey('messages', roomId);
    const existing = safeGetItem<Message[]>(key, []);
    const updated = [...existing, newMessage];
    safeSetItem(key, updated);

    const channel = this.getBroadcastChannel(roomId);
    if (channel) {
      channel.postMessage({
        type: 'NEW_MESSAGE',
        payload: newMessage,
      });
    }

    return newMessage;
  }

  async toggleReaction(
    roomId: string,
    messageId: string,
    emoji: ReactionEmoji,
    memberId: string,
    memberName: string
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existing } = await supabase
          .from('family_reactions')
          .select('id')
          .eq('message_id', messageId)
          .eq('sender_id', memberId)
          .eq('emoji', emoji)
          .maybeSingle();

        if (existing) {
          await supabase.from('family_reactions').delete().eq('id', existing.id);
        } else {
          await supabase.from('family_reactions').insert({
            id: 'react-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            room_id: roomId,
            message_id: messageId,
            sender_id: memberId,
            sender_name: memberName,
            emoji,
            created_at: new Date().toISOString(),
          });
        }
        return;
      } catch (err) {
        console.warn('Supabase toggleReaction fallback:', err);
      }
    }

    const key = getStorageKey('messages', roomId);
    const messages = safeGetItem<Message[]>(key, []);
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = messages[msgIndex];
    const reactions = targetMsg.reactions ? [...targetMsg.reactions] : [];
    const reactIndex = reactions.findIndex(
      (r) => r.sender_id === memberId && r.emoji === emoji
    );

    let action: 'INSERT' | 'DELETE' = 'INSERT';
    let changedReaction: Reaction;

    if (reactIndex >= 0) {
      changedReaction = reactions[reactIndex];
      reactions.splice(reactIndex, 1);
      action = 'DELETE';
    } else {
      changedReaction = {
        id: 'react-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        room_id: roomId,
        message_id: messageId,
        sender_id: memberId,
        sender_name: memberName,
        emoji,
        created_at: new Date().toISOString(),
      };
      reactions.push(changedReaction);
      action = 'INSERT';
    }

    messages[msgIndex] = {
      ...targetMsg,
      reactions,
    };
    safeSetItem(key, messages);

    const channel = this.getBroadcastChannel(roomId);
    if (channel) {
      channel.postMessage({
        type: 'REACTION_TOGGLED',
        payload: {
          messageId,
          reaction: changedReaction,
          action,
        },
      });
    }
  }

  // Zero-Database-Quota Photo Processing: HTML5 Canvas compression (max 900px, 0.72 quality)
  // Saved directly into local IndexedDB ('lamma-media-db')
  async uploadPhoto(roomId: string, file: File): Promise<{ dataUrl: string; imageId: string }> {
    const { dataUrl, imageId } = await compressPhotoForTransfer(file, 900, 0.72);
    await saveMediaLocally(imageId, dataUrl);
    return { dataUrl, imageId };
  }

  // Broadcast ephemeral image to peers over realtime broadcast channel
  broadcastImage(roomId: string, imageId: string, dataUrl: string): void {
    const channel = this.getBroadcastChannel(roomId);
    if (channel) {
      channel.postMessage({
        type: 'IMAGE_BROADCAST',
        payload: { imageId, dataUrl },
      });
    }
  }

  // Shared Household Checklist (نواقص البيت) methods
  async getChecklist(roomId: string = 'bayt-al-aela'): Promise<ChecklistItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('family_messages')
          .select('content')
          .eq('id', `checklist-${roomId}`)
          .maybeSingle();

        if (!error && data?.content && data.content.startsWith('__CHECKLIST__')) {
          const parsed: ChecklistItem[] = JSON.parse(data.content.slice('__CHECKLIST__'.length));
          safeSetItem(getStorageKey('checklist', roomId), parsed);
          return parsed;
        }
      } catch (err) {
        console.warn('Supabase getChecklist fallback:', err);
      }
    }

    const key = getStorageKey('checklist', roomId);
    return safeGetItem<ChecklistItem[]>(key, []);
  }

  async saveChecklist(roomId: string, items: ChecklistItem[]): Promise<void> {
    const key = getStorageKey('checklist', roomId);
    safeSetItem(key, items);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('family_messages').upsert({
          id: `checklist-${roomId}`,
          room_id: roomId,
          sender_id: 'system',
          sender_name: 'نواقص البيت',
          sender_color: '#415F45',
          content: '__CHECKLIST__' + JSON.stringify(items),
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveChecklist error:', err);
      }
    }

    const channel = this.getBroadcastChannel(roomId);
    if (channel) {
      channel.postMessage({
        type: 'CHECKLIST_UPDATE',
        payload: items,
      });
    }
  }

  async addChecklistItem(roomId: string, text: string, addedBy: string): Promise<ChecklistItem> {
    const items = await this.getChecklist(roomId);
    const newItem: ChecklistItem = {
      id: 'chk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      room_id: roomId,
      text: text.trim(),
      is_completed: false,
      added_by: addedBy,
      created_at: new Date().toISOString(),
    };
    const updated = [newItem, ...items];
    await this.saveChecklist(roomId, updated);
    return newItem;
  }

  async toggleChecklistItem(roomId: string, itemId: string, completedBy: string): Promise<void> {
    const items = await this.getChecklist(roomId);
    const updated = items.map((item) => {
      if (item.id !== itemId) return item;
      const nextCompleted = !item.is_completed;
      return {
        ...item,
        is_completed: nextCompleted,
        completed_by: nextCompleted ? completedBy : null,
      };
    });
    await this.saveChecklist(roomId, updated);
  }

  async deleteChecklistItem(roomId: string, itemId: string): Promise<void> {
    const items = await this.getChecklist(roomId);
    const updated = items.filter((item) => item.id !== itemId);
    await this.saveChecklist(roomId, updated);
  }

  // Delete message for sender
  async deleteMessage(roomId: string, messageId: string, memberId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('family_messages')
          .delete()
          .eq('id', messageId)
          .eq('sender_id', memberId);
      } catch (err) {
        console.warn('Supabase deleteMessage error:', err);
      }
    }

    const key = getStorageKey('messages', roomId);
    const existing = safeGetItem<Message[]>(key, []);
    const updated = existing.filter((m) => m.id !== messageId);
    safeSetItem(key, updated);

    const channel = this.getBroadcastChannel(roomId);
    if (channel) {
      channel.postMessage({
        type: 'MESSAGE_DELETED',
        payload: messageId,
      });
    }
  }

  // Per-user non-destructive Clear Chat (Delete for Me Only)
  async clearChatForMember(roomId: string = 'bayt-al-aela', member: Member): Promise<string> {
    const clearedAt = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('family_members')
          .update({ cleared_at: clearedAt })
          .eq('id', member.id);
      } catch (err) {
        console.warn('Supabase clearChatForMember error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`family_chat_cleared_at_${member.id}`, clearedAt);
      } catch (e) {
        console.warn('localStorage clearChat save error:', e);
      }
    }

    return clearedAt;
  }

  // Broadcast typing status
  sendTypingPing(roomId: string, memberName: string): void {
    const channel = this.getBroadcastChannel(roomId);
    if (channel) {
      channel.postMessage({
        type: 'TYPING',
        payload: { memberName },
      });
    }
  }

  // Authenticate member with name & password
  async loginMember(displayName: string, password: string): Promise<Member> {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      throw new Error('يرجى كتابة اسمك');
    }
    if (!password || password.trim().length < 4) {
      throw new Error('يرجى إدخال كلمة سر مكونة من 4 أحرف أو أرقام على الأقل');
    }

    const hashedPassword = await hashPassword(password);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: members, error } = await supabase
          .from('family_members')
          .select('*')
          .ilike('display_name', trimmedName)
          .not('display_name', 'like', '%_قديم%')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase loginMember error:', error);
          throw new Error('تعذر الاتصال بقاعدة البيانات، يرجى المحاولة لاحقاً');
        }

        if (!members || members.length === 0) {
          throw new Error('لا يوجد حساب مسجل بهذا الاسم. يرجى إنشاء حساب جديد.');
        }

        const target = members[0];

        // If member already has a password set, verify it
        if (target.password_hash) {
          if (target.password_hash !== hashedPassword) {
            throw new Error('كلمة السر غير صحيحة لهذا الاسم');
          }
        } else {
          // Legacy member claiming their account with password for the first time
          await supabase
            .from('family_members')
            .update({ password_hash: hashedPassword, last_seen_at: new Date().toISOString() })
            .eq('id', target.id);
        }

        const member: Member = {
          id: target.id,
          room_id: target.room_id || 'bayt-al-aela',
          display_name: target.display_name,
          nickname: target.nickname || null,
          avatar_color: target.avatar_color,
          avatar_url: target.avatar_url || null,
          cleared_at: target.cleared_at || null,
          last_seen_at: new Date().toISOString(),
          created_at: target.created_at,
        };

        return member;
      } catch (err: any) {
        if (err.message) throw err;
        throw new Error('حدث خطأ أثناء تسجيل الدخول');
      }
    }

    // Fallback / Offline mode
    const key = 'family_chat_accounts';
    const accounts = safeGetItem<Record<string, { member: Member; passwordHash: string }>>(key, {});
    const lowerName = trimmedName.toLowerCase();
    const entry = Object.values(accounts).find(
      (a) => a.member.display_name.trim().toLowerCase() === lowerName
    );

    if (!entry) {
      throw new Error('لا يوجد حساب مسجل بهذا الاسم. يرجى إنشاء حساب جديد.');
    }

    if (entry.passwordHash !== hashedPassword) {
      throw new Error('كلمة السر غير صحيحة لهذا الاسم');
    }

    return entry.member;
  }

  // Register new member with unique name & password
  async registerMember(
    displayName: string,
    password: string,
    avatarColor: string
  ): Promise<Member> {
    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('يرجى كتابة اسم مكون من حرفين على الأقل');
    }
    if (trimmedName.length > 25) {
      throw new Error('الاسم طويل جداً (الحد الأقصى 25 حرف)');
    }
    if (!password || password.trim().length < 4) {
      throw new Error('يرجى كتابة كلمة سر مكونة من 4 أحرف أو أرقام على الأقل');
    }

    const hashedPassword = await hashPassword(password);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existing, error: searchError } = await supabase
          .from('family_members')
          .select('id, display_name, password_hash')
          .ilike('display_name', trimmedName)
          .not('display_name', 'like', '%_قديم%');

        if (searchError) {
          console.error('Supabase register search error:', searchError);
        }

        if (existing && existing.length > 0) {
          throw new Error('هذا الاسم مسجل مسبقاً في العائلة. يرجى اختيار اسم آخر أو تسجيل الدخول.');
        }

        const newId = 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const nowIso = new Date().toISOString();

        const insertPayload = {
          id: newId,
          room_id: 'bayt-al-aela',
          display_name: trimmedName,
          nickname: null,
          avatar_color: avatarColor,
          avatar_url: null,
          password_hash: hashedPassword,
          last_seen_at: nowIso,
          created_at: nowIso,
        };

        const { data, error } = await supabase
          .from('family_members')
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          console.error('Supabase register insert error:', error);
          throw new Error('تعذر حفظ الحساب، يرجى المحاولة لاحقاً');
        }

        const member: Member = {
          id: data.id,
          room_id: data.room_id,
          display_name: data.display_name,
          nickname: data.nickname || null,
          avatar_color: data.avatar_color,
          avatar_url: data.avatar_url || null,
          cleared_at: data.cleared_at || null,
          last_seen_at: data.last_seen_at,
          created_at: data.created_at,
        };

        return member;
      } catch (err: any) {
        if (err.message) throw err;
        throw new Error('حدث خطأ أثناء إنشاء الحساب');
      }
    }

    // Fallback / Offline mode
    const key = 'family_chat_accounts';
    const accounts = safeGetItem<Record<string, { member: Member; passwordHash: string }>>(key, {});
    const lowerName = trimmedName.toLowerCase();
    const existing = Object.values(accounts).some(
      (a) => a.member.display_name.trim().toLowerCase() === lowerName
    );

    if (existing) {
      throw new Error('هذا الاسم مسجل مسبقاً في العائلة. يرجى اختيار اسم آخر أو تسجيل الدخول.');
    }

    const newId = 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newMember: Member = {
      id: newId,
      room_id: 'bayt-al-aela',
      display_name: trimmedName,
      nickname: null,
      avatar_color: avatarColor,
      avatar_url: null,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    accounts[newId] = {
      member: newMember,
      passwordHash: hashedPassword,
    };
    safeSetItem(key, accounts);

    return newMember;
  }

  // Update profile from settings with unique name check
  async updateMemberProfile(
    currentMemberId: string,
    updated: {
      displayName: string;
      nickname: string | null;
      avatarColor: string;
      avatarUrl: string | null;
    }
  ): Promise<Member> {
    const trimmedName = updated.displayName.trim();
    if (!trimmedName) {
      throw new Error('يرجى كتابة الاسم');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Check if new name is already taken by another registered member
        const { data: existingWithSameName } = await supabase
          .from('family_members')
          .select('id, display_name')
          .ilike('display_name', trimmedName)
          .neq('id', currentMemberId)
          .not('display_name', 'like', '%_قديم%');

        if (existingWithSameName && existingWithSameName.length > 0) {
          throw new Error('هذا الاسم مستخدم مسبقاً من قِبل فرد آخر في العائلة');
        }

        const { data, error } = await supabase
          .from('family_members')
          .update({
            display_name: trimmedName,
            nickname: updated.nickname || null,
            avatar_color: updated.avatarColor,
            avatar_url: updated.avatarUrl || null,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', currentMemberId)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          return {
            id: data.id,
            room_id: data.room_id,
            display_name: data.display_name,
            nickname: data.nickname || null,
            avatar_color: data.avatar_color,
            avatar_url: data.avatar_url || null,
            last_seen_at: data.last_seen_at,
            created_at: data.created_at,
          };
        }
      } catch (err: any) {
        if (err.message) throw err;
        throw new Error('حدث خطأ أثناء تحديث الملف الشخصي');
      }
    }

    return {
      id: currentMemberId,
      room_id: 'bayt-al-aela',
      display_name: trimmedName,
      nickname: updated.nickname || null,
      avatar_color: updated.avatarColor,
      avatar_url: updated.avatarUrl || null,
      last_seen_at: new Date().toISOString(),
    };
  }

  // Register real member and track heartbeat
  async registerPresence(roomId: string, member: Member): Promise<void> {
    const nowIso = new Date().toISOString();
    const updatedMember = {
      ...member,
      last_seen_at: nowIso,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('family_members')
          .update({
            last_seen_at: nowIso,
          })
          .eq('id', updatedMember.id);
      } catch (err) {
        console.warn('Supabase presence update error:', err);
      }
    }

    const key = getStorageKey('members', roomId);
    const existing = safeGetItem<Record<string, Member>>(key, {});
    existing[member.id] = updatedMember;
    safeSetItem(key, existing);

    const channel = this.getBroadcastChannel(roomId);
    if (channel) {
      channel.postMessage({
        type: 'PRESENCE_PING',
        payload: updatedMember,
      });
    }
  }

  // Leave presence (set last seen to past or send leave)
  async leavePresence(roomId: string, member: Member): Promise<void> {
    const pastIso = new Date(Date.now() - 60000).toISOString();
    const offlineMember = { ...member, last_seen_at: pastIso };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('family_members')
          .update({ last_seen_at: pastIso })
          .eq('id', member.id);
        if (this.presenceChannel) {
          await this.presenceChannel.untrack();
        }
      } catch (err) {
        console.warn('Leave presence error:', err);
      }
    }

    const key = getStorageKey('members', roomId);
    const existing = safeGetItem<Record<string, Member>>(key, {});
    if (existing[member.id]) {
      existing[member.id] = offlineMember;
      safeSetItem(key, existing);
    }

    const channel = this.getBroadcastChannel(roomId);
    if (channel) {
      channel.postMessage({
        type: 'PRESENCE_LEAVE',
        payload: member.id,
      });
    }
  }

  // Get all registered members in a room
  async getMembers(roomId: string = 'bayt-al-aela'): Promise<Member[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('room_id', roomId)
          .not('display_name', 'like', '%_قديم%')
          .order('display_name', { ascending: true });
        if (!error && data) return data as Member[];
      } catch (err) {
        console.warn('Supabase getMembers error:', err);
      }
    }
    const key = getStorageKey('members', roomId);
    const membersMap = safeGetItem<Record<string, Member>>(key, {});
    return Object.values(membersMap).filter(
      (m) => !m.id.startsWith('member-') && !m.display_name.includes('_قديم')
    );
  }

  // Get REAL members list with true Online / Offline statuses
  async getAllMembersWithStatus(roomId: string, currentMemberId: string): Promise<MemberWithStatus[]> {
    let allMembers: Member[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('room_id', roomId)
          .not('display_name', 'like', '%_قديم%')
          .order('last_seen_at', { ascending: false });

        if (!error && data) {
          allMembers = data as Member[];
        }
      } catch (err) {
        console.warn('Supabase getAllMembers error:', err);
      }
    }

    if (allMembers.length === 0) {
      const key = getStorageKey('members', roomId);
      const membersMap = safeGetItem<Record<string, Member>>(key, {});
      allMembers = Object.values(membersMap).filter(
        (m) => !m.id.startsWith('member-') && !m.display_name.includes('_قديم')
      );
    } else {
      allMembers = allMembers.filter(
        (m) => !m.id.startsWith('member-') && !m.display_name.includes('_قديم')
      );
    }

    const now = Date.now();

    return allMembers.map((m) => {
      const isCurrent = m.id === currentMemberId;
      const lastSeenMs = new Date(m.last_seen_at).getTime();
      const diffMs = now - lastSeenMs;

      // Online if current user, or active in presence channel, or heartbeat within last 45s
      const isOnline = isCurrent || this.activePresenceIds.has(m.id) || diffMs < ONLINE_THRESHOLD_MS;

      let lastSeenText = 'متصل الآن';
      if (!isOnline) {
        lastSeenText = `آخر ظهور ${formatRelativeTime(m.last_seen_at)}`;
      }

      return {
        member: m,
        isOnline,
        lastSeenText,
      };
    }).sort((a, b) => {
      // Online first, then by last seen
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return new Date(b.member.last_seen_at).getTime() - new Date(a.member.last_seen_at).getTime();
    });
  }

  subscribeToRoom(
    roomId: string,
    currentMember: Member,
    callbacks: {
      onMessage?: (msg: Message) => void;
      onMessageUpdated?: (msg: Message) => void;
      onMessageDeleted?: (messageId: string) => void;
      onReaction?: (payload: { messageId: string; reaction: Reaction; action: 'INSERT' | 'DELETE' }) => void;
      onRoomUpdate?: (room: Partial<Room>) => void;
      onPresenceChange?: () => void;
      onTyping?: (payload: { memberName: string }) => void;
      onChecklistUpdate?: (items: ChecklistItem[]) => void;
    }
  ): () => void {
    const channel = this.getBroadcastChannel(roomId);

    const onBroadcastMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'NEW_MESSAGE' && callbacks.onMessage) {
        if (currentMember.cleared_at) {
          if (new Date(data.payload.created_at).getTime() <= new Date(currentMember.cleared_at).getTime()) {
            return;
          }
        }
        callbacks.onMessage(data.payload);
      } else if (data.type === 'MESSAGE_UPDATED' && callbacks.onMessageUpdated) {
        callbacks.onMessageUpdated(data.payload);
      } else if (data.type === 'MESSAGE_DELETED' && callbacks.onMessageDeleted) {
        callbacks.onMessageDeleted(data.payload);
      } else if (data.type === 'TYPING' && callbacks.onTyping) {
        callbacks.onTyping(data.payload);
      } else if (data.type === 'REACTION_TOGGLED' && callbacks.onReaction) {
        callbacks.onReaction(data.payload);
      } else if (data.type === 'ROOM_UPDATE' && callbacks.onRoomUpdate) {
        callbacks.onRoomUpdate(data.payload);
      } else if (data.type === 'IMAGE_BROADCAST' && data.payload) {
        saveMediaLocally(data.payload.imageId, data.payload.dataUrl).catch(() => {});
      } else if (data.type === 'CHECKLIST_UPDATE' && callbacks.onChecklistUpdate) {
        callbacks.onChecklistUpdate(data.payload);
      } else if (data.type === 'PRESENCE_PING') {
        this.activePresenceIds.add(data.payload.id);
        callbacks.onPresenceChange?.();
      } else if (data.type === 'PRESENCE_LEAVE') {
        this.activePresenceIds.delete(data.payload);
        callbacks.onPresenceChange?.();
      }
    };

    if (channel) {
      channel.addEventListener('message', onBroadcastMessage);
    }

    let supabaseChannel: RealtimeChannel | null = null;

    if (isSupabaseConfigured && supabase) {
      try {
        // Track real-time presence
        this.presenceChannel = supabase.channel(`presence_${roomId}`, {
          config: { presence: { key: currentMember.id } },
        });

        this.presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const state = this.presenceChannel?.presenceState() || {};
            this.activePresenceIds.clear();
            Object.keys(state).forEach((key) => {
              this.activePresenceIds.add(key);
            });
            callbacks.onPresenceChange?.();
          })
          .on('presence', { event: 'join' }, ({ key }) => {
            this.activePresenceIds.add(key);
            callbacks.onPresenceChange?.();
          })
          .on('presence', { event: 'leave' }, ({ key }) => {
            this.activePresenceIds.delete(key);
            callbacks.onPresenceChange?.();
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await this.presenceChannel?.track({
                id: currentMember.id,
                display_name: currentMember.display_name,
                avatar_color: currentMember.avatar_color,
                online_at: new Date().toISOString(),
              });
            }
          });

        // Shared cross-platform Postgres changes channel for family_messages
        supabaseChannel = supabase
          .channel('lamma-room-channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'family_messages', filter: `room_id=eq.${roomId}` },
            (payload) => {
              const newRecord = payload.new as any;
              // Check if record is a shared checklist update
              if (
                newRecord &&
                (newRecord.id?.startsWith('checklist-') ||
                  (newRecord.content && newRecord.content.startsWith('__CHECKLIST__')))
              ) {
                if (callbacks.onChecklistUpdate) {
                  try {
                    const items = JSON.parse(newRecord.content.slice('__CHECKLIST__'.length));
                    callbacks.onChecklistUpdate(items);
                  } catch (e) {
                    console.warn('Error parsing realtime checklist:', e);
                  }
                }
                return;
              }

              if (payload.eventType === 'INSERT' && callbacks.onMessage) {
                const msg = payload.new as Message;
                // Per-user clear chat cutoff
                if (currentMember.cleared_at) {
                  if (new Date(msg.created_at).getTime() <= new Date(currentMember.cleared_at).getTime()) {
                    return;
                  }
                }
                if (msg.image_url && msg.image_url.startsWith('data:')) {
                  const imageId = msg.image_id || (msg.image_url.startsWith('media-stub:') ? msg.image_url.replace('media-stub:', '') : msg.id);
                  saveMediaLocally(imageId, msg.image_url).catch(() => {});
                }
                callbacks.onMessage({ ...msg, reactions: [] });
              } else if (payload.eventType === 'UPDATE') {
                const updatedMsg = payload.new as Message;
                if (callbacks.onMessageUpdated) {
                  callbacks.onMessageUpdated(updatedMsg);
                }
              } else if (payload.eventType === 'DELETE' && callbacks.onMessageDeleted) {
                const deletedId = (payload.old as { id?: string })?.id;
                if (deletedId) callbacks.onMessageDeleted(deletedId);
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'family_reactions' },
            (payload) => {
              if (callbacks.onReaction) {
                const action = payload.eventType === 'DELETE' ? 'DELETE' : 'INSERT';
                const reaction = (payload.new || payload.old) as Reaction;
                callbacks.onReaction({
                  messageId: reaction.message_id,
                  reaction,
                  action,
                });
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'family_rooms' },
            (payload) => {
              if (callbacks.onRoomUpdate) {
                callbacks.onRoomUpdate(payload.new as Room);
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'family_members' },
            () => {
              callbacks.onPresenceChange?.();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase real-time subscribe error:', err);
      }
    }

    return () => {
      if (channel) {
        channel.removeEventListener('message', onBroadcastMessage);
      }
      if (this.presenceChannel && supabase) {
        this.presenceChannel.untrack();
        supabase.removeChannel(this.presenceChannel);
        this.presenceChannel = null;
      }
      if (supabaseChannel && supabase) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }
}

export const chatService = new ChatService();
