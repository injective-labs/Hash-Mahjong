import { Rule } from './types';

export const TILE_MAP: Record<string, { emoji: string; name: string }> = {
  '0': { emoji: '🀆', name: 'White Dragon' },
  '1': { emoji: '🀇', name: '1 of Characters' },
  '2': { emoji: '🀈', name: '2 of Characters' },
  '3': { emoji: '🀉', name: '3 of Characters' },
  '4': { emoji: '🀊', name: '4 of Characters' },
  '5': { emoji: '🀋', name: '5 of Characters' },
  '6': { emoji: '🀌', name: '6 of Characters' },
  '7': { emoji: '🀍', name: '7 of Characters' },
  '8': { emoji: '🀎', name: '8 of Characters' },
  '9': { emoji: '🀏', name: '9 of Characters' },
  a: { emoji: '🀐', name: '1 of Bamboos' },
  b: { emoji: '🀑', name: '2 of Bamboos' },
  c: { emoji: '🀒', name: '3 of Bamboos' },
  d: { emoji: '🀓', name: '4 of Bamboos' },
  e: { emoji: '🀄', name: 'Red Dragon' },
  f: { emoji: '🀅', name: 'Green Dragon' },
};

export function countsOf(seed10: string): Record<string, number> {
  const m: Record<string, number> = {};
  for (const ch of seed10) m[ch] = (m[ch] || 0) + 1;
  return m;
}

export function pairCount(counts: Record<string, number>): number {
  return Object.values(counts).filter((x) => x === 2).length;
}

export function tripleCount(counts: Record<string, number>): number {
  return Object.values(counts).filter((x) => x === 3).length;
}

export function hasAnyCountAtLeast(counts: Record<string, number>, n: number): boolean {
  return Object.values(counts).some((x) => x >= n);
}

export function hasCountExactly(counts: Record<string, number>, n: number): boolean {
  return Object.values(counts).some((x) => x === n);
}

export function countExactly(counts: Record<string, number>, n: number): number {
  return Object.values(counts).filter((x) => x === n).length;
}

export function hexVal(ch: string): number | null {
  const v = parseInt(ch, 16);
  return Number.isFinite(v) ? v : null;
}

export function reverseStr(s: string): string {
  return s.split('').reverse().join('');
}

export function isAlternatingAB(seed10: string): boolean {
  if (seed10.length !== 10) return false;
  const A = seed10[0], B = seed10[1];
  if (!A || !B || A === B) return false;
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0 && seed10[i] !== A) return false;
    if (i % 2 === 1 && seed10[i] !== B) return false;
  }
  return true;
}

export function isPalindrome(seed10: string): boolean {
  return seed10 === reverseStr(seed10);
}

export function hasStraight(seed10: string, len: number): boolean {
  const arr = seed10.split('').map(hexVal);
  for (let i = 0; i <= arr.length - len; i++) {
    let okAsc = true, okDesc = true;
    for (let j = 1; j < len; j++) {
      if (arr[i + j] !== (arr[i] as number) + j) okAsc = false;
      if (arr[i + j] !== (arr[i] as number) - j) okDesc = false;
    }
    if (okAsc || okDesc) return true;
  }
  return false;
}

export function doubleStraight4(seed10: string): boolean {
  const arr = seed10.split('').map(hexVal);
  const runs: [number, number][] = [];
  const len = 4;
  for (let i = 0; i <= arr.length - len; i++) {
    let okAsc = true, okDesc = true;
    for (let j = 1; j < len; j++) {
      if (arr[i + j] !== (arr[i] as number) + j) okAsc = false;
      if (arr[i + j] !== (arr[i] as number) - j) okDesc = false;
    }
    if (okAsc || okDesc) runs.push([i, i + len - 1]);
  }
  for (let a = 0; a < runs.length; a++) {
    for (let b = a + 1; b < runs.length; b++) {
      const [a0, a1] = runs[a], [b0, b1] = runs[b];
      if (a1 < b0 || b1 < a0) return true;
    }
  }
  return false;
}

