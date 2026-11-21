import { Achievement, LevelPreset } from '../types/game';

export const GUIDED_LEVELS: LevelPreset[] = [
  {
    id: 'g-1',
    tier: 1,
    title: 'Aquecimento das Dezenas',
    dividend: 84,
    divisor: 2,
    hint: 'Quebre 84 em 80 + 4 e divida cada parte pela metade.',
  },
  {
    id: 'g-2',
    tier: 1,
    title: 'Centenas Exatas',
    dividend: 639,
    divisor: 3,
    hint: 'Separe em 600, 30 e 9. Todas são divisíveis por 3!',
  },
  {
    id: 'g-3',
    tier: 2,
    title: 'O Clássico dos Milhares',
    dividend: 1234,
    divisor: 2,
    hint: '1000 + 200 + 30 + 4. Observe que 30 ÷ 2 dá 15!',
  },
  {
    id: 'g-4',
    tier: 2,
    title: 'Divisão com Sobra Final',
    dividend: 1537,
    divisor: 5,
    hint: '1000, 500 e 30 dividem certinho por 5. E o 7?',
  },
  {
    id: 'g-5',
    tier: 3,
    title: 'Zero no Meio do Caminho',
    dividend: 2048,
    divisor: 4,
    hint: 'A casa das centenas é zero! Divida 2000, 40 e 8.',
  },
  {
    id: 'g-6',
    tier: 4,
    title: 'Sobras que se Reagrupam',
    dividend: 524,
    divisor: 3,
    hint: 'Cada peça deixa uma pequena sobra — no final somamos as sobras!',
  },
];

export const CHALLENGE_LEVELS: LevelPreset[] = [
  {
    id: 'c-1',
    tier: 1,
    title: 'Nível 1 · Dezenas e Centenas',
    dividend: 486,
    divisor: 2,
    hint: 'Divida rápido cada valor posicional por 2.',
  },
  {
    id: 'c-2',
    tier: 1,
    title: 'Nível 2 · Múltiplos de 3',
    dividend: 936,
    divisor: 3,
    hint: 'Quebre em 900, 30 e 6.',
  },
  {
    id: 'c-3',
    tier: 2,
    title: 'Nível 3 · Entrando nos Milhares',
    dividend: 1525,
    divisor: 5,
    hint: '1000, 500, 20 e 5 — atenção ao 20 ÷ 5.',
  },
  {
    id: 'c-4',
    tier: 2,
    title: 'Nível 4 · Resto nas Unidades',
    dividend: 2487,
    divisor: 4,
    hint: 'Divida cada peça por 4 e registre a sobra do 7.',
  },
  {
    id: 'c-5',
    tier: 3,
    title: 'Nível 5 · Decomposição Ágil',
    dividend: 3618,
    divisor: 6,
    hint: '3000 ÷ 6 = 500. Continue com as demais peças!',
  },
  {
    id: 'c-6',
    tier: 4,
    title: 'Nível 6 · Mestre das Sobras',
    dividend: 1458,
    divisor: 7,
    hint: 'Junte as sobras parciais se passarem de 7!',
  },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-puzzle',
    title: 'Primeiro Quebra-Cabeça',
    description: 'Complete sua primeira divisão pelo método da decomposição.',
    iconName: 'puzzle',
    unlocked: false,
  },
  {
    id: 'place-value-master',
    title: 'Mestre do Valor Posicional',
    description: 'Acerte a verificação de decomposição sem nenhum erro na rodada.',
    iconName: 'layers',
    unlocked: false,
  },
  {
    id: 'surgical-precision',
    title: 'Precisão Cirúrgica',
    description: 'Conclua uma divisão completa sem errar nenhuma etapa.',
    iconName: 'target',
    unlocked: false,
  },
  {
    id: 'no-fear-remainder',
    title: 'Sem Medo do Resto',
    description: 'Resolva com sucesso uma divisão que deixe resto maior que zero.',
    iconName: 'calculator',
    unlocked: false,
  },
  {
    id: 'thousands-champion',
    title: 'Campeão dos Milhares',
    description: 'Divida um número de 4 algarismos (1.000 ou maior).',
    iconName: 'award',
    unlocked: false,
  },
  {
    id: 'lightning-calc',
    title: 'Cálculo Relâmpago',
    description: 'Conclua um nível no Modo Desafio em menos de 45 segundos.',
    iconName: 'zap',
    unlocked: false,
  },
  {
    id: 'streak-three',
    title: 'Sequência Imbatível',
    description: 'Alcance uma sequência de 3 divisões concluídas.',
    iconName: 'flame',
    unlocked: false,
  },
  {
    id: 'numeric-explorer',
    title: 'Explorador Numérico',
    description: 'Crie e resolva uma divisão com seus próprios números.',
    iconName: 'compass',
    unlocked: false,
  },
];

