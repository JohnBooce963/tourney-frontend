import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { GameStatus } from '../model/gamestatus';
import { PlayerAction } from '../model/playerAction';
import { Router } from '@angular/router';
import { PopupService } from './popup.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private router = inject(Router)
  private popup = inject(PopupService);
  private ws: WebSocket | null = null;

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
    // const wsUrl = `${environment.apiUrl}/ws`;

    // this.client = new Client({
    //   webSocketFactory: () => new SockJS(wsUrl),
    //   reconnectDelay: 3000,
    //   debug: (msg: string) => console.log(msg),
    // });

    // this.client.onConnect = () => {
    //   console.log('Connected to WebSocket!');
    //   console.log('XDDDDDDDDDDDDDDDDDDDDD')

    //   this.connected$.next(true);
      // this.client.subscribe('/topic/status', (msg: IMessage) => {
      //   this.statusSubject.next(JSON.parse(msg.body));
      //   console.log("📥 Received broadcast from backend:", JSON.parse(msg.body));
      // });

      // this.client.subscribe('/topic/actions', (msg: IMessage) => {
      //   this.messagesSubject.next(JSON.parse(msg.body));
      //   console.log("📥 Received broadcast from backend:", JSON.parse(msg.body));
      // });

      // this.client.subscribe('/topic/picked', (msg: IMessage) => {
      //   const picked = JSON.parse(msg.body);
      //   this.pickedSubject.next(picked);

      // });

      // this.client.subscribe('/topic/selectedSquad', (msg: IMessage) => {
      //   const seletedSquad = msg.body;
      //   this.selectedSquadSubject.next(seletedSquad);

      // });

      // this.client.subscribe('/topic/selectedOp', (msg: IMessage) => {
      //   const selectedOp = msg.body;
      //   this.selectedOpSubject.next(selectedOp);

      // });

      // this.client.subscribe('/topic/bannedSquad', (msg: IMessage) => {
      //   const bannedSquad = JSON.parse(msg.body);
      //   this.bannedsquadSubject.next(bannedSquad);

        // console.log(this.bannedsquad$)
      // });

      // this.client.subscribe('/topic/bannedOps', (msg: IMessage) => {
      //   const bannedOps = JSON.parse(msg.body);
      //   this.bannedoperatorSubject.next(bannedOps);

      //   console.log(this.bannedoperator$)
      // });
    // };

    // this.client.onStompError = (frame) => {
    //   console.error('Broker error:', frame.headers['message'], frame.body);
    // };

    // this.client.activate();
  }

  connect() {
    const wsUrl = environment.wsUrl; // change to deployed URL if needed
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ Connected to WebSocket server');
      this.connectedSubject.next(true);
    };

    this.ws.onmessage = (event) => this.handleMessage(event);

    this.ws.onclose = () => {
      console.log('❌ Disconnected from WebSocket server');
      this.connectedSubject.next(false);
      setTimeout(() => this.connect(), 3000); // auto reconnect
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      this.ws?.close();
    };
  }
  

  private handleMessage(event: MessageEvent) {
    const msg = JSON.parse(event.data);
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
      default: console.warn('⚠️ Unknown WS message type:', type);
    }
  }

  // subscribeToDrafting(lobbyId: string) {
    // this.endSubject.next(null);

    // this.client.subscribe(`/topic/lobby/${lobbyId}`, (msg: IMessage) => {
    //   console.log(`📥 Lobby ${lobbyId} update:`, JSON.parse(msg.body));
    // });

    // this.client.subscribe(`/topic/lobby/${lobbyId}/theme`, (msg: IMessage) => {
    //   this.themeSubject.next(JSON.parse(msg.body));
    // });

    // this.client.subscribe(`/topic/lobby/${lobbyId}/status`, (msg: IMessage) => {
    //   this.statusSubject.next(JSON.parse(msg.body));
    // });

    // this.client.subscribe(`/topic/lobby/${lobbyId}/picked`, (msg: IMessage) => {
    //   this.pickedSubject.next(JSON.parse(msg.body));
    // });

    // this.client.subscribe(`/topic/lobby/${lobbyId}/selectedSquad`, (msg: IMessage) => {
    //   this.selectedSquadSubject.next(msg.body);
    // });

    // this.client.subscribe(`/topic/lobby/${lobbyId}/selectedOp`, (msg: IMessage) => {
    //   this.selectedOpSubject.next(msg.body);
    // });

    // this.client.subscribe(`/topic/lobby/${lobbyId}/bannedSquad`, (msg: IMessage) => {
    //   this.bannedsquadSubject.next(JSON.parse(msg.body));
    // });

    // this.client.subscribe(`/topic/lobby/${lobbyId}/bannedOps`, (msg: IMessage) => {
    //   this.bannedoperatorSubject.next(JSON.parse(msg.body));
    // });

    // this.endDraft(lobbyId);
  // }
  sendPlayerAction(lobbyId: string, action: PlayerAction) {
    this.ws?.send(JSON.stringify({ type: "playerAction", lobbyId, action }));
  }

  sendConfirmedAction(lobbyId: string, action: PlayerAction) {
    this.ws?.send(JSON.stringify({ type: "confirmedAction", lobbyId, action }));
  }

  startDraft(lobbyId: string) {
    this.ws?.send(JSON.stringify({ type: "startDraft", lobbyId }));
  }

  flipCoin(lobbyId: string) {
    if (this.flippingSubject.value) return;
    this.flippingSubject.next(true);
    this.ws?.send(JSON.stringify({ type: "flipCoin", lobbyId }));
  }

  getUpdate(lobbyId: string) {
    this.ws?.send(JSON.stringify({ type: "getUpdate", lobbyId }));
  }

  unsubscribeFromAll() {
    if (this.ws) {
      this.ws.onmessage = null;
    }
    console.log('🧹 Removed all WS listeners');
  }

  // async waitUntilConnected(): Promise<void> {
  //   return new Promise((resolve) => {
  //     const checkConnection = () => {
  //       if (this.client?.connected) {
  //         resolve();
  //       } else {
  //         setTimeout(checkConnection, 200);
  //       }
  //     };
  //     checkConnection();
  //   });
  // }

  // isConnected(): boolean {
  //   return this.client?.connected ?? false;
  // }

