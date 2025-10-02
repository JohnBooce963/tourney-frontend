import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { GameStatus } from '../model/gamestatus';
import { PlayerAction } from '../model/playerAction';
import { Router } from '@angular/router';
import { PopupService } from './popup.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private client: Client;
  private router = inject(Router)
  private popup = inject(PopupService);

  private connected$ = new BehaviorSubject<boolean>(false);
  
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
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 3000,
      // debug: (msg: string) => console.log(msg),
    });

    this.client.onConnect = () => {
      console.log('Connected to WebSocket!');
      console.log('XDDDDDDDDDDDDDDDDDDDDD')

      this.connected$.next(true);
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
    };

    this.client.onStompError = (frame) => {
      console.error('Broker error:', frame.headers['message'], frame.body);
    };

    this.client.activate();
  }

  // nextTurn() {
  //   this.client.publish({ destination: '/app/nextTurn', body: '' });
  // }

  subscribeToDrafting(lobbyId: string) {
    // this.endSubject.next(null);

    this.client.subscribe(`/topic/lobby/${lobbyId}`, (msg: IMessage) => {
      console.log(`📥 Lobby ${lobbyId} update:`, JSON.parse(msg.body));
    });

    this.client.subscribe(`/topic/lobby/${lobbyId}/theme`, (msg: IMessage) => {
      this.themeSubject.next(JSON.parse(msg.body));
    });

    this.client.subscribe(`/topic/lobby/${lobbyId}/status`, (msg: IMessage) => {
      this.statusSubject.next(JSON.parse(msg.body));
    });

    this.client.subscribe(`/topic/lobby/${lobbyId}/picked`, (msg: IMessage) => {
      this.pickedSubject.next(JSON.parse(msg.body));
    });

    this.client.subscribe(`/topic/lobby/${lobbyId}/selectedSquad`, (msg: IMessage) => {
      this.selectedSquadSubject.next(msg.body);
    });

    this.client.subscribe(`/topic/lobby/${lobbyId}/selectedOp`, (msg: IMessage) => {
      this.selectedOpSubject.next(msg.body);
    });

    this.client.subscribe(`/topic/lobby/${lobbyId}/bannedSquad`, (msg: IMessage) => {
      this.bannedsquadSubject.next(JSON.parse(msg.body));
    });

    this.client.subscribe(`/topic/lobby/${lobbyId}/bannedOps`, (msg: IMessage) => {
      this.bannedoperatorSubject.next(JSON.parse(msg.body));
    });

    this.endDraft(lobbyId);
  }

  sendConfirmedAction(lobbyId: string, action: PlayerAction) {
    this.client.publish({
      destination: `/app/lobby/${lobbyId}/confirmedAction`,
      body: JSON.stringify(action)
    });
  }

  startDraft(lobbyId: string){
    this.client.publish({
      destination: `/app/lobby/${lobbyId}/startDraft`,
      body: '' // no body needed, backend will generate result
    });
  }

  flipCoin(lobbyId: string){
    if (this.flippingSubject.value) return;

    this.flippingSubject.next(true); // mark as flipping

    this.client.publish({
      destination: `/app/lobby/${lobbyId}/flip`,
      body: '' // no body needed, backend will generate result
    });
  }

  sendPlayerAction(lobbyId: string, action: PlayerAction) {
    this.client.publish({
      destination: `/app/lobby/${lobbyId}/selectedAction`,
      body: JSON.stringify(action)
    });
  }

  getUpdate(lobbyId: string){
    this.client.publish({ 
      destination: `/app/lobby/${lobbyId}/joinSocket`, 
      body: '' 
    });
  }

  waitUntilConnected(): Promise<void> {
    return new Promise(resolve => {
      this.connected$.subscribe(connected => {
        if (connected) resolve();
      });
    });
  }

  subscribeToLobbies() {
    this.client.subscribe('/topic/lobby', (msg: IMessage) => {
      const updated = JSON.parse(msg.body);
      this.lobbiesSubject.next(updated);
    });
  }

  subscribeToCoinFlip(lobbyId :string){
    this.client.subscribe(`/topic/lobby/${lobbyId}/coin`, (msg) => {
      const coinFlipRes = JSON.parse(msg.body);
      console.log(coinFlipRes)
      this.coinFlipSubject.next(coinFlipRes)
      this.popup.coinFlipPopUp(lobbyId, coinFlipRes.result);

      setTimeout(() => this.flippingSubject.next(false), 3000);
    })
  }

  draftRoom(lobbyId :string){
    this.client.subscribe(`/topic/lobby/${lobbyId}/start`, (msg) => {
      console.log("Draft starting:", msg.body);
        this.router.navigateByUrl('/', { skipLocationChange: true}).then(() => {
          this.endSubject.next(null);
          this.router.navigate(['/draft', lobbyId]);
        });
    });
  }

  endDraft(lobbyId :string){
      this.client.subscribe(`/topic/lobby/${lobbyId}/end`, (msg) => {
      this.endSubject.next(JSON.parse(msg.body));
    });
  }

  subscribeToRoom(lobbyId: string){
    this.client.subscribe(`/topic/lobby/${lobbyId}`, (msg) => {
      const updatedLobby = JSON.parse(msg.body);
      this.roomSubject.next(updatedLobby)
      console.log("Lobby updated:", updatedLobby);
    });
  }

  signalToDelete(lobbyId: string){
    this.client.subscribe(`/topic/lobby/${lobbyId}/deleted`, (msg) => {
      const data = JSON.parse(msg.body);
      console.log("Lobby deleted:", data);
      this.deletedLobbySubject.next(data);
    });
  }

  unsubscribeFromRoom(lobbyId: string) {
    this.client.unsubscribe(`/topic/lobby/${lobbyId}`);
  }

  unsubscribeFromLobby(){
    this.client.unsubscribe('/topic/lobby')
  }

  unsubscribeFromDrafting(lobbyId: string){
    this.client.unsubscribe(`/topic/lobby/${lobbyId}/theme`);
    this.client.unsubscribe(`/topic/lobby/${lobbyId}/status`);
    this.client.unsubscribe(`/topic/lobby/${lobbyId}/picked`);
    this.client.unsubscribe(`/topic/lobby/${lobbyId}/bannedOps`);
    this.client.unsubscribe(`/topic/lobby/${lobbyId}/bannedSquad`);
    this.client.unsubscribe(`/topic/lobby/${lobbyId}/selectedSquad`);
    this.client.unsubscribe(`/topic/lobby/${lobbyId}/selectedOp`);
    this.client.unsubscribe(`/topic/lobby/${lobbyId}/end`);
  }
}