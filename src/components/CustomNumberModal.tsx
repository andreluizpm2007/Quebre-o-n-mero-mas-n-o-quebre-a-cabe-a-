import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Play, X } from 'lucide-react';
import { GameMode } from '../types/game';
import { decomposeDividend } from '../utils/decompositionMath';
import { DigitalKeypad } from './DigitalKeypad';

interface CustomNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode: GameMode;
  onStartCustom: (dividend: number, divisor: number, mode: GameMode) => void;
}

export const CustomNumberModal: React.FC<CustomNumberModalProps> = ({
  isOpen,
  onClose,
  defaultMode,
  onStartCustom,
}) => {
  const [dividendStr, setDividendStr] = useState('1234');
  const [divisorStr, setDivisorStr] = useState('2');
  const [selectedMode, setSelectedMode] = useState<GameMode>(defaultMode);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeField, setActiveField] = useState<'dividend' | 'divisor' | null>(null);

  useEffect(() => {
    setSelectedMode(defaultMode);
    setActiveField(null);
  }, [defaultMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const parsedDividend = Number(dividendStr);
  const parsedDivisor = Number(divisorStr);

  const previewPieces = useMemo(() => {
    if (
      !Number.isInteger(parsedDividend) ||
      parsedDividend < 10 ||
      parsedDividend > 9999 ||
      !Number.isInteger(parsedDivisor) ||
      parsedDivisor < 2
    ) {
      return [];
    }
    return decomposeDividend(parsedDividend, parsedDivisor);
  }, [parsedDividend, parsedDivisor]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isInteger(parsedDividend) || parsedDividend < 10 || parsedDividend > 9999) {
      setErrorMsg('Escolha um dividendo natural entre 10 e 9999.');
      return;
    }
    if (!Number.isInteger(parsedDivisor) || parsedDivisor < 2 || parsedDivisor > 25) {
      setErrorMsg('Escolha um divisor natural entre 2 e 25.');
      return;
    }
    if (parsedDividend < parsedDivisor) {
      setErrorMsg('Para montar o quebra-cabeça, o dividendo deve ser maior ou igual ao divisor.');
      return;
    }
    setErrorMsg('');
    setActiveField(null);
    onStartCustom(parsedDividend, parsedDivisor, selectedMode);
  };

  const handleKeypadDigit = (digit: string) => {
    setErrorMsg('');
    if (activeField === 'dividend') {
      setDividendStr((prev) => (prev.length >= 4 ? prev : `${prev}${digit}`));
    } else if (activeField === 'divisor') {
      setDivisorStr((prev) => (prev.length >= 2 ? prev : `${prev}${digit}`));
    }
  };

  const handleKeypadBackspace = () => {
    setErrorMsg('');
    if (activeField === 'dividend') {
      setDividendStr((prev) => prev.slice(0, -1));
    } else if (activeField === 'divisor') {
      setDivisorStr((prev) => prev.slice(0, -1));
    }
  };

  const handleKeypadClear = () => {
    setErrorMsg('');
    if (activeField === 'dividend') {
      setDividendStr('');
    } else if (activeField === 'divisor') {
      setDivisorStr('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-number-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 id="custom-number-title" className="font-display text-lg font-bold text-slate-900">
                Criar Sua Própria Divisão
              </h2>
              <p className="text-xs text-slate-500">
                Clique em um campo para digitar ou abrir o teclado digital
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="custom-dividend" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dividendo (10 a 9999)
              </label>
              <input
                id="custom-dividend"
                type="text"
                inputMode="none"
                value={dividendStr}
                onClick={() => setActiveField('dividend')}
                onChange={(e) => {
                  setDividendStr(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setErrorMsg('');
                }}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-mono text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  activeField === 'dividend' ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="custom-divisor" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Divisor (2 a 25)
              </label>
              <input
                id="custom-divisor"
                type="text"
                inputMode="none"
                value={divisorStr}
                onClick={() => setActiveField('divisor')}
                onChange={(e) => {
                  setDivisorStr(e.target.value.replace(/\D/g, '').slice(0, 2));
                  setErrorMsg('');
                }}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-mono text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  activeField === 'divisor' ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-300'
                }`}
              />
            </div>
          </div>

          {activeField && (
            <div className="flex justify-center">
              <DigitalKeypad
                fieldLabel={activeField === 'dividend' ? 'Dividendo' : 'Divisor'}
                onDigit={handleKeypadDigit}
                onBackspace={handleKeypadBackspace}
                onClear={handleKeypadClear}
                onClose={() => setActiveField(null)}
              />
            </div>
          )}

          {previewPieces.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Prévia das peças posicionais do dividendo:
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                {parsedDividend} = {previewPieces.map((p) => p.value).join(' + ')}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">Escolha o modo de resolução:</div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMode('GUIDED')}
                className={`px-3 py-2.5 min-h-[44px] rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                  selectedMode === 'GUIDED'
                    ? 'bg-blue-50 border-blue-600 text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Aprendizado Guiado
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode('CHALLENGE')}
                className={`px-3 py-2.5 min-h-[44px] rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                  selectedMode === 'CHALLENGE'
                    ? 'bg-amber-50 border-amber-600 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Desafio Cronometrado
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              Montar Quebra-Cabeça
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
