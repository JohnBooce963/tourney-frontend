import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameStatus } from '../model/gamestatus';
import { PlayerAction } from '../model/playerAction';
import { Router } from '@angular/router';
import { PopupService } from './popup.service';
import { environment } from '../environments/environment';
import * as Ably from 'ably';
import { LobbyResponse } from '../model/lobbyResponse';
import { HttpClient } from '@angular/common/http';
import { HttpServiceService } from './http-service.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private router = inject(Router);
  private popup = inject(PopupService);
  private http = inject(HttpServiceService);

  private client: Ably.Realtime

  private connectedSubject = new BehaviorSubject<boolean>(false);
  connected$ = this.connectedSubject.asObservable();

  private activeRoomCallbacks: Map<string, { 
    lobbyCallback: (msg: any) => void; 
    coinFlipCallback: (msg: any) => void;
    startCallback: (msg: any) => void; 
  }> = new Map();
  private activeDraftCallbacks: Map<string, {
    selectOpCallback: (msg: any) => void; 
    selectSquadCallback: (msg: any) => void;  
    statusCallback: (msg: any) => void; 
    themeCallback: (msg: any) => void;
    bannedOpCallback: (msg: any) => void; 
    bannedSquadCallback: (msg: any) => void;  
    pickedCallback: (msg: any) => void; 
    endCallback: (msg: any) => void;  
  }> = new Map();
  
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

  sendPlayerAction(lobbyId:string, action: PlayerAction) {
    this.http.sendAction({ type: "playerAction", lobbyId, action }).subscribe({
      next: () => {
        console.log('✅ playerAction sent')
      
      },
      error: (err) => console.error('❌ playerAction failed', err),
    });
  }

  sendConfirmedAction(lobbyId:string, action: PlayerAction) {
    this.http.sendAction({ type: "confirmedAction", lobbyId, action }).subscribe({
      next: () => console.log('✅ confirmedAction sent'),
      error: (err) => console.error('❌ confirmedAction failed', err),
    });
  }

  startDraft(lobbyId: string) {
    this.http.sendAction({ type: "startDraft", lobbyId }).subscribe({
      next: () => console.log('✅ Gamerequest sent'),
      error: (err) => console.error('❌ Gamerequest failed', err),
    });
  }

  getUpdate(lobbyId: string) {
    this.http.sendAction({ type: "getUpdate", lobbyId });
  }

  async subscribeToLobbies() {
    const lobbies = this.client.channels.get('lobbies');
    lobbies.subscribe('lobbies', (msg) => {
      console.log('Lobbies update:', msg.data);
      this.lobbiesSubject.next(msg.data);
    });
  }

  async subscribeToDraft(lobbyId: string){
    this.unSubscribeToDraft(lobbyId);

    const draft = this.client.channels.get(`draft-${lobbyId}-update`);

    const selectOpCallback = (msg:any) => {
      console.log(`room-selectOp:`, msg.data);
      this.selectedOpSubject.next(msg.data);
    }
    const selectSquadCallback = (msg:any) =>{
      console.log(`room-selectSquad:`, msg.data);
      this.selectedSquadSubject.next(msg.data);
    }
    const statusCallback = (msg:any) => {
      console.log(`room-status update:`, msg.data);
      this.statusSubject.next(msg.data);
    }
    const themeCallback = (msg:any) =>{
      console.log(`room-theme:`, msg.data);
      this.themeSubject.next(msg.data);
    }
    const bannedOpCallback = (msg:any) => {
      console.log(`room-bannedOps:`, msg.data);
      this.bannedoperatorSubject.next(msg.data);
    }
    const bannedSquadCallback = (msg:any) =>{
      console.log(`room-bannedSquad:`, msg.data);
      this.bannedsquadSubject.next(msg.data);
    }
    const pickedCallback = (msg:any) => {
      console.log(`room-picked:`, msg.data);
      this.pickedSubject.next(msg.data);
    }
    const endCallback = (msg:any) =>{
      console.log(`room-end:`, msg.data);
      this.endSubject.next(msg.data);
    }

    // await draft.subscribe("status", (msg:any) => {
    //   console.log(`room-status update:`, msg.data);
    //   this.statusSubject.next(msg.data); // push to BehaviorSubject
    // })

    // await draft.subscribe("theme", (msg:any) => {
    //   console.log(`room-theme:`, msg.data);
    //   this.themeSubject.next(msg.data);
    // })
    // await draft.subscribe("selectOp", (msg:any) => {
    //   console.log(`room-selectOp:`, msg.data);
    //   this.selectedOpSubject.next(msg.data);
    // })
    // await draft.subscribe("selectSquad", (msg:any) => {
    //   console.log(`room-selectSquad:`, msg.data);
    //   this.selectedSquadSubject.next(msg.data);
    // })
    // await draft.subscribe("bannedSquad", (msg:any) => {
    //   console.log(`room-bannedSquad:`, msg.data);
    //   this.bannedsquadSubject.next(msg.data);
    // })
    // await draft.subscribe("bannedOps", (msg:any) => {
    //   console.log(`room-bannedOps:`, msg.data);
    //   this.bannedoperatorSubject.next(msg.data);
    // })
    // await draft.subscribe("picked", (msg:any) => {
    //   console.log(`room-picked:`, msg.data);
    //   this.pickedSubject.next(msg.data);
    // })

    // await draft.subscribe("end", (msg:any) => {
    //   console.log(`room-end:`, msg.data);
    //   this.endSubject.next(msg.data);
    // })

    draft.subscribe("selectOp", selectOpCallback);
    draft.subscribe("selectSquad", selectSquadCallback);
    draft.subscribe("status", statusCallback);
    draft.subscribe("theme", themeCallback);
    draft.subscribe("bannedOps", bannedOpCallback);
    draft.subscribe("bannedSquad", bannedSquadCallback);
    draft.subscribe("picked", pickedCallback);
    draft.subscribe("end", endCallback);

    this.activeDraftCallbacks.set(lobbyId, {
      selectOpCallback,
      selectSquadCallback,
      statusCallback,
      themeCallback,
      bannedOpCallback,
      bannedSquadCallback,
      pickedCallback,
      endCallback
    })

  }

