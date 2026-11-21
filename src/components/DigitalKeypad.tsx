import React from 'react';
import { Delete, X, Check } from 'lucide-react';
import { soundEngine } from '../utils/sound';

interface DigitalKeypadProps {
  fieldLabel: string;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onConfirm?: () => void;
  onClose: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const DigitalKeypad: React.FC<DigitalKeypadProps> = ({
  fieldLabel,
  onDigit,
  onBackspace,
  onClear,
  onConfirm,
  onClose,
}) => {
  return (
    <div
      className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm max-w-xs w-full select-none"
      role="group"
      aria-label={`Teclado digital para ${fieldLabel}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-600 truncate">
          Teclado digital · <strong className="text-slate-900">{fieldLabel}</strong>
        </span>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          aria-label="Ocultar teclado digital"
          title="Ocultar teclado"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((digit) => (
          <button
            key={digit}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              soundEngine.playClick();
              onDigit(digit);
            }}
            className="min-h-[46px] rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 active:scale-[0.97] font-mono text-lg font-bold text-slate-900 tabular-nums transition-all cursor-pointer"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            soundEngine.playClick();
            onClear();
          }}
          className="min-h-[46px] rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
        >
          Limpar
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            soundEngine.playClick();
            onDigit('0');
          }}
          className="min-h-[46px] rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 active:scale-[0.97] font-mono text-lg font-bold text-slate-900 tabular-nums transition-all cursor-pointer"
        >
          0
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            soundEngine.playClick();
            onBackspace();
          }}
          className="min-h-[46px] rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Apagar último dígito"
          title="Apagar"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {onConfirm && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onConfirm}
          className="mt-2.5 w-full min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
          Enviar Resposta
        </button>
      )}
    </div>
  );
};
