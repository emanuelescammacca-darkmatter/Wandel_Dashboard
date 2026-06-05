import { useSyncExternalStore } from 'react';

// Tiny in-memory store for positions the user creates via the New Position flow, so the
// Sidebar can show them appearing under "Positions - Clients" the moment one is completed.
// (Demo-only: resets on full reload. The sidebar already shows static positions 1 and 2.)
export interface CreatedPosition {
  id: number;
  name: string;
}

let positions: CreatedPosition[] = [];
let nextId = 3; // continues the sidebar's existing "1" and "2"
const listeners = new Set<() => void>();

export function addCreatedPosition(name: string) {
  positions = [...positions, { id: nextId++, name: name.trim() || `Position ${nextId - 1}` }];
  listeners.forEach((l) => l());
}

export function useCreatedPositions(): CreatedPosition[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => positions,
  );
}
