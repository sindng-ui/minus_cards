export type GamePhase = 'LOBBY' | 'DICE_ORDER' | 'PLAYING' | 'FINISHED';

export interface GameSettings {
  excludedCount: number; // 2 to 9 cards excluded
  coinVisibility: 'PUBLIC' | 'HIDDEN'; // Host sets whether player coins are visible to others
}

export interface DiceRollResult {
  playerId: string;
  dice1: number;
  dice2: number;
  total: number;
  round: number;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isBot?: boolean;
  coins: number; // Starts with 11
  cards: number[]; // Sorted ascending
  turnOrder: number; // 0 to 3 after dice roll
  diceRoll?: {
    dice1: number;
    dice2: number;
    total: number;
    hasRolled: boolean;
  };
  connected: boolean;
}

export interface EmojiEvent {
  id: string;
  senderId: string;
  senderName: string;
  emoji: string;
  label: string;
  timestamp: number;
}

export interface TurnHistoryItem {
  id: string;
  playerId: string;
  playerName: string;
  action: 'PASS' | 'TAKE';
  cardNumber: number;
  coinsTaken?: number;
  timestamp: number;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  settings: GameSettings;
  players: Player[];
  deckCount: number; // Remaining cards in deck (excluding current open card)
  hiddenExcludedCards: number[]; // Revealed ONLY when phase === 'FINISHED'
  currentCard: number | null;
  centerCoins: number;
  currentTurnPlayerId: string | null;
  diceTiedPlayerIds: string[]; // Players who must roll in current dice sub-round
  diceRound: number;
  diceStatusMessage: string;
  lastAction: TurnHistoryItem | null;
  winnerId: string | null;
}

export interface DiscoveredRoom {
  slotId: string;
  roomCode: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhase;
  lastPing: number;
}

export type NetworkMessage =
  | { type: 'JOIN_REQUEST'; playerId: string; name: string }
  | { type: 'STATE_SYNC'; state: GameState }
  | { type: 'PLAYER_ACTION_ROLL_DICE'; playerId: string }
  | { type: 'PLAYER_ACTION_PASS'; playerId: string }
  | { type: 'PLAYER_ACTION_TAKE'; playerId: string }
  | { type: 'SEND_EMOJI'; emojiEvent: EmojiEvent }
  | { type: 'KICK_INFO'; reason: string }
  | { type: 'ROOM_INFO_QUERY' }
  | { type: 'ROOM_INFO_RESPONSE'; room: DiscoveredRoom };

export interface PlayerScoreDetail {
  playerId: string;
  name: string;
  groups: number[][]; // Consecutive number runs, e.g. [[4, 5], [11, 12, 13], [28]]
  cardSum: number; // Sum of lowest number in each group
  coins: number;
  finalScore: number; // cardSum - coins
  rank: number;
}
