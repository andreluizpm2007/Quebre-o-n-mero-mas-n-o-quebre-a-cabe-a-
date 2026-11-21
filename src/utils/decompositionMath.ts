import { DivisionPlan, GuidedOption, PlaceValueType, PuzzlePieceData } from '../types/game';

const PLACE_META: Record<number, { place: PlaceValueType; label: string; shortLabel: string }> = {
  1000: { place: 'MILHAR', label: 'Milhar', shortLabel: 'UM' },
  100: { place: 'CENTENA', label: 'Centena', shortLabel: 'C' },
  10: { place: 'DEZENA', label: 'Dezena', shortLabel: 'D' },
  1: { place: 'UNIDADE', label: 'Unidade', shortLabel: 'U' },
};

export function decomposeDividend(dividend: number, divisor: number): PuzzlePieceData[] {
  const str = String(Math.floor(Math.abs(dividend)));
  const len = str.length;
  const pieces: PuzzlePieceData[] = [];

  for (let i = 0; i < len; i++) {
    const digit = Number(str[i]);
    const power = len - 1 - i;
    const multiplier = Math.pow(10, power);
    const value = digit * multiplier;

    if (value === 0) continue;

    const meta = PLACE_META[multiplier] ?? {
      place: 'MILHAR',
      label: `${multiplier}`,
      shortLabel: 'M',
    };

    pieces.push({
      id: `piece-${multiplier}-${i}`,
      place: meta.place,
      label: meta.label,
      shortLabel: meta.shortLabel,
      digit,
      multiplier,
      value,
      partialQuotient: Math.floor(value / divisor),
      partialRemainder: value % divisor,
      decomposedVerified: false,
      dividedDone: false,
    });
  }

  return pieces;
}

export function buildDivisionPlan(dividend: number, divisor: number): DivisionPlan {
  const pieces = decomposeDividend(dividend, divisor);
  const sumPartialRemainders = pieces.reduce((sum, p) => sum + p.partialRemainder, 0);
  const needsBonusRemainderStep = sumPartialRemainders >= divisor;
  const bonusQuotient = needsBonusRemainderStep ? Math.floor(sumPartialRemainders / divisor) : 0;
  const finalRemainder = dividend % divisor;
  const finalQuotient = Math.floor(dividend / divisor);

  return {
    dividend,
    divisor,
    pieces,
    sumPartialRemainders,
    needsBonusRemainderStep,
    bonusQuotient,
    finalRemainder,
    finalQuotient,
  };
}

function shuffleDeterministicOrRandom<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateDecompositionOptions(
  piece: PuzzlePieceData,
  dividend: number
): GuidedOption<number>[] {
  const correctValue = piece.value;
  const candidates = new Set<number>([correctValue]);

  const multipliers = [1, 10, 100, 1000];
  for (const m of multipliers) {
    const val = piece.digit * m;
    if (val !== correctValue && val > 0 && val <= 9000) {
      candidates.add(val);
    }
  }

  // Fallback extra distractors if digit is large or few candidates
  if (candidates.size < 4) {
    candidates.add(piece.digit);
    candidates.add(correctValue + piece.multiplier);
    if (correctValue > piece.multiplier) {
      candidates.add(correctValue - piece.multiplier);
    }
    candidates.add(piece.digit * 10);
  }

  const distractors = Array.from(candidates)
    .filter((v) => v !== correctValue)
    .slice(0, 3);

  const options: GuidedOption<number>[] = [
    {
      id: `opt-${correctValue}`,
      label: `${correctValue}`,
      value: correctValue,
      isCorrect: true,
      diagnosticFeedback: `Exato! O algarismo ${piece.digit} na casa da ${piece.label.toLowerCase()} vale ${correctValue}.`,
    },
    ...distractors.map((val) => {
      let reason = `Atenção ao valor posicional em ${dividend}!`;
      if (val === piece.digit && piece.multiplier > 1) {
        reason = `${val} é apenas o valor absoluto do algarismo. Como ${piece.digit} está na casa da ${piece.label.toLowerCase()}, seu valor relativo é ${piece.digit} × ${piece.multiplier} = ${correctValue}.`;
      } else if (val < correctValue) {
        reason = `${val} é menor do que a posição ocupada. O algarismo ${piece.digit} está na ${piece.label.toLowerCase()}, valendo ${correctValue}.`;
      } else {
        reason = `${val} pertence a uma ordem maior! Na casa da ${piece.label.toLowerCase()}, o algarismo ${piece.digit} vale ${correctValue}.`;
      }
      return {
        id: `opt-${val}`,
        label: `${val}`,
        value: val,
        isCorrect: false,
        diagnosticFeedback: reason,
      };
    }),
  ];

  return shuffleDeterministicOrRandom(options);
}

export interface DivisionResultValue {
  quotient: number;
  remainder: number;
}

