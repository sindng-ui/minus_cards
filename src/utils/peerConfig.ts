import Peer, { DataConnection, PeerOptions } from 'peerjs';

export const PEER_PREFIX = 'minus-cards-v1-room-';

// Multiple reliable global STUN + Free OpenRelay TURN servers
// so mobile phones on LTE/5G/Wi-Fi behind strict carrier NATs can ALWAYS connect!
export const PEER_CONFIG: PeerOptions = {
  debug: 1,
  pingInterval: 5000,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
  },
};

export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Extracts room code from either `?room=XXXX` query string OR `#room=XXXX` hash.
 */
export function extractRoomCodeFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const searchParam = new URLSearchParams(window.location.search).get('room');
  if (searchParam && searchParam.trim().length >= 3) {
    return searchParam.trim().toUpperCase();
  }
  const hash = window.location.hash;
  if (hash && hash.includes('room=')) {
    const match = hash.match(/room=([A-Za-z0-9]+)/);
    if (match && match[1]) {
      return match[1].trim().toUpperCase();
    }
  }
  return '';
}

/**
 * Ensures a Host Peer stays alive or recreates itself with the exact same Room ID
 * if mobile OS kills the background WebSocket during KakaoTalk switching.
 */
export function ensureHostPeerAlive(
  currentPeer: Peer | null,
  roomCode: string,
  onRecreated: (newPeer: Peer) => void
) {
  if (!roomCode) return;
  if (!currentPeer || currentPeer.destroyed) {
    const nextPeer = new Peer(PEER_PREFIX + roomCode, PEER_CONFIG);
    onRecreated(nextPeer);
    return;
  }
  if (currentPeer.disconnected) {
    try {
      currentPeer.reconnect();
    } catch {
      const nextPeer = new Peer(PEER_PREFIX + roomCode, PEER_CONFIG);
      onRecreated(nextPeer);
    }
  }
}

export type ConnectionListenerBinder = (conn: DataConnection) => void;
