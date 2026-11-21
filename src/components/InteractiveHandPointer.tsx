import React from 'react';

interface InteractiveHandPointerProps {
  label?: string;
}

export const InteractiveHandPointer: React.FC<InteractiveHandPointerProps> = ({
  label = 'Em foco',
}) => {
  return (
    <div className="flex flex-col items-center pointer-events-none select-none animate-pointer-bob">
      <div className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-semibold tracking-wide shadow-sm mb-1 whitespace-nowrap">
        {label}
      </div>
      <svg
        width="50"
        height="58"
        viewBox="0 0 56 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="drop-shadow-md"
      >
        <defs>
          <linearGradient id="handSkinGrad" x1="28" y1="14" x2="28" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF7ED" />
            <stop offset="65%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#FCD34D" />
          </linearGradient>
        </defs>

        {/* Wrist & Sleeve Cuff */}
        <rect
          x="17"
          y="3"
          width="22"
          height="10"
          rx="4"
          fill="#2563EB"
          stroke="#0F172A"
          strokeWidth="2.4"
        />
        <line x1="21" y1="6.5" x2="35" y2="6.5" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" />

        {/* Curled Hand Silhouette with Tapered Pointing Index Finger */}
        <path
          d="M 19 13
             L 37 13
             C 39.5 13 42.5 15 43.5 18.5
             L 45.5 26
             C 46.5 30 43.5 34 39.5 34
             L 37.5 34
             C 37 36 35 37.5 32.5 37.5
             L 30 37.5
             L 30 51.5
             C 30 54.5 27.6 56.8 24.8 56.8
             C 22 56.8 19.6 54.5 19.6 51.5
             L 19.6 35.5
             L 14.2 35.5
             C 11.2 35.5 9.2 33 9.8 30
             L 11.6 21.5
             C 12.6 16.5 15.5 13 19 13 Z"
          fill="url(#handSkinGrad)"
          stroke="#0F172A"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Thumb tucked cleanly on the left */}
        <path
          d="M 13.5 22.5 C 16.5 22 18.8 24.2 18.8 27.5 C 18.8 30.2 16.8 32 14.2 32"
          fill="#FDE68A"
          stroke="#0F172A"
          strokeWidth="2.1"
          strokeLinecap="round"
        />

        {/* Curled middle, ring & pinky fingers */}
        <path
          d="M 30 28.5 C 32.5 28.5 34.5 30.2 34.5 32.8 C 34.5 35.2 32.5 37 30 37"
          stroke="#0F172A"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M 34.5 26.5 C 37 26.5 39 28.2 39 30.8 C 39 33 37.2 34.5 35 34.5"
          stroke="#0F172A"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M 39 25 C 41.2 25 43 26.5 43 29 C 43 31 41.4 32.5 39.2 32.5"
          stroke="#0F172A"
          strokeWidth="2.1"
          strokeLinecap="round"
        />

        {/* Soft knuckle & index finger highlight */}
        <line x1="23.2" y1="38" x2="23.2" y2="49" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" />

        {/* Subtle fingertip focus indicator */}
        <circle cx="24.8" cy="60.5" r="2.2" fill="#2563EB" />
      </svg>
    </div>
  );
};
