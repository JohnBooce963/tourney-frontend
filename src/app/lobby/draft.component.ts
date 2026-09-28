import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../api.service';
import { Toasts } from '../toasts.service';
import { LobbyView, Operator, PHASE_LABEL, Phase, Squad, TOTAL_STEPS } from '../models';

// Each player's board: slot indices they own (even = Player 1, odd = Player 2).
const BOARD = [0, 1].map((p) => ({
  bans: [p, p + 2, p + 4],
  picks: [p, p + 2, p + 4, p + 6, p + 8],
}));

@Component({
  selector: 'app-draft',
  standalone: true,
  imports: [FormsModule, RouterLink, NgTemplateOutlet],
  templateUrl: './draft.component.html',
  styleUrl: './draft.component.scss',
})
export class DraftComponent implements OnInit {
  api = inject(Api);
  private toasts = inject(Toasts);

  lobby = input.required<LobbyView>();

  readonly board = BOARD;
  readonly steps = TOTAL_STEPS;
  readonly phaseLabel = PHASE_LABEL;
  readonly classes = ['Vanguard', 'Guard', 'Defender', 'Sniper', 'Caster', 'Medic', 'Supporter', 'Specialist'];

  ops = signal<Operator[]>([]);
  squads = signal<Squad[]>([]);
  search = signal('');
  cls = signal('');
  pending = signal(false);
  private now = signal(Date.now());
  private choice = signal({ step: -1, id: '' });

  draft = computed(() => this.lobby().draft!);
  turn = computed(() => this.draft().turn);
  mySlot = computed(() => {
    const s = this.api.seat(this.lobby().id);
    return s.player && s.slot !== undefined ? s.slot : null;
  });
  myTurn = computed(() => this.turn() !== null && this.turn()!.player === this.mySlot());
  // A local choice only counts for the step it was made in.
  myChoice = computed(() => (this.choice().step === this.draft().step ? this.choice().id : ''));
  shown = computed(() => (this.myTurn() && this.myChoice()) || this.draft().selected);

  remaining = computed(() => (this.turn() ? this.secondsUntil(this.draft().turnEndsAt) : 0));
  closesIn = computed(() => this.secondsUntil(this.lobby().closesAt ?? 0));
  isOwner = computed(() => !!this.api.seat(this.lobby().id).owner);

  private opById = computed(() => new Map(this.ops().map((o) => [o.id, o])));
  private squadById = computed(() => new Map(this.squads().map((s) => [s.id, s])));

  // CSS state per item for the pool grid: banned / picked by P1 / picked by P2.
  itemState = computed(() => {
    const { squad, ban, pick } = this.draft().slots;
    const m = new Map<string, string>();
    [...squad, ...ban].forEach((id) => id && m.set(id, 'banned'));
    pick.forEach((id, i) => id && m.set(id, `picked p${(i % 2) + 1}`));
    return m;
  });

  filteredOps = computed(() => {
    const q = this.search().trim().toLowerCase();
    const c = this.cls();
    return this.ops().filter((o) => (!c || o.cls === c) && (!q || o.name.toLowerCase().includes(q)));
  });

  constructor() {
    const tick = setInterval(() => this.now.set(Date.now()), 250);
    inject(DestroyRef).onDestroy(() => clearInterval(tick));
  }

  ngOnInit() {
    const fail = (e: unknown) => this.toasts.show('Could not load game data. Try reloading.', 'error');
    this.api.operators().subscribe({ next: (o) => this.ops.set(o), error: fail });
    this.api.squads(this.lobby().theme).subscribe({ next: (s) => this.squads.set(s), error: fail });
  }

  item(phase: Phase, id: string): { name: string; img: string } | null {
    if (!id) return null;
    const kind = phase === 'squad' ? 'squad' : 'op';
    const found = kind === 'squad' ? this.squadById().get(id) : this.opById().get(id);
    return { name: found?.name ?? id, img: this.api.img(kind, id) };
  }

  slotContent(phase: Phase, index: number) {
    const filled = this.draft().slots[phase][index];
    const active = this.turn()?.phase === phase && this.turn()?.index === index;
    return { active, preview: !filled && active, item: this.item(phase, filled || (active ? this.shown() : '')) };
  }

  choose(id: string) {
    if (!this.myTurn() || this.itemState().has(id) || this.pending()) return;
    this.choice.set({ step: this.draft().step, id });
    this.act('select', id);
  }

  async confirm() {
    const id = this.myChoice();
    if (!id || this.pending()) return;
    this.pending.set(true);
    await this.act('confirm', id);
    this.pending.set(false);
  }

  mmss(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  // Everyone (owner included) is sent home by the 'deleted' event.
  close() {
    if (!confirm('Close this lobby for everyone now?')) return;
    this.api
      .act(this.lobby().id, 'delete', { token: this.api.seat(this.lobby().id).owner })
      .catch((e) => this.toasts.error(e));
  }

  // Server timestamps adjusted for clock skew: offset measured when the snapshot arrived.
  private secondsUntil(ts: number) {
    const l = this.lobby();
    return Math.max(0, Math.ceil((ts - l.serverNow - (this.now() - l.receivedAt)) / 1000));
  }

  private act(action: string, item: string) {
    const token = this.api.seat(this.lobby().id).player;
    return this.api.act(this.lobby().id, action, { token, item }).catch((e) => this.toasts.error(e));
  }
}
