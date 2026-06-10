import { useSyncExternalStore } from 'react';

/* ────────────────────────────────────────────────────────────────────────────
   Talent store — the prototype's single source of truth for everything that is
   displayed on more than one page (MECE):

   · the canonical identity of the 8 demo candidates (name, position, city, …)
   · the pipeline stage + days-in-stage of each candidate
   · the match score

   All surfaces (dashboard kanban, position table, position kanban, candidate
   profile) read from here. Stage writes (drag & drop, evaluate dropdown) go
   through setStage() and are immediately visible everywhere.

   In production this module is replaced by the API: stage/match/days live on
   the `application` record (see docs/Handover §03 + §07).
   ──────────────────────────────────────────────────────────────────────────── */

export type Stage = 'rejected' | 'new' | 'shortlist' | 'interview' | 'offer' | 'hired';

/* One canonical stage definition — labels, hints and accents for every surface. */
export const STAGES: { key: Stage; label: string; hint: string; accent: string; terminal?: boolean }[] = [
  { key: 'rejected', label: 'Rejected', hint: 'Not moving forward', accent: '#ef4444', terminal: true },
  { key: 'new', label: 'New', hint: 'Fresh matches', accent: '#3b82f6' },
  { key: 'shortlist', label: 'Shortlisted', hint: 'Marked for review', accent: '#6366f1' },
  { key: 'interview', label: 'Interviewing', hint: 'Scheduled or pending', accent: '#a855f7' },
  { key: 'offer', label: 'Offer Extended', hint: 'Awaiting decision', accent: '#f59e0b' },
  { key: 'hired', label: 'Hired', hint: 'Closed — won', accent: '#16a34a', terminal: true },
];
export const stageMeta = (s: Stage) => STAGES.find(x => x.key === s) ?? STAGES[1];
export const isTerminal = (s: Stage) => stageMeta(s).terminal ?? false;

/* Canonical candidate facts — ids match `mockCandidates` (the profile pages). */
export type TalentSeed = {
  id: string;
  name: string;
  position: string;        // the position the candidate is matched to
  city: string;
  distance: string;        // to the position's location
  match: number;           // 0–100 fit score (same value on every page)
  color: string;           // avatar color
  stage: Stage;            // initial stage
  daysInStage: number;     // initial days in that stage
};

export const TALENT: Record<string, TalentSeed> = {
  '1': { id: '1', name: 'Marcel Weber',        position: 'Servicetechniker für Kaffeeautomaten', city: 'München',   distance: '8 km',  match: 84, color: '#4f46e5', stage: 'interview', daysInStage: 6 },
  '2': { id: '2', name: 'Andi Kufner',         position: 'Servicetechniker für Kaffeeautomaten', city: 'München',   distance: '12 km', match: 92, color: '#16a34a', stage: 'offer',     daysInStage: 1 },
  '3': { id: '3', name: 'Udo Alexander Brandt', position: 'Servicetechniker für Kaffeeautomaten', city: 'Rosenheim', distance: '62 km', match: 38, color: '#0891b2', stage: 'shortlist', daysInStage: 4 },
  '4': { id: '4', name: 'Andreas Gottschalk',  position: 'Servicetechniker für Kaffeeautomaten', city: 'Augsburg',  distance: '55 km', match: 59, color: '#d97706', stage: 'new',       daysInStage: 2 },
  '5': { id: '5', name: 'Giovanni Rossi',      position: 'Servicetechniker für Kaffeeautomaten', city: 'München',   distance: '10 km', match: 67, color: '#7c3aed', stage: 'new',       daysInStage: 3 },
  '6': { id: '6', name: 'Niclas Gallas',       position: 'Servicetechniker für Kaffeeautomaten', city: 'München',   distance: '15 km', match: 48, color: '#b45309', stage: 'rejected',  daysInStage: 3 },
  '7': { id: '7', name: 'Klaus Müller',        position: 'Lagerlogistiker',                      city: 'Dachau',    distance: '18 km', match: 87, color: '#0369a1', stage: 'hired',     daysInStage: 1 },
  '8': { id: '8', name: 'Sophie Bauer',        position: 'Bürokauffrau',                         city: 'Freising',  distance: '32 km', match: 76, color: '#be185d', stage: 'interview', daysInStage: 7 },
};

export const matchOf = (id: string): number => TALENT[id]?.match ?? 70;

/* ── Live stage state (external store, shared across the whole app) ── */

export type StageState = Record<string, { stage: Stage; daysInStage: number }>;

let state: StageState = Object.fromEntries(
  Object.values(TALENT).map(t => [t.id, { stage: t.stage, daysInStage: t.daysInStage }]),
);
const listeners = new Set<() => void>();

export function setStage(id: string, stage: Stage) {
  const cur = state[id];
  if (!cur || cur.stage === stage) return;
  // Moving a candidate resets the days-in-stage counter (mirrors stage_entered_at).
  state = { ...state, [id]: { stage, daysInStage: 0 } };
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};
const getSnapshot = () => state;

/** Subscribe a component to the live stage state of all candidates. */
export function useStages(): StageState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export const stageOf = (s: StageState, id: string): Stage => s[id]?.stage ?? 'new';
export const daysInStageOf = (s: StageState, id: string): number => s[id]?.daysInStage ?? 0;
