export interface Member {
  id: string;
  room_id: string;
  display_name: string;
  nickname?: string | null;
  avatar_color: string;
  avatar_url?: string | null;
  last_seen_at: string;
  created_at?: string;
}

export interface MemberWithStatus {
  member: Member;
  isOnline: boolean;
  lastSeenText: string;
}

export interface Reaction {
  id: string;
  room_id: string;
  message_id: string;
  sender_id: string;
  sender_name: string;
  emoji: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  room_id: string;
  text: string;
  is_completed: boolean;
  added_by: string;
  completed_by?: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_nickname?: string | null;
  sender_color: string;
  sender_avatar_url?: string | null;
  content: string;
  image_url?: string | null;
  image_id?: string | null;
  audio_url?: string | null; // deprecated / stripped
  reply_to_id?: string | null;
  reply_to_text?: string | null;
  reply_to_sender?: string | null;
  created_at: string;
  reactions?: Reaction[];
}

export interface Room {
  id: string;
  name: string;
  pinned_notice?: string | null;
  pinned_by?: string | null;
  pinned_at?: string | null;
  created_at?: string;
}

export type ReactionEmoji = '❤️' | '👍' | '😂' | '🤲';

export const ALLOWED_EMOJIS: ReactionEmoji[] = ['❤️', '👍', '😂', '🤲'];

export const AVATAR_COLORS = [
  '#FADCD5', // soft warm rose/peach
  '#A8DADC', // powder ice teal
  '#F4A261', // sandy coral amber
  '#CDB4DB', // pastel lavender
  '#B5B9BC', // refined silver mist
  '#E9C46A', // muted sunflower gold
  '#90BE6D', // sage pistachio green
  '#F28482', // warm terracotta coral
];

export interface BackgroundTheme {
  id: string;
  name: string;
  description?: string;
  bgClass: string;
  headerClass: string;
  composerClass: string;
  isDark: boolean;
  colorPreview: string;
  accentColor: string;
  surfaceColor: string;
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: 'sakura-dusk',
    name: 'سكون الغسق',
    description: 'درجات الغسق الدافئة وأرجواني الليل الحالم',
    bgClass: 'theme-sakura-dusk bg-[#1B0C1A] text-[#FADCD5]',
    headerClass: 'bg-[#2D222F]/90 backdrop-blur-md border-b border-[#FADCD5]/12 text-[#FADCD5]',
    composerClass: 'bg-[#2D222F]/90 backdrop-blur-md border-t border-[#FADCD5]/12 text-[#FADCD5]',
    isDark: true,
    colorPreview: '#6D3C52',
    accentColor: '#FADCD5',
    surfaceColor: '#2D222F',
  },
  {
    id: 'velvet-ink',
    name: 'ليل المخمل',
    description: 'كحلي ناعم ورمادي مخملي فخم وهادئ',
    bgClass: 'theme-velvet-ink bg-[#0B1421] text-[#B5B9BC]',
    headerClass: 'bg-[#283041]/90 backdrop-blur-md border-b border-[#B5B9BC]/12 text-[#B5B9BC]',
    composerClass: 'bg-[#283041]/90 backdrop-blur-md border-t border-[#B5B9BC]/12 text-[#B5B9BC]',
    isDark: true,
    colorPreview: '#34394A',
    accentColor: '#B5B9BC',
    surfaceColor: '#283041',
  },
];