export const RULES: Rule[] = [
  { id: 1,  name: 'Tenfold Harmony',   payout: '10000x', desc: 'All 10 tiles are identical.',                                                          test: (_s, c) => hasAnyCountAtLeast(c, 10) },
  { id: 2,  name: 'Ninefold Harmony',  payout: '2000x',  desc: '9 tiles are identical.',                                                                test: (_s, c) => hasAnyCountAtLeast(c, 9)  },
  { id: 3,  name: 'Eightfold Harmony', payout: '500x',   desc: '8 tiles are identical.',                                                                test: (_s, c) => hasAnyCountAtLeast(c, 8)  },
  { id: 4,  name: 'Sevenfold Harmony', payout: '200x',   desc: '7 tiles are identical.',                                                                test: (_s, c) => hasAnyCountAtLeast(c, 7)  },
  { id: 5,  name: 'Sixfold Harmony',   payout: '80x',    desc: '6 tiles are identical.',                                                                test: (_s, c) => hasAnyCountAtLeast(c, 6)  },
  { id: 6,  name: 'Fivefold Harmony',  payout: '30x',    desc: '5 tiles are identical.',                                                                test: (_s, c) => hasAnyCountAtLeast(c, 5)  },
  { id: 7,  name: 'Double Quads',      payout: '200x',   desc: 'Two separate 4-of-a-kind sets (4+4+2).',                                                test: (_s, c) => countExactly(c, 4) >= 2   },
  { id: 8,  name: 'Quad + Triple',     payout: '120x',   desc: 'A 4-of-a-kind plus a 3-of-a-kind.',                                                    test: (_s, c) => hasCountExactly(c, 4) && hasCountExactly(c, 3) },
  { id: 9,  name: 'Three Triples',     payout: '90x',    desc: 'At least three 3-of-a-kind sets (3+3+3+1).',                                           test: (_s, c) => tripleCount(c) >= 3       },
  { id: 10, name: 'Two Triples',       payout: '35x',    desc: 'At least two 3-of-a-kind sets.',                                                        test: (_s, c) => tripleCount(c) >= 2       },
  { id: 11, name: 'Five Pairs',        payout: '25x',    desc: 'Exactly five pairs (2+2+2+2+2).',                                                       test: (_s, c) => pairCount(c) === 5 && Object.keys(c).length === 5 },
  { id: 12, name: 'Four Pairs',        payout: '10x',    desc: 'Exactly four pairs (2+2+2+2+1+1).',                                                     test: (_s, c) => pairCount(c) === 4        },
  { id: 13, name: 'Full House',        payout: '20x',    desc: 'At least one triple and at least one pair.',                                             test: (_s, c) => tripleCount(c) >= 1 && pairCount(c) >= 1 },
  { id: 14, name: 'Any Triple',        payout: '5x',     desc: 'At least one 3-of-a-kind.',                                                             test: (_s, c) => tripleCount(c) >= 1       },
  { id: 15, name: 'Straight-5',        payout: '15x',    desc: 'Any 5 consecutive tiles increasing or decreasing (adjacent positions).',                test: (s)      => hasStraight(s, 5)         },
  { id: 16, name: 'Double Straight-4', payout: '30x',    desc: 'Two non-overlapping 4-tile straights (adjacent positions).',                            test: (s)      => doubleStraight4(s)        },
  { id: 17, name: 'Palindrome',        payout: '50x',    desc: 'The 10-hex seed reads the same forwards and backwards.',                                 test: (s)      => isPalindrome(s)           },
  { id: 18, name: 'Alternating AB',    payout: '40x',    desc: 'ABABABABAB pattern (A ≠ B).',                                                           test: (s)      => isAlternatingAB(s)        },
];

export function evaluate(seed10: string): Rule | null {
  const c = countsOf(seed10);
  for (const rule of RULES) {
    if (rule.test(seed10, c)) return rule;
  }
  return null;
}