export const ENCOURAGEMENT_CORRECT = [
  'Excelente raciocínio!',
  'Isso mesmo, peça no lugar certo!',
  'Você quebrou o número com precisão!',
  'Mandou muito bem nessa etapa!',
  'Divisão clara e organizada!',
];

export const ENCOURAGEMENT_RETRY = [
  'Sem pressa! Cada tentativa ajuda seu cérebro a enxergar o padrão.',
  'Quase lá! Observe o valor da peça destacada pela mão.',
  'Tudo bem errar — tente novamente usando a dica abaixo!',
  'Pense na tabuada do divisor para encontrar quantas vezes ele cabe na peça.',
];

export const BNCC_SKILLS = [
  {
    code: 'EF06MA03',
    grade: '6º Ano · Números',
    title: 'Estratégias de cálculo com números naturais',
    description:
      'Resolver e elaborar problemas que envolvam cálculos (mentais ou escritos, exatos ou aproximados) com números naturais, por meio de estratégias variadas, com compreensão dos processos neles envolvidos com e sem uso de calculadora.',
  },
  {
    code: 'EF06MA01',
    grade: '6º Ano · Sistema Decimal',
    title: 'Leitura, escrita e valor posicional',
    description:
      'Compreender a estrutura do Sistema de Numeração Decimal (ordens de milhares, centenas, dezenas e unidades) e o valor relativo de cada algarismo para decompor números antes de operar.',
  },
  {
    code: 'EF06MA04',
    grade: '6º Ano · Pensamento Algorítmico',
    title: 'Construção de algoritmo passo a passo',
    description:
      'Construir algoritmo em linguagem natural e representá-lo de forma estruturada (etapas sequenciais de decomposição, divisão parcial, agrupamento de restos e soma final).',
  },
  {
    code: 'EF07MA04 / EF09MA02',
    grade: '7º ao 9º Ano · Recomposição e Propriedades',
    title: 'Consolidação da propriedade distributiva e divisão euclidiana',
    description:
      'Apoia a recomposição de aprendizagem nos Anos Finais ao tornar explícita a distributividade da divisão sobre a adição: (a + b + c) ÷ d = (a ÷ d) + (b ÷ d) + (c ÷ d), com controle do resto.',
  },
];

export const SAEB_DESCRIPTORS = [
  {
    code: 'D15 (5º Ano · Recomposição 6º–9º)',
    axis: 'Números e Operações',
    description:
      'Reconhecer a decomposição de números naturais nas suas diversas ordens (unidades, dezenas, centenas e unidades de milhar).',
  },
  {
    code: 'D20 (5º Ano · Recomposição 6º–9º)',
    axis: 'Números e Operações',
    description:
      'Resolver problema com números naturais, envolvendo diferentes significados da multiplicação ou divisão.',
  },
  {
    code: 'D19 (9º Ano · Matriz SAEB)',
    axis: 'Números e Operações / Álgebra',
    description:
      'Resolver problema com números naturais, envolvendo diferentes significados das operações (adição, subtração, multiplicação, divisão, potenciação).',
  },
  {
    code: 'D18 (9º Ano · Matriz SAEB)',
    axis: 'Números e Operações',
    description:
      'Efetuar cálculos com números inteiros, envolvendo as operações — fortalecido pela fluência no cálculo mental e na decomposição aditiva de dividendos.',
  },
];
