import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GameStatus } from '../model/gamestatus';
import { PlayerAction } from '../model/playerAction';
import { Router } from '@angular/router';
import { PopupService } from './popup.service';
import { environment } from '../environments/environment';
import * as Ably from 'ably';
import { LobbyResponse } from '../model/lobbyResponse';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private router = inject(Router);
  private popup = inject(PopupService);

  private client: Ably.Realtime

  private connectedSubject = new BehaviorSubject<boolean>(false);
  connected$ = this.connectedSubject.asObservable();

  private activeRoomCallbacks: Map<string, { lobbyCallback: (msg: any) => void; coinFlipCallback: (msg: any) => void }> = new Map();

  
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

  private lobbiesSubject = new BehaviorSubject<LobbyResponse[]>([]);
  lobbies$ = this.lobbiesSubject.asObservable();

  private roomSubject = new BehaviorSubject<LobbyResponse>({
      id: '',
      name: '',
      theme: 0,
      players: {
        0: '',
        1: '' // ✅ allows lobby.players[0], lobby.players[1]
      },
      ownerToken: ''
  });
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
    this.client = new Ably.Realtime({
      key: '4PXB0g.W0QHPw:XfNx7O8M7NKk_ey2jj_CS3ZIhWbg1-s5e8hnF-rnLkQ',
      clientId: 'frontend-id'
    })

     this.client.connection.on('connected', () => {
      console.log('✅ Connected to Ably Realtime');
      this.connectedSubject.next(true);
    });

    this.client.connection.on('disconnected', () => {
      console.warn('⚠️ Disconnected from Ably');
      this.connectedSubject.next(false);
    });
  }

  async waitUntilConnected(): Promise<void> {
    if (this.client.connection.state === 'connected') {
      return; // already connected
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Ably connection timeout'));
      }, 5000); // optional 5s timeout

      const handleConnect = () => {
        clearTimeout(timeout);
        console.log('✅ waitUntilConnected: Ably connected');
        this.client.connection.off('connected', handleConnect);
        resolve();
      };

      const handleFailed = (err: any) => {
        clearTimeout(timeout);
        console.error('❌ Ably failed to connect:', err);
        this.client.connection.off('failed', handleFailed);
        reject(err);
      };

      this.client.connection.once('connected', handleConnect);
      this.client.connection.once('failed', handleFailed);
    });
  }
  

  // private handleMessage(type: string, lobbyId: string, data: any) {
  //   switch (type) {
  //     case 'lobbies':
  //       this.lobbiesSubject.next(data);
  //       break;
  //     case 'status':
  //       this.statusSubject.next(data);
  //       break;
  //     case 'picked':
  //       this.pickedSubject.next(data);
  //       break;
  //     case 'bannedOps':
  //       this.bannedoperatorSubject.next(data);
  //       break;
  //     case 'bannedSquad':
  //       this.bannedsquadSubject.next(data);
  //       break;
  //     case 'selectedOp':
  //       this.selectedOpSubject.next(data);
  //       break;
  //     case 'selectedSquad':
  //       this.selectedSquadSubject.next(data);
  //       break;
  //     case 'end':
  //       this.endSubject.next(data);
  //       break;
  //     case 'coinFlip':
  //       this.coinFlipSubject.next(data);
  //       this.popup.coinFlipPopUp(lobbyId, data.result);
  //       setTimeout(() => this.flippingSubject.next(false), 3000);
  //       break;
  //     case 'draftStart':
  //       this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
  //         this.endSubject.next(null);
  //         this.router.navigate(['/draft', lobbyId]);
  //       });
  //       break;
  //     case 'lobbyUpdate':
  //     case 'join':
  //     case 'cancel':
  //       this.roomSubject.next(data);
  //       break;
  //     case 'lobbyDeleted':
  //       this.deletedLobbySubject.next(data);
  //       break;
  //     default:
  //       console.warn('⚠️ Unknown Ably message type:', type);
  //   }
  // }

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

  getUpdate(lobbyId: string) {
    this.sendAction({ type: "getUpdate", lobbyId });
  }


  // isConnected(): boolean {
  //   return this.client?.connected ?? false;
  // }

  async subscribeToLobbies() {
    const lobbies = this.client.channels.get('lobbies');
    lobbies.subscribe('lobbies', (msg) => {
      console.log('Lobbies update:', msg.data);
      this.lobbiesSubject.next(msg.data);
    });
  }

  async subscribeToRoom(lobbyId: string) {
    this.unSubscribeToRoom(lobbyId); // remove old callbacks first

    const room = this.client.channels.get(`lobby-${lobbyId}`);
    const lobbyCallback = (msg: any) => {
        console.log(`lobby-${lobbyId} update:`, msg.data);
        this.roomSubject.next(msg.data);
      };

    const coinFlipCallback = (msg: any) => {
      console.log(`lobby-${lobbyId} coin flip:`, msg.data);
      this.coinFlipSubject.next(msg.data);
    };
      room.subscribe("lobbyUpdate", lobbyCallback);
      room.subscribe("coinFlip", coinFlipCallback);

      this.activeRoomCallbacks.set(lobbyId, {
        lobbyCallback,
        coinFlipCallback
      });
  }

  // async subscribeToDelete(){
  //   const deleteSignal = this.client.channels.get('lobbyDelete');
  //   deleteSignal.subscribe("lobbyDelete", (msg) => {
  //     console.log('lobbyDelete: ', msg.data)
  //     this.deletedLobbySubject.next(msg.data);
  //     this.router.navigate(['/lobby'])
  //   })
  // }

  unSubscribeToRoom(lobbyId: string){
    const room = this.client.channels.get(`lobby-${lobbyId}`);
    const callbacks = this.activeRoomCallbacks.get(lobbyId);

    if (callbacks) {
      if (callbacks.lobbyCallback)
        room.unsubscribe("lobbyUpdate", callbacks.lobbyCallback);
      if (callbacks.coinFlipCallback)
        room.unsubscribe("coinFlip", callbacks.coinFlipCallback);

      this.activeRoomCallbacks.delete(lobbyId);
    }
  }

}