export function generateDivisionOptions(
  targetValue: number,
  divisor: number
): GuidedOption<DivisionResultValue>[] {
  const correctQ = Math.floor(targetValue / divisor);
  const correctR = targetValue % divisor;

  const formatLabel = (q: number, r: number) =>
    r === 0 ? `${q} (sobra 0)` : `${q} (sobra ${r})`;

  const makeKey = (q: number, r: number) => `${q}:${r}`;
  const seen = new Set<string>([makeKey(correctQ, correctR)]);
  const distractors: { q: number; r: number; reason: string }[] = [];

  const pushDistractor = (q: number, r: number, reason: string) => {
    if (q < 0 || r < 0) return;
    const key = makeKey(q, r);
    if (!seen.has(key) && distractors.length < 3) {
      seen.add(key);
      distractors.push({ q, r, reason });
    }
  };

  // Common place-value zero mistake (e.g. 1000 / 2 -> 50 or 5000 instead of 500)
  if (correctQ >= 10 && correctQ % 10 === 0) {
    pushDistractor(
      correctQ / 10,
      correctR,
      `Faltou um zero! Confira: ${correctQ / 10} × ${divisor} = ${(correctQ / 10) * divisor}, mas queremos dividir ${targetValue}.`
    );
  }
  if (correctQ > 0 && correctQ * 10 <= 9999) {
    pushDistractor(
      correctQ * 10,
      correctR,
      `Passou do valor! ${correctQ * 10} × ${divisor} = ${correctQ * 10 * divisor}, que é bem maior que ${targetValue}.`
    );
  }

  // Off-by-one or off-by-place-unit
  const step = targetValue >= 1000 ? 100 : targetValue >= 100 ? 10 : 1;
  pushDistractor(
    correctQ + step,
    correctR,
    `Quase! ${correctQ + step} × ${divisor} passa de ${targetValue}. Teste um resultado um pouco menor.`
  );
  if (correctQ - step >= 0) {
    pushDistractor(
      correctQ - step,
      correctR,
      `Ainda sobra bastante! ${(correctQ - step)} × ${divisor} = ${(correctQ - step) * divisor}, dá para dividir mais.`
    );
  }

  // Remainder mistake if remainder > 0 or = 0
  if (correctR > 0) {
    pushDistractor(
      correctQ,
      0,
      `Cuidado com a sobra! ${correctQ} × ${divisor} = ${correctQ * divisor}. De ${correctQ * divisor} para ${targetValue}, sobram ${correctR}.`
    );
    pushDistractor(
      correctQ + 1,
      0,
      `${correctQ + 1} × ${divisor} = ${(correctQ + 1) * divisor}, que passa de ${targetValue}. O quociente é ${correctQ} com sobra ${correctR}.`
    );
  } else {
    pushDistractor(
      Math.max(0, correctQ - 1),
      divisor > 1 ? 1 : 0,
      `Na verdade essa divisão é exata! ${correctQ} × ${divisor} dá exatamente ${targetValue}, sem sobras.`
    );
  }

  // Extra fallbacks
  let offset = 1;
  while (distractors.length < 3 && offset < 20) {
    pushDistractor(
      correctQ + offset,
      correctR,
      `Verifique multiplicando de volta: quanto dá ${correctQ + offset} × ${divisor}?`
    );
    if (correctQ >= offset) {
      pushDistractor(
        correctQ - offset,
        correctR,
        `Verifique multiplicando de volta: ${correctQ - offset} × ${divisor} = ${(correctQ - offset) * divisor}.`
      );
    }
    offset++;
  }

  const options: GuidedOption<DivisionResultValue>[] = [
    {
      id: `div-${correctQ}-${correctR}`,
      label: formatLabel(correctQ, correctR),
      value: { quotient: correctQ, remainder: correctR },
      isCorrect: true,
      diagnosticFeedback: `Muito bem! ${targetValue} ÷ ${divisor} = ${correctQ}${
        correctR > 0 ? ` com sobra ${correctR}` : ' (divisão exata)'
      }.`,
    },
    ...distractors.slice(0, 3).map((d) => ({
      id: `div-${d.q}-${d.r}`,
      label: formatLabel(d.q, d.r),
      value: { quotient: d.q, remainder: d.r },
      isCorrect: false,
      diagnosticFeedback: d.reason,
    })),
  ];

  return shuffleDeterministicOrRandom(options);
}

export function generateFinalSumOptions(
  plan: DivisionPlan
): GuidedOption<number>[] {
  const correctSum = plan.finalQuotient;
  const seen = new Set<number>([correctSum]);
  const distractors: { val: number; reason: string }[] = [];

  const addDist = (val: number, reason: string) => {
    if (val > 0 && !seen.has(val) && distractors.length < 3) {
      seen.add(val);
      distractors.push({ val, reason });
    }
  };

  addDist(
    correctSum + 10,
    'Confira a casa das dezenas na soma dos quocientes parciais!'
  );
  addDist(
    Math.max(1, correctSum - 10),
    'Você deixou uma dezena para trás ao somar os resultados parciais!'
  );
  addDist(
    correctSum + 1,
    'Quase lá! Confira a soma das unidades finais.'
  );
  addDist(
    Math.max(1, correctSum - 1),
    'Quase! Verifique novamente a soma das unidades.'
  );
  if (plan.bonusQuotient > 0) {
    addDist(
      correctSum - plan.bonusQuotient,
      `Não se esqueça de somar o +${plan.bonusQuotient} obtido na divisão das sobras!`
    );
  }
  addDist(correctSum + 100, 'Atenção à ordem das centenas ao somar os pedaços.');

  const options: GuidedOption<number>[] = [
    {
      id: `sum-${correctSum}`,
      label: `${correctSum}`,
      value: correctSum,
      isCorrect: true,
      diagnosticFeedback: `Perfeito! Somando todas as partes divididas chegamos ao quociente final ${correctSum}!`,
    },
    ...distractors.slice(0, 3).map((d) => ({
      id: `sum-${d.val}`,
      label: `${d.val}`,
      value: d.val,
      isCorrect: false,
      diagnosticFeedback: d.reason,
    })),
  ];

  return shuffleDeterministicOrRandom(options);
}
