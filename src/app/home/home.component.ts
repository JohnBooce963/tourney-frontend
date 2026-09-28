import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../api.service';
import { Toasts } from '../toasts.service';
import { LobbySummary, STATUS_LABEL, THEMES, themeOf } from '../models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private api = inject(Api);
  private router = inject(Router);
  private toasts = inject(Toasts);

  readonly themes = THEMES;
  readonly themeOf = themeOf;
  readonly statusLabel = STATUS_LABEL;

  lobbies = signal<LobbySummary[] | null>(null);
  live = signal(true);
  busy = signal(false);
  name = '';
  theme = THEMES[THEMES.length - 1].id;

  constructor() {
    this.api
      .stream('/lobby/events', ['lobbies'])
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (ev) => {
          if (ev.type === 'lobbies') this.lobbies.set(ev.data);
          this.live.set(ev.type !== 'reconnecting');
        },
        error: () => this.live.set(false),
      });
  }

  async create() {
    this.busy.set(true);
    try {
      const { id, ownerToken } = await this.api.createLobby(this.name.trim(), this.theme);
      this.api.saveSeat(id, { owner: ownerToken });
      this.router.navigate(['/lobby', id]);
    } catch (e) {
      this.toasts.error(e);
    } finally {
      this.busy.set(false);
    }
  }
}
