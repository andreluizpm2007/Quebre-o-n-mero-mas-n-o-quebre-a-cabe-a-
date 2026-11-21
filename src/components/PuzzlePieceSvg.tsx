import React from 'react';
import { Check } from 'lucide-react';
import { PlaceValueType } from '../types/game';

interface PuzzlePieceSvgProps {
  place: PlaceValueType;
  label: string;
  shortLabel: string;
  value: number;
  digit?: number;
  isFirst: boolean;
  isLast: boolean;
  isActive?: boolean;
  isDone?: boolean;
  isMasked?: boolean;
  assembled?: boolean;
  partialQuotient?: number;
  partialRemainder?: number;
  divisor?: number;
  onClick?: () => void;
}

const PLACE_PALETTE: Record<
  PlaceValueType,
  {
    fill: string;
    stroke: string;
    darkText: string;
    headerBg: string;
    accent: string;
  }
> = {
  MILHAR: {
    fill: '#DBEAFE',
    stroke: '#2563EB',
    darkText: '#1E3A8A',
    headerBg: '#2563EB',
    accent: '#1D4ED8',
  },
  CENTENA: {
    fill: '#D1FAE5',
    stroke: '#059669',
    darkText: '#064E3B',
    headerBg: '#059669',
    accent: '#047857',
  },
  DEZENA: {
    fill: '#FEF3C7',
    stroke: '#D97706',
    darkText: '#78350F',
    headerBg: '#D97706',
    accent: '#B45309',
  },
  UNIDADE: {
    fill: '#FFE4E6',
    stroke: '#E11D48',
    darkText: '#881337',
    headerBg: '#E11D48',
    accent: '#BE123C',
  },
  SOBRA: {
    fill: '#EDE9FE',
    stroke: '#7C3AED',
    darkText: '#4C1D95',
    headerBg: '#7C3AED',
    accent: '#6D28D9',
  },
};

export const PuzzlePieceSvg: React.FC<PuzzlePieceSvgProps> = ({
  place,
  label,
  shortLabel,
  value,
  digit,
  isFirst,
  isLast,
  isActive = false,
  isDone = false,
  isMasked = false,
  assembled = false,
  partialQuotient,
  partialRemainder,
  divisor,
  onClick,
}) => {
  const palette = PLACE_PALETTE[place];

  // SVG coordinate box: width 168 (includes 20px right tab space), height 136
  // Body spans x: 16..144 (128px), y: 12..124 (112px)
  // Left socket cuts IN from x=16 to x=34 around y=52..84
  // Right tab bulges OUT from x=144 to x=162 around y=52..84
  const leftEdge = isFirst
    ? 'L 16 18 Q 16 12 22 12'
    : 'L 16 48 C 28 48 34 54 34 68 C 34 82 28 88 16 88 L 16 18 Q 16 12 22 12';

  const rightEdge = isLast
    ? 'L 144 118 Q 144 124 138 124'
    : 'L 144 48 C 156 48 162 54 162 68 C 162 82 156 88 144 88 L 144 118 Q 144 124 138 124';

  // Build path clockwise from top-left (22, 12)
  const pathData = `
    M 22 12
    L 138 12
    Q 144 12 144 18
    ${rightEdge}
    L 22 124
    Q 16 124 16 118
    ${leftEdge}
    Z
  `;

  return (
    <div
      onClick={onClick}
      className={`relative select-none transition-transform duration-200 ease-out ${
        assembled ? (isFirst ? '' : '-ml-[22px]') : ''
      } ${isActive ? 'scale-105 z-20' : 'z-10'} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        width: '166px',
        height: '136px',
        filter: isActive
          ? 'drop-shadow(0 12px 18px rgba(15, 23, 42, 0.16))'
          : 'drop-shadow(0 4px 8px rgba(15, 23, 42, 0.08))',
      }}
    >
      <svg
        viewBox="0 0 168 136"
        className="w-full h-full overflow-visible"
        aria-label={`${label}: ${isMasked ? 'valor oculto' : value}`}
      >
        <path
          d={pathData}
          fill={palette.fill}
          stroke={isActive ? '#0F172A' : palette.stroke}
          strokeWidth={isActive ? 3.5 : 2.2}
          strokeLinejoin="round"
        />
        {/* Inner tactile top highlight */}
        <line
          x1="26"
          y1="17"
          x2="134"
          y2="17"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Content centered over body x: 16..144 */}
      <div
        className="absolute top-[14px] bottom-[14px] left-[22px] right-[26px] flex flex-col items-center justify-between py-2 px-1 text-center"
      >
        {/* Order label */}
        <div className="flex items-center justify-center gap-1.5 w-full">
          <span
            className="text-[11px] font-bold tracking-wide uppercase"
            style={{ color: palette.accent }}
          >
            {label} ({shortLabel})
          </span>
          {isDone && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white shrink-0"
              style={{ backgroundColor: palette.headerBg }}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          )}
        </div>

        {/* Main numerical value */}
        <div
          className="font-display font-extrabold tabular-nums leading-none tracking-tight"
          style={{
            color: palette.darkText,
            fontSize: value >= 1000 ? '1.85rem' : '2.05rem',
          }}
        >
          {isMasked ? (
            <span className="inline-flex items-baseline gap-1">
              <span>{digit}</span>
              <span className="text-base font-bold opacity-60">× ?</span>
            </span>
          ) : (
            value
          )}
        </div>

        {/* Footer info inside piece */}
        <div className="text-[11px] font-semibold tabular-nums min-h-[16px]" style={{ color: palette.darkText }}>
          {isDone && partialQuotient !== undefined && divisor !== undefined ? (
            <span>
              ÷{divisor} = <strong>{partialQuotient}</strong>
              {partialRemainder ? ` (r ${partialRemainder})` : ''}
            </span>
          ) : isMasked ? (
            <span className="opacity-70">Qual o valor?</span>
          ) : (
            <span className="opacity-75">
              {digit !== undefined ? `${digit} × ${value / (digit || 1)}` : 'Peça'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
