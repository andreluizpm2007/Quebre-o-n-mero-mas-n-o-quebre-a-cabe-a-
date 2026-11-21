import React, { useEffect } from 'react';
import { BookOpen, X, GraduationCap, Compass } from 'lucide-react';
import { BNCC_SKILLS, SAEB_DESCRIPTORS } from '../data/curriculumAndLevels';

interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurriculumModal: React.FC<CurriculumModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="curriculum-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="curriculum-modal-title" className="font-display text-lg font-bold text-slate-900">
                Guia Pedagógico · BNCC e Matriz SAEB
              </h2>
              <p className="text-xs text-slate-500">
                Ensino Fundamental (6º ao 9º ano) · Divisão por Decomposição Posicional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar guia pedagógico"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 space-y-8">
          <section>
            <h3 className="font-display text-base font-bold text-slate-900 mb-2">
              Sobre a Metodologia do Jogo
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              O jogo <strong>Quebre o número para não quebrar a cabeça</strong> foi projetado especialmente para
              estudantes do <strong>6º ao 9º ano do Ensino Fundamental</strong> que apresentam dificuldades na
              compreensão do algoritmo tradicional da divisão. Ao transformar o dividendo em um quebra-cabeça colorido
              de valores posicionais (milhares, centenas, dezenas e unidades), o aluno visualiza a propriedade
              distributiva da divisão, realiza divisões parciais mais simples, acompanha as sobras (restos) e soma os
              resultados obtidos com autonomia e feedback imediato.
            </p>
          </section>

          <section className="border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Habilidades da BNCC de Matemática
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BNCC_SKILLS.map((skill) => (
                <div
                  key={skill.code}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-blue-700">{skill.code}</span>
                    <span className="text-slate-500">{skill.grade}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900">{skill.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{skill.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="w-4 h-4 text-emerald-600" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Descritores da Matriz de Referência do SAEB
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAEB_DESCRIPTORS.map((desc) => (
                <div
                  key={desc.code}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-emerald-700">{desc.code}</span>
                    <span className="text-slate-500">{desc.axis}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{desc.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            Entendido, voltar ao jogo
          </button>
        </div>
      </div>
    </div>
  );
};
