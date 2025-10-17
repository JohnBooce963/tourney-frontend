import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PopupService } from './popup.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { LobbyRequest } from '../model/lobbyRequest';
import { LobbyResponse } from '../model/lobbyResponse';
import { forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { JoinRequest } from '../model/joinRequest';
import { operator } from '../model/operator';
import { Squad } from '../model/squad';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class HttpServiceService {

  constructor(
    private http: HttpClient,
    private popup: PopupService,
    private router: Router,
    private cache: CacheService
  ) { }

  createLobby(lobbyRequest: LobbyRequest): Observable<LobbyResponse> {
    return this.http.post<LobbyResponse>(
      `${environment.apiUrl}/api/lobby`,
      lobbyRequest
    );
  }

  getLobbies(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}/api/lobby`);
  }

  getLobby(lobbyId: string): Observable<LobbyResponse> {
    return this.http.get<LobbyResponse>(
      `${environment.apiUrl}/api/lobby/${lobbyId}`
    );
  }

  joinLobby(lobbyId: string, req: JoinRequest): Observable<LobbyResponse> {
    return this.http.post<LobbyResponse>(
      `${environment.apiUrl}/api/lobby/${lobbyId}/join`,
      req
    );
  }

  cancelRole(lobbyId: string, slot: string): Observable<LobbyResponse> {
    return this.http.post<LobbyResponse>(
      `${environment.apiUrl}/api/lobby/${lobbyId}/cancel/${slot}`,
      {}
    );
  }

  leaveLobby(lobbyId: string, playerName: string): Observable<LobbyResponse> {
    return this.http.post<LobbyResponse>(
      `${environment.apiUrl}/api/lobby/${lobbyId}/leave`,
      { playerName }
    );
  }

  deleteLobby(lobbyId: string, ownerToken: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/api/lobby/${lobbyId}/delete`,
      { ownerToken }
    );
  }

  flipCoin(lobbyId: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/api/lobby/${lobbyId}/flip`
    );
  }

  sendAction(payload: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/action`, payload)
  }

  fetchOperators(): Observable<operator[]> {
    const cached = this.cache.getOperators();
    if (cached) return of(cached);

    return this.http.get<operator[]>(`${environment.apiUrl}/api/db/operator`).pipe(
      tap(data => this.cache.setOperators(data))
    );
  }

  fetchSquad(theme: number): Observable<Squad[]> {
    const cached = this.cache.getSquads(theme);
    if (cached) return of(cached);

    return this.http.get<Squad[]>(`${environment.apiUrl}/api/db/squad/${theme}`).pipe(
      tap(data => this.cache.setSquads(theme, data))
    );
  }

  loadLobbyWithCache(lobbyId: string): Observable<{ lobby: LobbyResponse, squads: Squad[] }> {
    return this.http.get<LobbyResponse>(`${environment.apiUrl}/api/lobby/${lobbyId}`).pipe(
      switchMap(lobby => 
        this.fetchSquad(lobby.theme).pipe(
          tap(squads => console.log('Squads cached/loaded')),
          switchMap(squads => of({ lobby, squads }))
        )
      )
    );
  }

  warmUpLobbies(): Observable<any> {
    const dummyLobbyId = 'warmup-lobby';
    const dummyPlayer = 'warmup-player';
    const dummySlot = '1';
    const dummyToken = 'warmup-token';

    return forkJoin([
      this.joinLobby(dummyLobbyId, { playerName: dummyPlayer, slot: 1 }),
      this.cancelRole(dummyLobbyId, dummySlot),
      this.leaveLobby(dummyLobbyId, dummyPlayer),
      this.deleteLobby(dummyLobbyId, dummyToken),
      this.sendAction({ action: 'warmup' })
    ]);
  }

}
