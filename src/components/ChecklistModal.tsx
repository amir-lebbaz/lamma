'use client';

import React from 'react';
import { ChecklistItem, Member } from '@/types';
import HouseholdChecklist from './HouseholdChecklist';
import { X, ShoppingCart } from 'lucide-react';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ChecklistItem[];
  currentMember: Member;
  onAddItem: (text: string) => Promise<void>;
  onToggleItem: (itemId: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
}

export default function ChecklistModal({
  isOpen,
  onClose,
  items,
  currentMember,
  onAddItem,
  onToggleItem,
  onDeleteItem,
}: ChecklistModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-t-[14px] sm:rounded-[14px] p-4 sm:p-5 border border-[var(--border-subtle)] space-y-3.5 pb-safe animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                نواقص البيت العائلية
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-normal">
                قائمة مشتركة ومتزامنة لحظياً بين هواتف وأجهزة الأسرة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Embedded Checklist */}
        <HouseholdChecklist
          items={items}
          currentMember={currentMember}
          onAddItem={onAddItem}
          onToggleItem={onToggleItem}
          onDeleteItem={onDeleteItem}
        />
      </div>
    </div>
  );
}
