'use client';

import React, { useState } from 'react';
import { ChecklistItem, Member } from '@/types';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react';

interface HouseholdChecklistProps {
  items: ChecklistItem[];
  currentMember: Member;
  onAddItem: (text: string) => Promise<void>;
  onToggleItem: (itemId: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  isCompact?: boolean;
}

export default function HouseholdChecklist({
  items,
  currentMember,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  isCompact = false,
}: HouseholdChecklistProps) {
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const pendingItems = items.filter((i) => !i.is_completed);
  const completedItems = items.filter((i) => i.is_completed);

  const displayedItems =
    filter === 'pending'
      ? pendingItems
      : filter === 'completed'
      ? completedItems
      : items;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddItem(trimmed);
      setNewText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2.5">
      {/* Header with counter badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>نواقص البيت</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/25 text-[var(--accent)] font-bold border border-[var(--border)]/40">
            {pendingItems.length} متبقي
          </span>
        </div>
      </div>

      {/* Add new item input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="إضافة غرض (مثال: حليب، خبز...)"
          maxLength={60}
          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-xl bg-black/20 border border-[var(--border)]/50 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition"
        />
        <button
          type="submit"
          disabled={!newText.trim() || isSubmitting}
          className="p-1.5 rounded-xl bg-[var(--bubble-outgoing)] text-[var(--accent)] hover:opacity-90 transition active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 border border-[var(--border)]/40"
          title="إضافة"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Filter tabs */}
      {!isCompact && items.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] select-none">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded-lg transition ${
              filter === 'all'
                ? 'bg-[var(--bubble-outgoing)] text-[var(--accent)] font-bold'
                : 'text-[var(--text-muted)] hover:bg-white/5'
            }`}
          >
            الكل ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-2 py-0.5 rounded-lg transition ${
              filter === 'pending'
                ? 'bg-[var(--bubble-outgoing)] text-[var(--accent)] font-bold'
                : 'text-[var(--text-muted)] hover:bg-white/5'
            }`}
          >
            نواقص ({pendingItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-2 py-0.5 rounded-lg transition ${
              filter === 'completed'
                ? 'bg-[var(--bubble-outgoing)] text-[var(--accent)] font-bold'
                : 'text-[var(--text-muted)] hover:bg-white/5'
            }`}
          >
            تم شراؤها ({completedItems.length})
          </button>
        </div>
      )}

      {/* Checklist Items list */}
      <div
        className={`space-y-1.5 overflow-y-auto pr-0.5 smooth-scroll ${
          isCompact ? 'max-h-40' : 'max-h-56'
        }`}
      >
        {displayedItems.length === 0 ? (
          <div className="py-4 text-center text-[11px] text-[var(--text-muted)] italic">
            {filter === 'completed'
              ? 'لم يتم شراء أي أغراض بعد'
              : 'كل النواقص مكتملة، بارك الله فيكم! 🛒'}
          </div>
        ) : (
          displayedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleItem(item.id)}
              className={`group flex items-center justify-between p-2 rounded-xl border transition cursor-pointer select-none ${
                item.is_completed
                  ? 'bg-black/15 border-transparent opacity-65'
                  : 'bg-black/25 border-[var(--border)]/40 hover:bg-black/30'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleItem(item.id);
                  }}
                  className="flex-shrink-0 text-[var(--accent)]"
                >
                  {item.is_completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <Square className="w-4 h-4 opacity-70" />
                  )}
                </button>
                <div className="min-w-0">
                  <span
                    className={`text-xs block truncate ${
                      item.is_completed
                        ? 'line-through text-[var(--text-muted)]'
                        : 'text-[var(--text-primary)] font-medium'
                    }`}
                  >
                    {item.text}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] block truncate mt-0.5">
                    {item.is_completed
                      ? `أحضرها: ${item.completed_by || 'أحد الأفراد'}`
                      : `أضافها: ${item.added_by}`}
                  </span>
                </div>
              </div>

              {/* Delete item button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[#F28482] transition active:scale-90 rounded-lg flex-shrink-0"
                title="حذف الغرض"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
