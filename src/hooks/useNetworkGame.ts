import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import {
  GameState,
  GameSettings,
  Player,
  NetworkMessage,
  EmojiEvent,
} from '../types/game';
import {
  createDeckAndExcluded,
  calculateFinalRankings,
  evaluateCardSynergy,
} from '../utils/gameLogic';
import { soundEngine } from '../utils/soundEngine';
import {
  PEER_PREFIX,
  PEER_CONFIG,
  generateRoomCode,
  ensureHostPeerAlive,
} from '../utils/peerConfig';
import { findAvailableHostSlot } from '../utils/roomDiscovery';

const INITIAL_COINS = 11;

export function useNetworkGame() {
  const [myPlayerId] = useState<string>(() => {
    const saved = sessionStorage.getItem('mc_player_id');
    if (saved) return saved;
    const next = 'p_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('mc_player_id', next);
    return next;
  });

  const [myName, setMyName] = useState<string>(() => {
    return localStorage.getItem('mc_player_name') || '';
  });

  const [isHost, setIsHost] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
  >('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeEmojis, setActiveEmojis] = useState<EmojiEvent[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const hostDeckRef = useRef<number[]>([]);
  const hostExcludedRef = useRef<number[]>([]);
  const gameStateRef = useRef<GameState | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const clientConnectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const hostConnRef = useRef<DataConnection | null>(null);
  const diceOrderBucketsRef = useRef<string[][]>([]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const triggerEmojiDisplay = useCallback((emojiEvent: EmojiEvent) => {
    soundEngine.playEmojiPop(emojiEvent.emoji);
    setActiveEmojis((prev) => [...prev.slice(-6), emojiEvent]);
    setTimeout(() => {
      setActiveEmojis((prev) => prev.filter((e) => e.id !== emojiEvent.id));
    }, 2800);
  }, []);

  const broadcastState = useCallback((nextState: GameState) => {
    gameStateRef.current = nextState;
    setGameState(nextState);
    const msg: NetworkMessage = { type: 'STATE_SYNC', state: nextState };
    clientConnectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }, []);

  const advanceTurnAndOrFinish = useCallback(
    (state: GameState, cardWasTaken: boolean): GameState => {
      const sortedPlayers = [...state.players].sort(
        (a, b) => a.turnOrder - b.turnOrder
      );
      const currentIdx = sortedPlayers.findIndex(
        (p) => p.id === state.currentTurnPlayerId
      );
      const nextIdx = (currentIdx + 1) % sortedPlayers.length;
      const nextPlayerId = sortedPlayers[nextIdx].id;

      if (cardWasTaken) {
        if (hostDeckRef.current.length === 0) {
          const rankings = calculateFinalRankings(state.players);
          soundEngine.playVictoryFanfare();
          return {
            ...state,
            phase: 'FINISHED',
            currentCard: null,
            centerCoins: 0,
            deckCount: 0,
            currentTurnPlayerId: null,
            hiddenExcludedCards: hostExcludedRef.current,
            winnerId: rankings[0]?.playerId || null,
          };
        }

        const nextCard = hostDeckRef.current.shift()!;
        return {
          ...state,
          currentCard: nextCard,
          centerCoins: 0,
          deckCount: hostDeckRef.current.length,
          currentTurnPlayerId: nextPlayerId,
        };
      }

      return {
        ...state,
        currentTurnPlayerId: nextPlayerId,
      };
    },
    []
  );

  const handleHostPlayerPass = useCallback(
    (playerId: string) => {
      const st = gameStateRef.current;
      if (!st || st.phase !== 'PLAYING' || st.currentTurnPlayerId !== playerId)
        return;

      const player = st.players.find((p) => p.id === playerId);
      if (!player || player.coins <= 0 || st.currentCard === null) return;

      soundEngine.playCoinPass();
      const updatedPlayers = st.players.map((p) =>
        p.id === playerId ? { ...p, coins: p.coins - 1 } : p
      );

      const nextState = advanceTurnAndOrFinish(
        {
          ...st,
          players: updatedPlayers,
          centerCoins: st.centerCoins + 1,
          lastAction: {
            id: Math.random().toString(36).slice(2),
            playerId: player.id,
            playerName: player.name,
            action: 'PASS',
            cardNumber: st.currentCard,
            timestamp: Date.now(),
          },
        },
        false
      );

      broadcastState(nextState);
    },
    [advanceTurnAndOrFinish, broadcastState]
  );

  const handleHostPlayerTake = useCallback(
    (playerId: string) => {
      const st = gameStateRef.current;
      if (!st || st.phase !== 'PLAYING' || st.currentTurnPlayerId !== playerId)
        return;
      if (st.currentCard === null) return;

      const player = st.players.find((p) => p.id === playerId);
      if (!player) return;

      const takenCard = st.currentCard;
      const takenCoins = st.centerCoins;
      soundEngine.playCardTake(takenCoins);

      const updatedPlayers = st.players.map((p) => {
        if (p.id !== playerId) return p;
        const nextCards = [...p.cards, takenCard].sort((a, b) => a - b);
        return {
          ...p,
          coins: p.coins + takenCoins,
          cards: nextCards,
        };
      });

      const nextState = advanceTurnAndOrFinish(
        {
          ...st,
          players: updatedPlayers,
          lastAction: {
            id: Math.random().toString(36).slice(2),
            playerId: player.id,
            playerName: player.name,
            action: 'TAKE',
            cardNumber: takenCard,
            coinsTaken: takenCoins,
            timestamp: Date.now(),
          },
        },
        true
      );

      broadcastState(nextState);
    },
    [advanceTurnAndOrFinish, broadcastState]
  );

  const handleHostDiceRoll = useCallback(
    (playerId: string) => {
      const st = gameStateRef.current;
      if (!st || st.phase !== 'DICE_ORDER') return;
      if (!st.diceTiedPlayerIds.includes(playerId)) return;

      const targetPlayer = st.players.find((p) => p.id === playerId);
      if (!targetPlayer || targetPlayer.diceRoll?.hasRolled) return;

      soundEngine.playDiceRoll();
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;

      const updatedPlayers = st.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              diceRoll: { dice1: d1, dice2: d2, total: d1 + d2, hasRolled: true },
            }
          : p
      );

      const allRolled = st.diceTiedPlayerIds.every((id) => {
        const pl = updatedPlayers.find((item) => item.id === id);
        return pl?.diceRoll?.hasRolled;
      });

      broadcastState({ ...st, players: updatedPlayers });

      if (allRolled) {
        setTimeout(() => {
          const currentSt = gameStateRef.current;
          if (!currentSt || currentSt.phase !== 'DICE_ORDER') return;

          const newBuckets: string[][] = [];
          for (const bucket of diceOrderBucketsRef.current) {
            if (bucket.length <= 1) {
              newBuckets.push(bucket);
              continue;
            }
            const scoreMap = new Map<number, string[]>();
            bucket.forEach((pid) => {
              const pObj = currentSt.players.find((x) => x.id === pid);
              const score = pObj?.diceRoll?.total ?? 0;
              const arr = scoreMap.get(score) || [];
              arr.push(pid);
              scoreMap.set(score, arr);
            });
            const sortedScores = Array.from(scoreMap.keys()).sort(
              (a, b) => b - a
            );
            sortedScores.forEach((sc) => {
              newBuckets.push(scoreMap.get(sc)!);
            });
          }

          diceOrderBucketsRef.current = newBuckets;
          const tiedIds = newBuckets.filter((b) => b.length > 1).flat();

          if (tiedIds.length > 0) {
            const tiedNames = tiedIds
              .map(
                (id) => currentSt.players.find((p) => p.id === id)?.name || ''
              )
              .join(', ');

            const resetTiedPlayers = currentSt.players.map((p) =>
              tiedIds.includes(p.id)
                ? {
                    ...p,
                    diceRoll: {
                      dice1: p.diceRoll?.dice1 || 1,
                      dice2: p.diceRoll?.dice2 || 1,
                      total: p.diceRoll?.total || 2,
                      hasRolled: false,
                    },
                  }
                : p
            );

            broadcastState({
              ...currentSt,
              players: resetTiedPlayers,
              diceTiedPlayerIds: tiedIds,
              diceRound: currentSt.diceRound + 1,
              diceStatusMessage: `⚡ 동점 발생! (${tiedNames})님만 주사위를 다시 굴립니다!`,
            });
          } else {
            const finalOrderIds = newBuckets.flat();
            const orderedPlayers = currentSt.players
              .map((p) => ({
                ...p,
                turnOrder: finalOrderIds.indexOf(p.id),
              }))
              .sort((a, b) => a.turnOrder - b.turnOrder);

            const firstPlayer = orderedPlayers[0];
            const firstCard = hostDeckRef.current.shift()!;

            broadcastState({
              ...currentSt,
              players: orderedPlayers,
              diceTiedPlayerIds: [],
              diceStatusMessage: `🎉 순서 확정! 1번 타자: ${firstPlayer.name}님! 곧 게임이 시작됩니다!`,
            });

            setTimeout(() => {
              const latest = gameStateRef.current;
              if (!latest) return;
              soundEngine.playCardTake(0);
              broadcastState({
                ...latest,
                phase: 'PLAYING',
                currentCard: firstCard,
                centerCoins: 0,
                deckCount: hostDeckRef.current.length,
                currentTurnPlayerId: firstPlayer.id,
              });
            }, 1900);
          }
        }, 1200);
      }
    },
    [broadcastState]
  );

  // Bind Host listeners to a Peer instance (used both on initial creation & background wake-up recreation)
  const attachHostListeners = useCallback(
    (peer: Peer) => {
      peer.on('open', () => {
        setIsHost(true);
        setConnectionStatus('CONNECTED');
        setErrorMessage(null);
      });

      peer.on('connection', (conn) => {
        conn.on('data', (raw) => {
          const msg = raw as NetworkMessage;
          const current = gameStateRef.current;
          if (!current) return;

          if (msg.type === 'JOIN_REQUEST') {
            const existing = current.players.find(
              (p) => p.id === msg.playerId
            );
            if (!existing && current.players.length >= 4) {
              conn.send({
                type: 'KICK_INFO',
                reason: '방 인원(최대 4인)이 가득 찼습니다.',
              } satisfies NetworkMessage);
              return;
            }
            if (!existing && current.phase !== 'LOBBY') {
              conn.send({
                type: 'KICK_INFO',
                reason: '이미 게임이 진행 중인 방입니다.',
              } satisfies NetworkMessage);
              return;
            }

            clientConnectionsRef.current.set(msg.playerId, conn);

            const nextPlayers: Player[] = existing
              ? current.players.map((p) =>
                  p.id === msg.playerId
                    ? { ...p, name: msg.name, connected: true }
                    : p
                )
              : [
                  ...current.players,
                  {
                    id: msg.playerId,
                    name: msg.name,
                    isHost: false,
                    coins: INITIAL_COINS,
                    cards: [],
                    turnOrder: current.players.length,
                    connected: true,
                  },
                ];

            const nextState: GameState = {
              ...current,
              players: nextPlayers,
            };

            // Send state immediately to the newly joined client AND broadcast
            if (conn.open) {
              conn.send({ type: 'STATE_SYNC', state: nextState });
            } else {
              conn.once('open', () => {
                conn.send({ type: 'STATE_SYNC', state: nextState });
              });
            }
            broadcastState(nextState);
          } else if (msg.type === 'ROOM_INFO_QUERY') {
            const current = gameStateRef.current;
            if (current) {
              const hostP = current.players.find((p) => p.isHost);
              const responseMsg: NetworkMessage = {
                type: 'ROOM_INFO_RESPONSE',
                room: {
                  slotId: current.roomCode,
                  roomCode: current.roomCode,
                  hostName: hostP?.name || '방장',
                  playerCount: current.players.length,
                  maxPlayers: 4,
                  phase: current.phase,
                  lastPing: Date.now(),
                },
              };
              if (conn.open) {
                conn.send(responseMsg);
              } else {
                conn.once('open', () => conn.send(responseMsg));
              }
            }
          } else if (msg.type === 'PLAYER_ACTION_ROLL_DICE') {
            handleHostDiceRoll(msg.playerId);
          } else if (msg.type === 'PLAYER_ACTION_PASS') {
            handleHostPlayerPass(msg.playerId);
          } else if (msg.type === 'PLAYER_ACTION_TAKE') {
            handleHostPlayerTake(msg.playerId);
          } else if (msg.type === 'SEND_EMOJI') {
            triggerEmojiDisplay(msg.emojiEvent);
            clientConnectionsRef.current.forEach((c) => {
              if (c.open) c.send(msg);
            });
          }
        });
      });

      peer.on('disconnected', () => {
        if (!peer.destroyed) {
          try {
            peer.reconnect();
          } catch {
            // Handled by visibility/heartbeat recovery
          }
        }
      });

      peer.on('error', (err: unknown) => {
        const errObj = err as { type?: string; message?: string };
        const msg = errObj?.message || String(err);
        // Never crash the Host room on temporary mobile background socket drops
        if (
          errObj?.type === 'lost-connection' ||
          errObj?.type === 'disconnected' ||
          errObj?.type === 'network' ||
          errObj?.type === 'server-error' ||
          errObj?.type === 'socket-error' ||
          errObj?.type === 'socket-closed' ||
          msg.includes('Lost connection')
        ) {
          if (!peer.destroyed && peer.disconnected) {
            try {
              peer.reconnect();
            } catch {
              // Ignore
            }
          }
          return;
        }
      });
    },
    [
      broadcastState,
      handleHostDiceRoll,
      handleHostPlayerPass,
      handleHostPlayerTake,
      triggerEmojiDisplay,
    ]
  );

  // Mobile Foreground Return & Periodic Keep-Alive Watchdog for Host
  useEffect(() => {
    const checkAndHealHost = () => {
      if (!isHost || !gameStateRef.current) return;
      const code = gameStateRef.current.roomCode;
      ensureHostPeerAlive(peerRef.current, code, (newPeer) => {
        peerRef.current = newPeer;
        attachHostListeners(newPeer);
      });
    };

    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        checkAndHealHost();
      }
    };

    const interval = setInterval(checkAndHealHost, 3500);
    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [isHost, attachHostListeners]);

  // Bot AI Turn Automation
  useEffect(() => {
    if (!isHost || !gameState) return;

    if (gameState.phase === 'DICE_ORDER') {
      const unrolledBots = gameState.players.filter(
        (p) =>
          p.isBot &&
          gameState.diceTiedPlayerIds.includes(p.id) &&
          !p.diceRoll?.hasRolled
      );
      if (unrolledBots.length > 0) {
        const timer = setTimeout(() => {
          handleHostDiceRoll(unrolledBots[0].id);
        }, 750);
        return () => clearTimeout(timer);
      }
    }

    if (gameState.phase === 'PLAYING' && gameState.currentTurnPlayerId) {
      const activePlayer = gameState.players.find(
        (p) => p.id === gameState.currentTurnPlayerId
      );
      if (activePlayer?.isBot && gameState.currentCard !== null) {
        const timer = setTimeout(() => {
          const card = gameState.currentCard!;
          const coinsOnTable = gameState.centerCoins;
          if (activePlayer.coins <= 0) {
            handleHostPlayerTake(activePlayer.id);
            return;
          }
          const synergy = evaluateCardSynergy(activePlayer.cards, card);
          const netCost = synergy.scoreDelta - coinsOnTable;
          if (
            synergy.isConnected &&
            (coinsOnTable >= 2 || synergy.connectsBelow)
          ) {
            handleHostPlayerTake(activePlayer.id);
          } else if (netCost <= 4 || coinsOnTable >= Math.ceil(card / 3.2)) {
            handleHostPlayerTake(activePlayer.id);
          } else {
            handleHostPlayerPass(activePlayer.id);
          }
        }, 1100);
        return () => clearTimeout(timer);
      }
    }
  }, [
    isHost,
    gameState,
    handleHostDiceRoll,
    handleHostPlayerPass,
    handleHostPlayerTake,
  ]);

  // Host: Open a new room
  const createRoom = useCallback(
    async (hostName: string, settings: GameSettings) => {
      const trimmed = hostName.trim() || '방장';
      setMyName(trimmed);
      localStorage.setItem('mc_player_name', trimmed);
      setErrorMessage(null);
      setConnectionStatus('CONNECTING');

      if (peerRef.current) {
        peerRef.current.destroy();
      }

      // Automatically find an available family slot (SLOT1~5) or generate 4-char code
      let code = generateRoomCode();
      try {
        const slot = await findAvailableHostSlot();
        if (slot) {
          code = slot;
        }
      } catch {
        // Fallback to random 4-char code
      }

      const peer = new Peer(PEER_PREFIX + code, PEER_CONFIG);
      peerRef.current = peer;

      const initialHostPlayer: Player = {
        id: myPlayerId,
        name: trimmed,
        isHost: true,
        coins: INITIAL_COINS,
        cards: [],
        turnOrder: 0,
        connected: true,
      };

      const initialState: GameState = {
        roomCode: code,
        phase: 'LOBBY',
        settings,
        players: [initialHostPlayer],
        deckCount: 33 - settings.excludedCount,
        hiddenExcludedCards: [],
        currentCard: null,
        centerCoins: 0,
        currentTurnPlayerId: null,
        diceTiedPlayerIds: [],
        diceRound: 1,
        diceStatusMessage: '',
        lastAction: null,
        winnerId: null,
      };

      setGameState(initialState);
      gameStateRef.current = initialState;
      attachHostListeners(peer);
    },
    [myPlayerId, attachHostListeners]
  );

  // Client: Join an existing room with automatic retry (handles Host still returning from KakaoTalk app!)
  const joinRoom = useCallback(
    (roomCode: string, playerName: string) => {
      const cleanCode = roomCode.trim().toUpperCase();
      const trimmedName = playerName.trim() || '참가자';
      setMyName(trimmedName);
      localStorage.setItem('mc_player_name', trimmedName);
      setErrorMessage(null);
      setConnectionStatus('CONNECTING');

      let attempts = 0;
      const maxAttempts = 6;
      let joinedSuccessfully = false;

      const attemptConnect = () => {
        if (joinedSuccessfully) return;
        attempts += 1;

        if (peerRef.current) {
          peerRef.current.destroy();
        }

        const peer = new Peer(PEER_CONFIG);
        peerRef.current = peer;

        const retryOrFail = () => {
          if (joinedSuccessfully) return;
          if (attempts < maxAttempts) {
            setErrorMessage(
              `방장 스마트폰과 연결 중입니다... (재시도 ${attempts}/${maxAttempts} - 방장이 카톡에서 게임 화면으로 돌아오면 즉시 연결됩니다!)`
            );
            setTimeout(attemptConnect, 2200);
          } else {
            setErrorMessage(
              '방장 스마트폰에 연결할 수 없습니다. 방장이 게임 화면을 켜두고 있는지 확인 후 다시 입장 버튼을 눌러주세요!'
            );
            setConnectionStatus('ERROR');
          }
        };

        peer.on('open', () => {
          const conn = peer.connect(PEER_PREFIX + cleanCode, {
            reliable: true,
          });
          hostConnRef.current = conn;

          // Timeout if host doesn't answer within 4 seconds
          const connectTimeout = setTimeout(() => {
            if (!joinedSuccessfully) {
              conn.close();
              retryOrFail();
            }
          }, 4000);

          conn.on('open', () => {
            clearTimeout(connectTimeout);
            joinedSuccessfully = true;
            setIsHost(false);
            setErrorMessage(null);
            setConnectionStatus('CONNECTED');
            conn.send({
              type: 'JOIN_REQUEST',
              playerId: myPlayerId,
              name: trimmedName,
            } satisfies NetworkMessage);
          });

          conn.on('data', (raw) => {
            const msg = raw as NetworkMessage;
            if (msg.type === 'STATE_SYNC') {
              joinedSuccessfully = true;
              setErrorMessage(null);
              setConnectionStatus('CONNECTED');

              const prevPhase = gameStateRef.current?.phase;
              const prevTurn = gameStateRef.current?.currentTurnPlayerId;
              const prevActionId = gameStateRef.current?.lastAction?.id;

              setGameState(msg.state);
              gameStateRef.current = msg.state;

              if (
                msg.state.lastAction &&
                msg.state.lastAction.id !== prevActionId
              ) {
                if (msg.state.lastAction.action === 'PASS') {
                  soundEngine.playCoinPass();
                } else {
                  soundEngine.playCardTake(
                    msg.state.lastAction.coinsTaken || 0
                  );
                }
              }
              if (
                msg.state.phase === 'PLAYING' &&
                msg.state.currentTurnPlayerId === myPlayerId &&
                prevTurn !== myPlayerId
              ) {
                soundEngine.playMyTurnAlert();
              }
              if (msg.state.phase === 'FINISHED' && prevPhase !== 'FINISHED') {
                soundEngine.playVictoryFanfare();
              }
            } else if (msg.type === 'SEND_EMOJI') {
              triggerEmojiDisplay(msg.emojiEvent);
            } else if (msg.type === 'KICK_INFO') {
              joinedSuccessfully = true;
              setErrorMessage(msg.reason);
              setConnectionStatus('ERROR');
              conn.close();
            }
          });

          conn.on('close', () => {
            if (joinedSuccessfully) {
              setErrorMessage('방장과의 연결이 종료되었습니다.');
              setConnectionStatus('ERROR');
            }
          });

          conn.on('error', () => {
            clearTimeout(connectTimeout);
            retryOrFail();
          });
        });

        peer.on('error', () => {
          retryOrFail();
        });
      };

      attemptConnect();
    },
    [myPlayerId, triggerEmojiDisplay]
  );

  const updateSettings = useCallback(
    (nextSettings: GameSettings) => {
      if (!isHost || !gameStateRef.current) return;
      broadcastState({
        ...gameStateRef.current,
        settings: nextSettings,
        deckCount: 33 - nextSettings.excludedCount,
      });
    },
    [isHost, broadcastState]
  );

  const addBotPlayer = useCallback(() => {
    const st = gameStateRef.current;
    if (!isHost || !st || st.phase !== 'LOBBY' || st.players.length >= 4)
      return;
    const botNames = ['루비봇 🤖', '럭키봇 🎲', '조커봇 🃏', '타짜봇 😎'];
    const botIndex = st.players.filter((p) => p.isBot).length;
    const newBot: Player = {
      id: 'bot_' + Math.random().toString(36).substring(2, 7),
      name: botNames[botIndex % botNames.length],
      isHost: false,
      isBot: true,
      coins: INITIAL_COINS,
      cards: [],
      turnOrder: st.players.length,
      connected: true,
    };
    broadcastState({
      ...st,
      players: [...st.players, newBot],
    });
  }, [isHost, broadcastState]);

  const removePlayer = useCallback(
    (targetId: string) => {
      const st = gameStateRef.current;
      if (!isHost || !st || st.phase !== 'LOBBY' || targetId === myPlayerId)
        return;
      broadcastState({
        ...st,
        players: st.players.filter((p) => p.id !== targetId),
      });
    },
    [isHost, myPlayerId, broadcastState]
  );

  const startGame = useCallback(() => {
    const st = gameStateRef.current;
    if (!isHost || !st) return;
    if (st.players.length < 3 || st.players.length > 4) {
      setErrorMessage('게임은 3인 또는 4인일 때만 시작할 수 있습니다!');
      return;
    }

    const { deck, excludedCards } = createDeckAndExcluded(
      st.settings.excludedCount
    );
    hostDeckRef.current = deck;
    hostExcludedRef.current = excludedCards;

    const allIds = st.players.map((p) => p.id);
    diceOrderBucketsRef.current = [allIds];

    const resetPlayers: Player[] = st.players.map((p, idx) => ({
      ...p,
      coins: INITIAL_COINS,
      cards: [],
      turnOrder: idx,
      diceRoll: { dice1: 1, dice2: 1, total: 2, hasRolled: false },
    }));

    broadcastState({
      ...st,
      phase: 'DICE_ORDER',
      players: resetPlayers,
      deckCount: deck.length,
      hiddenExcludedCards: [],
      currentCard: null,
      centerCoins: 0,
      currentTurnPlayerId: null,
      diceTiedPlayerIds: allIds,
      diceRound: 1,
      diceStatusMessage:
        '주사위 2개를 동시에 굴려 높은 숫자가 나온 순서대로 턴을 부여받습니다!',
      lastAction: null,
      winnerId: null,
    });
  }, [isHost, broadcastState]);

  const rollMyDice = useCallback(() => {
    if (isHost) {
      handleHostDiceRoll(myPlayerId);
    } else if (hostConnRef.current?.open) {
      soundEngine.playDiceRoll();
      hostConnRef.current.send({
        type: 'PLAYER_ACTION_ROLL_DICE',
        playerId: myPlayerId,
      } satisfies NetworkMessage);
    }
  }, [isHost, myPlayerId, handleHostDiceRoll]);

  const passTurnWithCoin = useCallback(() => {
    if (isHost) {
      handleHostPlayerPass(myPlayerId);
    } else if (hostConnRef.current?.open) {
      hostConnRef.current.send({
        type: 'PLAYER_ACTION_PASS',
        playerId: myPlayerId,
      } satisfies NetworkMessage);
    }
  }, [isHost, myPlayerId, handleHostPlayerPass]);

  const takeCenterCard = useCallback(() => {
    if (isHost) {
      handleHostPlayerTake(myPlayerId);
    } else if (hostConnRef.current?.open) {
      hostConnRef.current.send({
        type: 'PLAYER_ACTION_TAKE',
        playerId: myPlayerId,
      } satisfies NetworkMessage);
    }
  }, [isHost, myPlayerId, handleHostPlayerTake]);

  const sendEmoji = useCallback(
    (emoji: string, label: string) => {
      const ev: EmojiEvent = {
        id: Math.random().toString(36).slice(2),
        senderId: myPlayerId,
        senderName: myName || '플레이어',
        emoji,
        label,
        timestamp: Date.now(),
      };
      if (isHost) {
        triggerEmojiDisplay(ev);
        clientConnectionsRef.current.forEach((c) => {
          if (c.open) c.send({ type: 'SEND_EMOJI', emojiEvent: ev });
        });
      } else if (hostConnRef.current?.open) {
        hostConnRef.current.send({
          type: 'SEND_EMOJI',
          emojiEvent: ev,
        } satisfies NetworkMessage);
      }
    },
    [isHost, myPlayerId, myName, triggerEmojiDisplay]
  );

  const returnToLobby = useCallback(() => {
    const st = gameStateRef.current;
    if (!isHost || !st) return;
    broadcastState({
      ...st,
      phase: 'LOBBY',
      hiddenExcludedCards: [],
      currentCard: null,
      centerCoins: 0,
      lastAction: null,
    });
  }, [isHost, broadcastState]);

  return {
    myPlayerId,
    myName,
    setMyName,
    isHost,
    connectionStatus,
    errorMessage,
    gameState,
    activeEmojis,
    createRoom,
    joinRoom,
    updateSettings,
    addBotPlayer,
    removePlayer,
    startGame,
    rollMyDice,
    passTurnWithCoin,
    takeCenterCard,
    sendEmoji,
    returnToLobby,
  };
}
