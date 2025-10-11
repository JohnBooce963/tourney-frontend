import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GameStatus } from '../model/gamestatus';
import { PlayerAction } from '../model/playerAction';
import { Router } from '@angular/router';
import { PopupService } from './popup.service';
import { environment } from '../environments/environment';
import * as Ably from 'ably';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private router = inject(Router);
  private popup = inject(PopupService);

  private client = new Ably.Realtime({ key: environment.ablyWsKey });
  private lobbyChannels = new Map<string, Ably.RealtimeChannel>();

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

  async connect() {
    this.client.connection.on('connected', () => {
      console.log('✅ Connected to Ably Realtime');
      this.connectedSubject.next(true);
    });

    this.client.connection.on('disconnected', () => {
      console.warn('⚠️ Disconnected from Ably');
      this.connectedSubject.next(false);
    });
  }
  

  private handleMessage(type: string, lobbyId: string, data: any) {
    switch (type) {
      case 'lobbies':
        this.lobbiesSubject.next(data);
        break;
      case 'status':
        this.statusSubject.next(data);
        break;
      case 'picked':
        this.pickedSubject.next(data);
        break;
      case 'bannedOps':
        this.bannedoperatorSubject.next(data);
        break;
      case 'bannedSquad':
        this.bannedsquadSubject.next(data);
        break;
      case 'selectedOp':
        this.selectedOpSubject.next(data);
        break;
      case 'selectedSquad':
        this.selectedSquadSubject.next(data);
        break;
      case 'end':
        this.endSubject.next(data);
        break;
      case 'coinFlip':
        this.coinFlipSubject.next(data);
        this.popup.coinFlipPopUp(lobbyId, data.result);
        setTimeout(() => this.flippingSubject.next(false), 3000);
        break;
      case 'draftStart':
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.endSubject.next(null);
          this.router.navigate(['/draft', lobbyId]);
        });
        break;
      case 'lobbyUpdate':
      case 'join':
      case 'cancel':
        this.roomSubject.next(data);
        break;
      case 'lobbyDeleted':
        this.deletedLobbySubject.next(data);
        break;
      default:
        console.warn('⚠️ Unknown Ably message type:', type);
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


  // isConnected(): boolean {
  //   return this.client?.connected ?? false;
  // }

  subscribeToLobbies() {
    const lobbiesChannel = this.client.channels.get('lobbies');
    lobbiesChannel.subscribe('lobbies', (msg) => {
      console.log('📡 Lobbies update:', msg.data);
      this.lobbiesSubject.next(msg.data);
    });
  }

  subscribeToRoom(lobbyId: string) {
    const channel = this.client.channels.get(`lobby-${lobbyId}`);
    channel.subscribe("lobbyUpdate", (msg) => {
      this.roomSubject.next(msg.data);
    });
  }

}