export function getMatchingPositions(rule: Rule, seed10: string): boolean[] {
  const arr = seed10.split('');
  const counts = countsOf(seed10);
  const matches = new Array(10).fill(false);

  switch (rule.id) {
    case 1:
      return matches.map(() => true);
    case 2: {
      const ch = Object.entries(counts).find(([, cnt]) => cnt >= 9)?.[0];
      return arr.map((c) => c === ch);
    }
    case 3: {
      const ch = Object.entries(counts).find(([, cnt]) => cnt >= 8)?.[0];
      return arr.map((c) => c === ch);
    }
    case 4: {
      const ch = Object.entries(counts).find(([, cnt]) => cnt >= 7)?.[0];
      return arr.map((c) => c === ch);
    }
    case 5: {
      const ch = Object.entries(counts).find(([, cnt]) => cnt >= 6)?.[0];
      return arr.map((c) => c === ch);
    }
    case 6: {
      const ch = Object.entries(counts).find(([, cnt]) => cnt >= 5)?.[0];
      return arr.map((c) => c === ch);
    }
    case 7: {
      const quads = Object.entries(counts).filter(([, cnt]) => cnt === 4);
      if (quads.length >= 2) {
        const quadChars = quads.slice(0, 2).map(([c]) => c);
        return arr.map((c) => quadChars.includes(c));
      }
      return matches;
    }
    case 8: {
      const qc = Object.entries(counts).find(([, cnt]) => cnt === 4)?.[0];
      const tc = Object.entries(counts).find(([, cnt]) => cnt === 3)?.[0];
      if (qc && tc) return arr.map((c) => c === qc || c === tc);
      return matches;
    }
    case 9: {
      const triples = Object.entries(counts).filter(([, cnt]) => cnt === 3);
      if (triples.length >= 3) {
        const tChars = triples.slice(0, 3).map(([c]) => c);
        return arr.map((c) => tChars.includes(c));
      }
      return matches;
    }
    case 10: {
      const triples = Object.entries(counts).filter(([, cnt]) => cnt === 3);
      if (triples.length >= 2) {
        const tChars = triples.slice(0, 2).map(([c]) => c);
        return arr.map((c) => tChars.includes(c));
      }
      return matches;
    }
    case 11: {
      const pairs = Object.entries(counts).filter(([, cnt]) => cnt === 2);
      if (pairs.length === 5) {
        const pChars = pairs.map(([c]) => c);
        return arr.map((c) => pChars.includes(c));
      }
      return matches;
    }
    case 12: {
      const pairs = Object.entries(counts).filter(([, cnt]) => cnt === 2);
      if (pairs.length === 4) {
        const pChars = pairs.map(([c]) => c);
        return arr.map((c) => pChars.includes(c));
      }
      return matches;
    }
    case 13: {
      const tc = Object.entries(counts).find(([, cnt]) => cnt === 3)?.[0];
      const pChars = Object.entries(counts).filter(([, cnt]) => cnt === 2).map(([c]) => c);
      if (tc && pChars.length > 0) return arr.map((c) => c === tc || pChars.includes(c));
      return matches;
    }
    case 14: {
      const tc = Object.entries(counts).find(([, cnt]) => cnt === 3)?.[0];
      if (tc) return arr.map((c) => c === tc);
      return matches;
    }
    case 15: {
      const nums = arr.map(hexVal);
      for (let i = 0; i <= 5; i++) {
        let okAsc = true, okDesc = true;
        for (let j = 1; j < 5; j++) {
          if (nums[i + j] !== (nums[i] as number) + j) okAsc = false;
          if (nums[i + j] !== (nums[i] as number) - j) okDesc = false;
        }
        if (okAsc || okDesc) {
          const m = [...matches];
          for (let j = 0; j < 5; j++) m[i + j] = true;
          return m;
        }
      }
      return matches;
    }
    case 16: {
      const nums = arr.map(hexVal);
      const runs: [number, number][] = [];
      for (let i = 0; i <= 6; i++) {
        let okAsc = true, okDesc = true;
        for (let j = 1; j < 4; j++) {
          if (nums[i + j] !== (nums[i] as number) + j) okAsc = false;
          if (nums[i + j] !== (nums[i] as number) - j) okDesc = false;
        }
        if (okAsc || okDesc) runs.push([i, i + 3]);
      }
      for (let a = 0; a < runs.length; a++) {
        for (let b = a + 1; b < runs.length; b++) {
          const [a0, a1] = runs[a], [b0, b1] = runs[b];
          if (a1 < b0 || b1 < a0) {
            const m = [...matches];
            for (let j = a0; j <= a1; j++) m[j] = true;
            for (let j = b0; j <= b1; j++) m[j] = true;
            return m;
          }
        }
      }
      return matches;
    }
    case 17:
      return arr.map((ch, i) => ch === arr[9 - i]);
    case 18: {
      const A = arr[0], B = arr[1];
      if (A && B && A !== B) {
        return arr.map((ch, i) => (i % 2 === 0 && ch === A) || (i % 2 === 1 && ch === B));
      }
      return matches;
    }
    default:
      return matches;
  }
}

export function generateExampleForRule(ruleId: number): string {
  switch (ruleId) {
    case 1:  return '0000000000';
    case 2:  return '1111111110';
    case 3:  return '2222222200';
    case 4:  return '3333333000';
    case 5:  return '4444440000';
    case 6:  return '5555500000';
    case 7:  return '0000111122';
    case 8:  return '0000111222';
    case 9:  return '0001112223';
    case 10: return '0001112233';
    case 11: return '0011223344';
    case 12: return '0011223345';
    case 13: return '0001122334';
    case 14: return '0001234567';
    case 15: return '0123456789';
    case 16: return '0123012345';
    case 17: return '0123454321';
    case 18: return '0101010101';
    default: return '0123456789';
  }
}
