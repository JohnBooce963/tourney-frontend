export type Phase = 'squad' | 'ban' | 'pick';
export type Status = 'waiting' | 'drafting' | 'done';

export interface LobbySummary {
  id: string;
  name: string;
  theme: number;
  players: (string | null)[];
  status: Status;
}

export interface Turn {
  phase: Phase;
  index: number;
  player: number;
}

export interface DraftState {
  step: number;
  turn: Turn | null;
  selected: string;
  slots: Record<Phase, string[]>;
  turnEndsAt: number;
}

export interface LobbyView extends LobbySummary {
  rev: number;
  serverNow: number;
  closesAt: number | null; // set once the draft is done; the lobby is deleted at this time
  draft: DraftState | null;
  receivedAt: number; // set on the client when the snapshot arrives, for the turn timer
}

export interface Operator {
  id: string;
  name: string;
  cls: string;
  rarity: number;
}

export interface Squad {
  id: string;
  name: string;
}

export const THEMES = [
  { id: 1, name: 'Phantom & Crimson Solitaire', art: 'assets/themes/theme1.webp' },
  { id: 2, name: 'Mizuki & Caerula Arbor', art: 'assets/themes/theme2.webp' },
  { id: 3, name: "Expeditioner's Jǫklumarkar", art: 'assets/themes/theme3.webp' },
  { id: 4, name: "Sarkaz's Furnaceside Fables", art: 'assets/themes/theme4.webp' },
];

export const themeOf = (id: number) => THEMES.find((t) => t.id === id) ?? THEMES[0];

export const TOTAL_STEPS = 18;

export const PHASE_LABEL: Record<Phase, string> = { squad: 'Ban squad', ban: 'Ban', pick: 'Pick' };

export const STATUS_LABEL: Record<Status, string> = { waiting: 'Open', drafting: 'Drafting', done: 'Finished' };