//   subscribeToLobbies() {
//     this.client.subscribe('/topic/lobby', (msg: IMessage) => {
//       const updated = JSON.parse(msg.body);
//       this.lobbiesSubject.next(updated);
//     });
//   }



//   subscribeToCoinFlip(lobbyId :string){
//     this.client.subscribe(`/topic/lobby/${lobbyId}/coin`, (msg) => {
//       const coinFlipRes = JSON.parse(msg.body);
//       console.log(coinFlipRes)
//       this.coinFlipSubject.next(coinFlipRes)
//       this.popup.coinFlipPopUp(lobbyId, coinFlipRes.result);

//       setTimeout(() => this.flippingSubject.next(false), 3000);
//     })
//   }

//   draftRoom(lobbyId :string){
//     this.client.subscribe(`/topic/lobby/${lobbyId}/start`, (msg) => {
//       console.log("Draft starting:", msg.body);
//         this.router.navigateByUrl('/', { skipLocationChange: true}).then(() => {
//           this.endSubject.next(null);
//           this.router.navigate(['/draft', lobbyId]);
//         });
//     });
//   }

//   endDraft(lobbyId :string){
//       this.client.subscribe(`/topic/lobby/${lobbyId}/end`, (msg) => {
//       this.endSubject.next(JSON.parse(msg.body));
//     });
//   }

//   subscribeToRoom(lobbyId: string){
//     this.client.subscribe(`/topic/lobby/${lobbyId}`, (msg) => {
//       const updatedLobby = JSON.parse(msg.body);
//       this.roomSubject.next(updatedLobby)
//       console.log("Lobby updated:", updatedLobby);
//     });
//   }

//   signalToDelete(lobbyId: string){
//     this.client.subscribe(`/topic/lobby/${lobbyId}/deleted`, (msg) => {
//       const data = JSON.parse(msg.body);
//       console.log("Lobby deleted:", data);
//       this.deletedLobbySubject.next(data);
//     });
//   }

//   unsubscribeFromRoom(lobbyId: string) {
//   if (this.client && this.client.connected) {
//     try {
//       this.client.unsubscribe(`/topic/lobby/${lobbyId}`);
//       console.log(`🧹 Unsubscribed from room ${lobbyId}`);
//     } catch (e) {
//       console.warn('Failed to unsubscribe from room:', e);
//     }
//   } else {
//     console.warn('No STOMP connection — skipping room unsubscribe');
//   }
// }

//   unsubscribeFromLobby() {
//     if (this.client && this.client.connected) {
//       try {
//         this.client.unsubscribe('/topic/lobby');
//         console.log('🧹 Unsubscribed from /topic/lobby');
//       } catch (e) {
//         console.warn('Failed to unsubscribe from lobby:', e);
//       }
//     } else {
//       console.warn('No STOMP connection — skipping lobby unsubscribe');
//     }
//   }

//   unsubscribeFromDrafting(lobbyId: string) {
//     if (this.client && this.client.connected) {
//       const topics = [
//         `/topic/lobby/${lobbyId}/theme`,
//         `/topic/lobby/${lobbyId}/status`,
//         `/topic/lobby/${lobbyId}/picked`,
//         `/topic/lobby/${lobbyId}/bannedOps`,
//         `/topic/lobby/${lobbyId}/bannedSquad`,
//         `/topic/lobby/${lobbyId}/selectedSquad`,
//         `/topic/lobby/${lobbyId}/selectedOp`,
//         `/topic/lobby/${lobbyId}/end`
//       ];

//       topics.forEach((topic) => {
//         try {
//           this.client.unsubscribe(topic);
//           console.log(`🧹 Unsubscribed from ${topic}`);
//         } catch (e) {
//           console.warn(`Failed to unsubscribe from ${topic}:`, e);
//         }
//       });
//     } else {
//       console.warn('No STOMP connection — skipping drafting unsubscribe');
//     }
//   }
}