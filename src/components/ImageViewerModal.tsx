'use client';

import React, { useState } from 'react';
import { X, Download, Check } from 'lucide-react';
import { saveToGalleryOrDownload } from '@/lib/media-storage';

interface ImageViewerModalProps {
  url: string | null;
  onClose: () => void;
}

export default function ImageViewerModal({ url, onClose }: ImageViewerModalProps) {
  const [downloaded, setDownloaded] = useState(false);

  if (!url) return null;

  const handleSaveToGallery = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveToGalleryOrDownload(url, `lamma-photo-${Date.now()}.jpg`);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 transition-opacity animate-in fade-in select-none"
      onClick={onClose}
    >
      {/* Top Action Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        {/* Save to Gallery / Download Button */}
        <button
          type="button"
          onClick={handleSaveToGallery}
          className="px-3.5 py-2 rounded-[10px] bg-[var(--bg-surface)]/90 hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] backdrop-blur-md transition active:scale-95 flex items-center gap-1.5 text-xs font-medium shadow-md"
          title="حفظ في الاستوديو"
        >
          {downloaded ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span className="text-emerald-300">تم الحفظ في الاستوديو!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>حفظ في الاستوديو</span>
            </>
          )}
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-[10px] bg-[var(--bg-surface)]/90 text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] backdrop-blur-md transition active:scale-90 flex items-center justify-center shadow-md"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="max-w-4xl max-h-[85vh] overflow-hidden rounded-[14px] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt="صورة عائلية مكبرة"
          className="max-w-full max-h-[82vh] object-contain rounded-[14px]"
        />
      </div>
    </div>
  );
}
