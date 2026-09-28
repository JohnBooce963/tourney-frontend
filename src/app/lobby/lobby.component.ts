import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap, tap } from 'rxjs';
import { Api, StreamEvent } from '../api.service';
import { Toasts } from '../toasts.service';
import { LobbyView } from '../models';
import { RoomComponent } from './room.component';
import { DraftComponent } from './draft.component';

// One page per lobby: a single live stream drives both the waiting room and the draft board.
@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [RouterLink, RoomComponent, DraftComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent {
  private api = inject(Api);
  private router = inject(Router);
  private toasts = inject(Toasts);

  lobby = signal<LobbyView | null>(null);
  gone = signal(false);
  live = signal(true);
  coin = signal<{ result: number; key: number } | null>(null);
  private id = '';

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((p) => p.get('id')!),
        tap((id) => {
          this.id = id;
          this.lobby.set(null);
          this.gone.set(false);
        }),
        switchMap((id) =>
          this.api.stream(`/lobby/${id}/events`, ['state', 'coin', 'deleted']).pipe(
            catchError(() => {
              this.gone.set(true);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((ev) => this.onEvent(ev));
  }

  private onEvent(ev: StreamEvent) {
    this.live.set(ev.type !== 'reconnecting');
    if (ev.type === 'state') {
      const cur = this.lobby();
      if (!cur || ev.data.rev >= cur.rev) this.lobby.set({ ...ev.data, receivedAt: Date.now() });
    } else if (ev.type === 'coin') {
      const key = Date.now();
      this.coin.set({ result: ev.data.result, key });
      setTimeout(() => this.coin()?.key === key && this.coin.set(null), 5000);
    } else if (ev.type === 'deleted') {
      this.api.saveSeat(this.id, null);
      this.toasts.show('The lobby was closed');
      this.router.navigate(['/']);
    }
  }
}
