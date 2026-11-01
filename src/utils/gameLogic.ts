import { Player, PlayerScoreDetail } from '../types/game';

/**
 * Generates all 33 cards (3 to 35), shuffles them with Fisher-Yates,
 * and splits into active deck and excluded hidden cards (2 to 9 cards).
 */
export function createDeckAndExcluded(excludedCount: number): {
  deck: number[];
  excludedCards: number[];
} {
  const allCards: number[] = [];
  for (let n = 3; n <= 35; n++) {
    allCards.push(n);
  }

  // Fisher-Yates shuffle
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }

  const clampedExcluded = Math.max(2, Math.min(9, excludedCount));
  const excludedCards = allCards.slice(0, clampedExcluded).sort((a, b) => a - b);
  const deck = allCards.slice(clampedExcluded);

  return { deck, excludedCards };
}

/**
 * Groups sorted cards into consecutive runs.
 * Example: [4, 5, 11, 12, 13, 28] -> [[4, 5], [11, 12, 13], [28]]
 */
export function groupConsecutiveCards(cards: number[]): number[][] {
  if (!cards || cards.length === 0) return [];
  const sorted = [...cards].sort((a, b) => a - b);
  const groups: number[][] = [];
  let currentGroup: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentGroup.push(sorted[i]);
    } else if (sorted[i] !== sorted[i - 1]) {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);
  return groups;
}

/**
 * Calculates card sum where consecutive sequences only count their lowest number.
 */
export function calculateCardSum(cards: number[]): number {
  const groups = groupConsecutiveCards(cards);
  return groups.reduce((sum, group) => sum + group[0], 0);
}

/**
 * Calculates total score = (Card Sum - Coins)
 */
export function calculateNetScore(cards: number[], coins: number): number {
  return calculateCardSum(cards) - coins;
}

/**
 * Checks if taking `targetCard` connects consecutively with any existing card in `playerCards`.
 * Returns the delta in card score if taken (can even be negative if it bridges two existing groups!).
 */
export function evaluateCardSynergy(
  playerCards: number[],
  targetCard: number
): {
  isConnected: boolean;
  connectsBelow: boolean; // targetCard + 1 exists in playerCards (replaces higher start!)
  connectsAbove: boolean; // targetCard - 1 exists in playerCards (free addition!)
  scoreDelta: number;
} {
  const currentSum = calculateCardSum(playerCards);
  const nextSum = calculateCardSum([...playerCards, targetCard]);
  const connectsAbove = playerCards.includes(targetCard - 1);
  const connectsBelow = playerCards.includes(targetCard + 1);

  return {
    isConnected: connectsAbove || connectsBelow,
    connectsBelow,
    connectsAbove,
    scoreDelta: nextSum - currentSum,
  };
}

/**
 * Computes final rankings for all players.
 * Lowest finalScore wins.
 * Tie-breaker: Player with MORE coins wins!
 */
export function calculateFinalRankings(players: Player[]): PlayerScoreDetail[] {
  const details: PlayerScoreDetail[] = players.map((p) => {
    const groups = groupConsecutiveCards(p.cards);
    const cardSum = groups.reduce((acc, g) => acc + g[0], 0);
    const finalScore = cardSum - p.coins;
    return {
      playerId: p.id,
      name: p.name,
      groups,
      cardSum,
      coins: p.coins,
      finalScore,
      rank: 1,
    };
  });

  details.sort((a, b) => {
    if (a.finalScore !== b.finalScore) {
      return a.finalScore - b.finalScore; // Lower is better
    }
    return b.coins - a.coins; // Tie-breaker: More coins wins
  });

  details.forEach((item, idx) => {
    if (idx === 0) {
      item.rank = 1;
    } else {
      const prev = details[idx - 1];
      if (prev.finalScore === item.finalScore && prev.coins === item.coins) {
        item.rank = prev.rank;
      } else {
        item.rank = idx + 1;
      }
    }
  });

  return details;
}

/**
 * Returns the visual color theme for a card based on its tens digit:
 * 1-digit (3~9), 10s (10~19), 20s (20~29), 30s (30~35)
 */
export interface CardTheme {
  tierName: string;
  bgGradient: string;
  borderClass: string;
  accentText: string;
  badgeBg: string;
  glowColor: string;
}

export function getCardTheme(num: number): CardTheme {
  if (num < 10) {
    // 3 ~ 9: Emerald / Cyan
    return {
      tierName: '1자리 (3~9)',
      bgGradient: 'linear-gradient(145deg, #064e3b 0%, #047857 50%, #065f46 100%)',
      borderClass: 'border-emerald-300',
      accentText: 'text-emerald-200',
      badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-400/50',
      glowColor: '#10b981',
    };
  }
  if (num < 20) {
    // 10 ~ 19: Royal Gold / Amber
    return {
      tierName: '10자리 (10~19)',
      bgGradient: 'linear-gradient(145deg, #78350f 0%, #b45309 50%, #92400e 100%)',
      borderClass: 'border-amber-300',
      accentText: 'text-amber-200',
      badgeBg: 'bg-amber-950/90 text-amber-300 border-amber-400/50',
      glowColor: '#f59e0b',
    };
  }
  if (num < 30) {
    // 20 ~ 29: Mystic Purple / Violet
    return {
      tierName: '20자리 (20~29)',
      bgGradient: 'linear-gradient(145deg, #3b0764 0%, #6d28d9 50%, #4c1d95 100%)',
      borderClass: 'border-purple-300',
      accentText: 'text-purple-200',
      badgeBg: 'bg-purple-950/90 text-purple-200 border-purple-400/50',
      glowColor: '#a855f7',
    };
  }
  // 30 ~ 35: Danger Crimson / Ruby
  return {
    tierName: '30자리 (30~35)',
    bgGradient: 'linear-gradient(145deg, #7f1d1d 0%, #be123c 50%, #881337 100%)',
    borderClass: 'border-rose-300',
    accentText: 'text-rose-200',
    badgeBg: 'bg-rose-950/90 text-rose-200 border-rose-400/50',
    glowColor: '#f43f5e',
  };
}
