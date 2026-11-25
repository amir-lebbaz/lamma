'use client';

import React from 'react';

interface ZinoAvatarProps {
  size?: number;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export default function ZinoAvatar({
  size = 36,
  className = '',
  onClick,
  title = 'زينو 🐾 (قط العائلة)',
}: ZinoAvatarProps) {
  return (
    <div
      onClick={onClick}
      title={title}
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${
        onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xs"
      >
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill="#F5E6D3" stroke="#E2D0BD" strokeWidth="2" />

        {/* Siamese Cat Ears (Dark chocolate-brown seal points #3B2820) */}
        {/* Left Ear */}
        <path
          d="M 24 38 L 16 10 C 22 12, 38 18, 42 26 Z"
          fill="#3B2820"
        />
        <path
          d="M 25 34 L 20 14 C 24 16, 35 21, 38 27 Z"
          fill="#543A2F"
        />
        {/* Right Ear */}
        <path
          d="M 76 38 L 84 10 C 78 12, 62 18, 58 26 Z"
          fill="#3B2820"
        />
        <path
          d="M 75 34 L 80 14 C 76 16, 65 21, 62 27 Z"
          fill="#543A2F"
        />

        {/* Cream-Beige Face (#F5E6D3) */}
        <ellipse cx="50" cy="55" rx="35" ry="30" fill="#F5E6D3" />

        {/* Characteristic Siamese Dark Chocolate Mask / Seal Points (#3B2820) */}
        <path
          d="M 32 44 C 32 36, 42 34, 50 34 C 58 34, 68 36, 68 44 C 68 56, 62 70, 50 70 C 38 70, 32 56, 32 44 Z"
          fill="#3B2820"
        />

        {/* Bright Sapphire-Blue Eyes (#5BC0EB) */}
        {/* Left Eye */}
        <ellipse cx="40" cy="48" rx="6.5" ry="7.5" fill="#5BC0EB" />
        <ellipse cx="40" cy="48" rx="3" ry="5.5" fill="#1C384A" />
        <circle cx="38" cy="45" r="2" fill="#FFFFFF" />

        {/* Right Eye */}
        <ellipse cx="60" cy="48" rx="6.5" ry="7.5" fill="#5BC0EB" />
        <ellipse cx="60" cy="48" rx="3" ry="5.5" fill="#1C384A" />
        <circle cx="58" cy="45" r="2" fill="#FFFFFF" />

        {/* Cat Nose (Dark Seal Tip) */}
        <path
          d="M 47 59 L 53 59 L 50 63 Z"
          fill="#241813"
        />

        {/* Cat Mouth Curve */}
        <path
          d="M 46 65 C 48 67, 50 67, 50 65 C 50 67, 52 67, 54 65"
          stroke="#241813"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Whiskers */}
        {/* Left Whiskers */}
        <line x1="22" y1="58" x2="33" y2="60" stroke="#3B2820" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <line x1="20" y1="64" x2="32" y2="63" stroke="#3B2820" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        {/* Right Whiskers */}
        <line x1="78" y1="58" x2="67" y2="60" stroke="#3B2820" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <line x1="80" y1="64" x2="68" y2="63" stroke="#3B2820" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </svg>
    </div>
  );
}
