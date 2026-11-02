import Peer, { DataConnection } from 'peerjs';
import { DiscoveredRoom, NetworkMessage } from '../types/game';
import { PEER_CONFIG, PEER_PREFIX } from './peerConfig';

export const DISCOVERY_SLOTS = ['SLOT1', 'SLOT2', 'SLOT3', 'SLOT4', 'SLOT5'];

/**
 * Scan discovery slots (SLOT1 ~ SLOT5) to discover active family game rooms.
 * Uses a lightweight ephemeral Peer with short timeout (1500ms per slot)
 * so it never blocks UI and uses minimal battery/data.
 */
export async function scanFamilyRooms(): Promise<DiscoveredRoom[]> {
  const discovered: DiscoveredRoom[] = [];
  const scannerPeer = new Peer(PEER_CONFIG);

  // Wait for scanner peer to open or timeout
  const isOpen = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 2000);
    scannerPeer.on('open', () => {
      clearTimeout(timer);
      resolve(true);
    });
    scannerPeer.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });

  if (!isOpen) {
    try {
      scannerPeer.destroy();
    } catch {
      // Ignore
    }
    return discovered;
  }

  // Query each slot in parallel
  const scanPromises = DISCOVERY_SLOTS.map((slot) => {
    return new Promise<DiscoveredRoom | null>((resolve) => {
      const fullPeerId = `${PEER_PREFIX}${slot}`;
      let resolved = false;
      let conn: DataConnection | null = null;

      const finish = (result: DiscoveredRoom | null) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutTimer);
        try {
          if (conn && conn.open) {
            conn.close();
          }
        } catch {
          // Ignore
        }
        resolve(result);
      };

      const timeoutTimer = setTimeout(() => finish(null), 1800);

      try {
        conn = scannerPeer.connect(fullPeerId, {
          reliable: true,
          serialization: 'json',
        });

        conn.on('open', () => {
          try {
            const queryMsg: NetworkMessage = { type: 'ROOM_INFO_QUERY' };
            if (conn) {
              conn.send(queryMsg);
            }
          } catch {
            finish(null);
          }
        });

        conn.on('data', (raw: unknown) => {
          const msg = raw as NetworkMessage;
          if (msg && msg.type === 'ROOM_INFO_RESPONSE' && msg.room) {
            finish(msg.room);
          }
        });

        conn.on('error', () => finish(null));
        conn.on('close', () => finish(null));
      } catch {
        finish(null);
      }
    });
  });

  const results = await Promise.all(scanPromises);
  for (const r of results) {
    if (r) {
      discovered.push(r);
    }
  }

  try {
    scannerPeer.destroy();
  } catch {
    // Ignore
  }

  return discovered;
}

/**
 * Helper to determine which slot is available for a new host.
 * Tests SLOT1 ~ SLOT5 and returns the first one that does not respond,
 * or returns a random 4-char code if all slots are occupied.
 */
export async function findAvailableHostSlot(): Promise<string> {
  const activeRooms = await scanFamilyRooms();
  const occupiedSlots = new Set(activeRooms.map((r) => r.slotId));

  for (const slot of DISCOVERY_SLOTS) {
    if (!occupiedSlots.has(slot)) {
      return slot;
    }
  }

  // Fallback to random room code if all 5 slots are somehow in use
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rand;
}
