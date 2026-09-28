import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, shareReplay, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { Operator, Squad } from './models';

const API = `${environment.apiUrl}/api`;

export type StreamEvent = { type: string; data?: any };

// Tokens this browser holds for a lobby: owner (created it) and/or player (took a seat).
export type Seat = { owner?: string; player?: string; slot?: number };

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private cache = new Map<string, Observable<unknown>>();

  readonly seats = signal<Record<string, Seat>>(load('tourney:seats') ?? {});
  readonly playerName = signal<string>(load('tourney:name') ?? '');

  operators = () => this.once<Operator[]>('/db/operator');
  squads = (theme: number) => this.once<Squad[]>(`/db/squad/${theme}`);
  img = (kind: 'op' | 'squad', id: string) => `${API}/img/${kind}/${encodeURIComponent(id)}`;

  createLobby(name: string, theme: number) {
    return this.post<{ id: string; ownerToken: string }>('/lobby', { name, theme });
  }

  act<T = unknown>(lobbyId: string, action: string, body: object) {
    return this.post<T>(`/lobby/${lobbyId}/${action}`, body);
  }

  // Server-Sent Events as an Observable. EventSource reconnects by itself; we surface that as
  // 'open' / 'reconnecting' events. A permanent failure (e.g. 404 for a deleted lobby) errors out.
  stream(path: string, types: string[]): Observable<StreamEvent> {
    return new Observable<StreamEvent>((sub) => {
      const es = new EventSource(API + path);
      // addEventListener (not onopen/onerror) so zone.js sees the callbacks and Angular re-renders.
      es.addEventListener('open', () => sub.next({ type: 'open' }));
      es.addEventListener('error', () =>
        es.readyState === EventSource.CLOSED ? sub.error(new Error('closed')) : sub.next({ type: 'reconnecting' }),
      );
      for (const type of types) {
        es.addEventListener(type, (e) => sub.next({ type, data: JSON.parse((e as MessageEvent).data) }));
      }
      return () => es.close();
    });
  }

  seat(lobbyId: string): Seat {
    return this.seats()[lobbyId] ?? {};
  }

  saveSeat(lobbyId: string, patch: Seat | null) {
    this.seats.update((all) => {
      const next = { ...all };
      if (patch) next[lobbyId] = { ...next[lobbyId], ...patch };
      else delete next[lobbyId];
      save('tourney:seats', next);
      return next;
    });
  }

  setName(name: string) {
    this.playerName.set(name);
    save('tourney:name', name);
  }

  private post<T>(path: string, body: object): Promise<T> {
    return firstValueFrom(this.http.post<T>(API + path, body)).catch((e: HttpErrorResponse) => {
      throw new Error(e.error?.error ?? (e.status === 0 ? 'Cannot reach the server' : e.message));
    });
  }

  // Static game data is fetched once per page load; the HTTP cache covers reloads.
  private once<T>(path: string): Observable<T> {
    if (!this.cache.has(path)) {
      const req = this.http.get<T>(API + path).pipe(
        tap({ error: () => this.cache.delete(path) }), // don't cache failures
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.cache.set(path, req);
    }
    return this.cache.get(path) as Observable<T>;
  }
}

function load<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