//   async subscribeToStatus() {
//   // Remove old subscription if exists
//     const channel = this.client.channels.get(`room-status`);

//     // Subscribe to the "status" event
//     channel.subscribe('status', (msg: any) => {
//       console.log(`room-status update:`, msg.data);
//       this.statusSubject.next(msg.data); // push to BehaviorSubject
//     });
// }

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

    const startCallback = (msg: any) => {
      console.log(`🚀 Game start signal received for lobby ${lobbyId}`);
      // optional: trigger game start logic here
      this.popup.successPopUp("Game is starting!");
      this.router.navigate(['/draft', lobbyId]); // example route
    };
      room.subscribe("lobbyUpdate", lobbyCallback);
      room.subscribe("coinFlip", coinFlipCallback);
      room.subscribe("start", startCallback);

      this.activeRoomCallbacks.set(lobbyId, {
        lobbyCallback,
        coinFlipCallback,
        startCallback
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
      if (callbacks.startCallback)
        room.unsubscribe("start", callbacks.startCallback);

      this.activeRoomCallbacks.delete(lobbyId);
    }
  }

  unSubscribeToDraft(lobbyId: string){
    const draft = this.client.channels.get(`draft-${lobbyId}-update`);
    const callbacks = this.activeDraftCallbacks.get(lobbyId);

    draft.unsubscribe("")
    if (callbacks) {
      if (callbacks.selectOpCallback)
        draft.unsubscribe("selectOp", callbacks.selectOpCallback);
      if (callbacks.selectSquadCallback)
        draft.unsubscribe("selectSquad", callbacks.selectSquadCallback);
      if (callbacks.statusCallback)
        draft.unsubscribe("status", callbacks.statusCallback);
      if (callbacks.themeCallback)
        draft.unsubscribe("theme", callbacks.themeCallback);
      if (callbacks.bannedOpCallback)
        draft.unsubscribe("bannedOps", callbacks.bannedOpCallback);
      if (callbacks.bannedSquadCallback)
        draft.unsubscribe("bannedSquad", callbacks.bannedSquadCallback);
      if (callbacks.pickedCallback)
        draft.unsubscribe("picked", callbacks.pickedCallback);
      if (callbacks.endCallback)
        draft.unsubscribe("end", callbacks.endCallback);

      this.activeDraftCallbacks.delete(lobbyId);
    }
  }

}