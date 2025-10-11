import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GameStatus } from '../model/gamestatus';
import { PlayerAction } from '../model/playerAction';
import { Router } from '@angular/router';
import { PopupService } from './popup.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private router = inject(Router);
  private popup = inject(PopupService);

  private evtSource: EventSource | null = null;
  private roomEvtSource: EventSource | null = null;

  private connectedSubject = new BehaviorSubject<boolean>(false);
  connected$ = this.connectedSubject.asObservable();
  
  private statusSubject = new BehaviorSubject<GameStatus>({
    currentPlayer: 'Player 1', phase: 'BAN SQUAD', secondsLeft: 0, currentSlot: 'Ban Squad 1'
  });
  status$ = this.statusSubject.asObservable();

  private themeSubject = new BehaviorSubject<any>(null);
  theme$ = this.themeSubject.asObservable();

  private messagesSubject = new BehaviorSubject<any>(null);
  messages$ = this.messagesSubject.asObservable();

  private selectedOpSubject = new BehaviorSubject<string>("");
  selectedOp$ = this.selectedOpSubject.asObservable();

  private selectedSquadSubject = new BehaviorSubject<string>("");
  selectedSquad$ = this.selectedSquadSubject.asObservable();

  private pickedSubject = new BehaviorSubject<string[]>([]);
  picked$ = this.pickedSubject.asObservable();

  private bannedsquadSubject = new BehaviorSubject<string[]>([]);
  bannedsquad$ = this.bannedsquadSubject.asObservable();
  
  private bannedoperatorSubject = new BehaviorSubject<string[]>([]);
  bannedoperator$ = this.bannedoperatorSubject.asObservable();

  private lobbiesSubject = new BehaviorSubject<any[]>([]);
  lobbies$ = this.lobbiesSubject.asObservable();

  private roomSubject = new BehaviorSubject<any>([]);
  room$ = this.roomSubject.asObservable();

  private endSubject = new BehaviorSubject<{ message: string, secondsLeft: number } | null>(null);
  end$ = this.endSubject.asObservable();
  
  private deletedLobbySubject = new BehaviorSubject<any>(null);
  deletedLobby$ = this.deletedLobbySubject.asObservable();

  private coinFlipSubject = new BehaviorSubject<any>(null);
  coinFlipLobby$ = this.coinFlipSubject.asObservable();

  private flippingSubject = new BehaviorSubject<boolean>(false);
  flipping$ = this.flippingSubject.asObservable();

  constructor() {
    this.connect();
  }

  connect() {
    if (this.evtSource) return;

    const url = `${environment.apiUrl}/api/sse`;
    this.evtSource = new EventSource(url);

    this.evtSource.onopen = () => {
      console.log('✅ Connected to SSE server');
      this.connectedSubject.next(true);
    };

    this.evtSource.onmessage = (event) => this.handleMessage(event);

    this.evtSource.onerror = (err) => {
      console.error('SSE error:', err);
      this.connectedSubject.next(false);
      this.evtSource?.close();
      setTimeout(() => this.connect(), 3000); // auto reconnect
    };
  }
  

  private handleMessage(event: MessageEvent) {
    const msg = JSON.parse(event.data);
    console.log(msg)
    const { type, lobbyId, data } = msg;

    switch (type) {
      case "lobbies": this.lobbiesSubject.next(data); break;
      case "status": this.statusSubject.next(data); break;
      case "picked": this.pickedSubject.next(data); break;
      case "bannedOps": this.bannedoperatorSubject.next(data); break;
      case "bannedSquad": this.bannedsquadSubject.next(data); break;
      case "selectedOp": this.selectedOpSubject.next(data); break;
      case "selectedSquad": this.selectedSquadSubject.next(data); break;
      case "end": this.endSubject.next(data); break;
      case "coinFlip":
        this.coinFlipSubject.next(data);
        this.popup.coinFlipPopUp(lobbyId, data.result);
        setTimeout(() => this.flippingSubject.next(false), 3000);
        break;
      case "draftStart":
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.endSubject.next(null);
          this.router.navigate(['/draft', lobbyId]);
        });
        break;
      case "lobbyUpdate": this.roomSubject.next(data); break;
      case "lobbyDeleted": this.deletedLobbySubject.next(data); break;
      case "join": this.roomSubject.next(data); break;
      case "cancel": this.roomSubject.next(data); break;
      default: console.warn('⚠️ Unknown SSE message type:', type);
    }
  }

  private sendAction(payload: any) {
    return fetch(`${environment.apiUrl}/api/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  sendPlayerAction(lobbyId: string, action: PlayerAction) {
    this.sendAction({ type: "playerAction", lobbyId, action });
  }

  sendConfirmedAction(lobbyId: string, action: PlayerAction) {
    this.sendAction({ type: "confirmedAction", lobbyId, action });
  }

  startDraft(lobbyId: string) {
    this.sendAction({ type: "startDraft", lobbyId });
  }

  flipCoin(lobbyId: string) {
    if (this.flippingSubject.value) return;
    this.flippingSubject.next(true);
    this.sendAction({ type: "flipCoin", lobbyId });
  }

  getUpdate(lobbyId: string) {
    this.sendAction({ type: "getUpdate", lobbyId });
  }

  unsubscribeFromAll() {
    this.evtSource?.close();
    console.log('🧹 Removed all SSE listeners');
  }

  async waitUntilConnected(): Promise<void> {
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.evtSource?.onopen) {
          resolve();
        } else {
          setTimeout(checkConnection, 200);
        }
      };
      checkConnection();
    });
  }

  // isConnected(): boolean {
  //   return this.client?.connected ?? false;
  // }

  subscribeToLobbies() {
    this.evtSource?.close();

    this.evtSource = new EventSource(`${environment.apiUrl}/api/sse`);
    this.evtSource.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'lobbies') this.lobbiesSubject.next(msg.data);
    };
  }

  subscribeToRoom(lobbyId: string){
    if (this.roomEvtSource) {
      this.roomEvtSource.close();
    }

    const url = `${environment.apiUrl}/api/sse?lobbyId=${lobbyId}`;
    this.roomEvtSource = new EventSource(url);

    this.roomEvtSource.onopen = () => {
      console.log(`✅ Connected to lobby room ${lobbyId}`);
      this.connectedSubject.next(true);
    };

    this.roomEvtSource.onmessage = (event) => this.handleMessage(event);

    this.roomEvtSource.onerror = (err) => {
      console.error(`❌ SSE error (room ${lobbyId}):`, err);
      this.connectedSubject.next(false);
      this.roomEvtSource?.close();
      this.router.navigate(['/lobby'])
      // setTimeout(() => this.subscribeToRoom(lobbyId), 3000); // auto reconnect
    };
  }

}