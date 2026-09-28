import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../api.service';
import { Toasts } from '../toasts.service';
import { LobbyView, themeOf } from '../models';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent {
  api = inject(Api);
  private toasts = inject(Toasts);
  private router = inject(Router);

  lobby = input.required<LobbyView>();

  seat = computed(() => this.api.seat(this.lobby().id));
  mySlot = computed(() => {
    const s = this.seat().slot;
    return s !== undefined && this.lobby().players[s] ? s : null;
  });
  isOwner = computed(() => !!this.seat().owner);
  isMember = computed(() => this.isOwner() || this.mySlot() !== null);
  full = computed(() => this.lobby().players.every(Boolean));
  theme = computed(() => themeOf(this.lobby().theme));
  busy = signal(false);

  join(slot: number) {
    this.run(async () => {
      const name = this.api.playerName().trim() || 'Guest';
      const res = await this.api.act<{ slot: number; playerToken: string }>(this.lobby().id, 'join', { name, slot });
      this.api.saveSeat(this.lobby().id, { player: res.playerToken, slot: res.slot });
    });
  }

  leave() {
    this.run(async () => {
      await this.api.act(this.lobby().id, 'leave', { token: this.seat().player });
      this.api.saveSeat(this.lobby().id, { player: undefined, slot: undefined });
    });
  }

  flip() {
    this.run(() => this.api.act(this.lobby().id, 'flip', { token: this.token() }));
  }

  start() {
    this.run(() => this.api.act(this.lobby().id, 'start', { token: this.token() }));
  }

  remove() {
    if (!confirm('Delete this lobby for everyone?')) return;
    this.run(async () => {
      await this.api.act(this.lobby().id, 'delete', { token: this.seat().owner });
      this.router.navigate(['/']);
    });
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      this.toasts.show('Invite link copied');
    } catch {
      this.toasts.show(location.href);
    }
  }

  private token() {
    return this.seat().player ?? this.seat().owner;
  }

  private async run(fn: () => Promise<unknown>) {
    this.busy.set(true);
    try {
      await fn();
    } catch (e) {
      this.toasts.error(e);
    } finally {
      this.busy.set(false);
    }
  }
}
