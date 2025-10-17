import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router ,RouterModule,RouterOutlet, ActivatedRoute  } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { operator} from '../model/operator';
import { Squad } from '../model/squad';
import { CommonModule } from '@angular/common';
import { ChatboxComponent } from '../chatbox/chatbox.component';
import { HeaderTurnComponent } from '../header-turn/header-turn.component';
import { Observable, Subscription } from 'rxjs';
import { WebSocketService } from '../services/web-socket-service.service';
import { GameStatus } from '../model/gamestatus';
import { PlayerAction } from '../model/playerAction';
import { DraftItem } from '../model/draftItem';
import { LobbyResponse } from '../model/lobbyResponse';
import { PopupService } from '../services/popup.service';
import { environment } from '../environments/environment.development';
import { HttpServiceService } from '../services/http-service.service';
import { CacheService } from '../services/cache.service';

@Component({
  selector: 'app-draft',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatboxComponent, HeaderTurnComponent],
  templateUrl: './draft.component.html',
  styleUrl: './draft.component.scss'
})
export class DraftComponent implements OnInit, OnDestroy{


  constructor(
    public ws : WebSocketService, 
    private route: ActivatedRoute, 
    public popUp: PopupService, 
    public router: Router,
    public http: HttpServiceService,
    public cacheService: CacheService
  ){}

  private subs: Subscription[] = [];

  slots = [
        'Ban Squad 1','Ban Squad 2',
        'Ban 1','Ban 2','Ban 3','Ban 4','Ban 5','Ban 6',
        'Pick 1','Pick 2','Pick 3','Pick 4','Pick 5',
        'Pick 6','Pick 7','Pick 8','Pick 9','Pick 10'
      ];

  activeSlot: string | null = '';

  public operators: operator[] = [];
  public squads: Squad[] = [];
  public operator?: operator | null;
  public picked: string[] = [];
  public bannedSquad: string[] = ["", ""];
  public bannedOps: string[] = ["", "", "", "", "", ""];
  public chosenOperators: string[] = ["", "", "", "", "",
                                      "", "", "", "", ""];
  public gameState?: GameStatus | null;
  public playerAction?: PlayerAction | null;

  selectedTheme: number = 0;

  selectedOperator: any = null;
  selectedSquad: any = null;
  currentOp: string = ''
  currentSquad: string = ''

  lobbyId: string = "";
  lobby: LobbyResponse | null = null;
  playerSlot: number = 0;
  playerName: string = "";

  // public themes = [
  //   { value: 1, label: "Phantom & Crimson Solitaire" },
  //   { value: 2, label: "Mizuki & Caerula Arbor" },
  //   { value: 3, label: "Expeditioner's Jǫklumarkar" },
  //   { value: 4, label: "Sarkaz's Furnaceside Fables"}
  // ];

  searchText: string = '';

  async ngOnInit(){

    this.lobbyId = this.route.snapshot.paramMap.get('id')!;
    // await this.ws.waitUntilConnected();   // ⏳ wait here
    //this.ws.subscribeToDrafting(this.lobbyId);

    // this.playerSlot = Number(sessionStorage.getItem("playerSlot"))
    // this.playerName = sessionStorage.getItem("playerName") || "Guest";

    await this.ws.subscribeToDraft(this.lobbyId);

    // await this.ws.subscribeToStatus();
    // this.startDraft().subscribe({
    //   next: () => console.log("Draft started!"),
    //   error: (err) => console.error("Failed to start draft", err)
    // });
    this.loadDraftRoom()

    this.fetchOperators();
    this.loadSquad();

    this.playerName = sessionStorage.getItem("playerName") ?? '';
    this.playerSlot = Number(sessionStorage.getItem("playerSlot")) ?? 0;

    console.log(this.playerSlot, this.playerName)

    // if(this.operators.length > 0 && this.squads.length > 0){


    // }

   this.subs.push(
      this.ws.status$.subscribe(status => {
        this.gameState = status;
        this.activeSlot = status.currentSlot;
      }),

      // this.ws.theme$.subscribe(theme => {
      //     this.fetchSquad(theme)
      // }),

      this.ws.messages$.subscribe(state => this.playerAction = state),
      this.ws.picked$.subscribe(picked => this.picked = picked),
      this.ws.bannedoperator$.subscribe(banOps => this.bannedOps = banOps),
      this.ws.bannedsquad$.subscribe(banSquad => this.bannedSquad = banSquad),
      this.ws.selectedOp$.subscribe(currentOp => this.currentOp = currentOp),
      this.ws.selectedSquad$.subscribe(currentSquad => this.currentSquad = currentSquad)
    )

  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
    this.ws.unSubscribeToDraft(this.lobbyId);
    //this.ws.unsubscribeFromDrafting(this.lobbyId); // 👈 optional helper
  }

  // startDraft(){
  //   this.http.post<void>(`${environment.apiUrl}/api/action`, { type: "startDraft", action: ""}).subscribe((res) => {
  //     console.log("Game Start!")
  //   });
  // }

  fetchOperators(): void {
    this.http.fetchOperators()
      .subscribe({
        next: (data) => {
          this.operators = data;
          console.log('Operators:', this.operators);
        },
        error: (err) => {
          console.error('Error fetching operators', err);
        }
      });
  }

  loadDraftRoom(){
    // this.http.get<LobbyResponse>(`${environment.apiUrl}/api/lobby/${this.lobbyId}`).subscribe({ 
    //   next: (res) => {
    //   console.log("Draft Room: " ,res)
    //   this.lobby = res
    //   this.http.get<Squad[]>(`${environment.apiUrl}/api/db/squad/${res.theme}`).subscribe({
    //     next: (data) => {
    //       this.squads = data;
    //       console.log('Squad:', this.squads);
    //     },
    //     error: (err) => {
    //       console.error('Error fetching operators', err);
    //     }
    //   });
    // },
    //   error: (err) => {
    //     console.error("Failed to get Draft Room")
    //   }
    // })
  }

  // fetchOperator(name: string): void {
  //   this.http.get<operator>(`${environment.apiUrl}/${name}`).subscribe(op => {
  //     this.operator = op;
  //     console.log("Operator: " ,this.operator)
  //   });

  // }

  // fetchSquad(theme: number): void {
  //   this.http.fetchSquad(theme)
  //   .subscribe({
  //       next: (data) => {
  //         this.squads = data;
  //         console.log('Squads:', this.squads);
  //       },
  //       error: (err) => {
  //         console.error('Error fetching operators', err);
  //       }
  //     });
  // }

  filteredOperators(): operator[] {
  return this.operators.filter(op =>
    op.char_alt_name.toLowerCase().includes(this.searchText.toLowerCase()) || op.char_name.toLowerCase().includes(this.searchText.toLowerCase())
  );
  }

  // loadOperatorFromCache() {
  //   const cachedOps = this.cacheService.getOperators();
  //   if (cachedOps) {
  //     this.operators = cachedOps;
  //     console.log('Loaded operators from cache:', this.operators);
  //   }
  // }

  loadSquad() {
    this.http.loadLobbyWithCache(this.lobbyId).subscribe({
      next: ({ lobby, squads }) => {
        this.lobby = lobby;
        this.squads = squads;
        console.log('Lobby & squads loaded', lobby, squads);
      },
      error: err => this.popUp.errorPopUp('Error loading lobby: ' + err)
    });
  }


  isActive(slot: string): boolean {
    return this.activeSlot === slot
  }

  onChoose() {
    if (!this.gameState?.currentPlayer || !this.gameState?.phase) return;

    console.log(this.gameState)

    if (this.gameState?.currentPlayer === `Player ${this.playerSlot + 1}`) {
      if(this.selectedOperator){
        const action: PlayerAction = {
          player: this.gameState?.currentPlayer ?? '',
          type: this.gameState?.phase ?? '',
          character: this.selectedOperator.char_alt_name,
          squad: ''
        };
        this.ws.sendConfirmedAction(this.lobbyId, action);
        // this.ws.sendConfirmedAction(action) 
      }else if(this.selectedSquad){
        const action: PlayerAction = {
          player: this.gameState?.currentPlayer ?? '',
          type: this.gameState?.phase ?? '',
          character: '',
          squad: this.selectedSquad.squad_name
        };
        this.ws.sendConfirmedAction(this.lobbyId, action);
        // this.ws.sendConfirmedAction( action);
      }
    }

    this.selectedOperator = null;
    this.selectedSquad = null;
  }

  chooseSquad(squad: Squad){
    
    if(this.gameState?.phase === 'BAN' || this.gameState?.phase === 'PICK'){
      this.popUp.alertPopUp("This is Ban/Pick phase. Please Select Operator to be Banned/Picked!")
    }else 
      if(this.gameState?.currentPlayer === `Player ${this.playerSlot + 1}`)
    {
      this.selectedSquad = squad;
      this.selectedOperator = null;

      const action: PlayerAction = {
        player: this.gameState?.currentPlayer ?? '',
        type: this.gameState?.phase ?? '',
        character: '',
        squad: squad.squad_name
      };

      this.ws.sendPlayerAction(this.lobbyId, action);
    }
  }

  chooseOperator(operator: operator) {
    if(this.gameState?.phase === 'BAN SQUAD'){
      this.popUp.alertPopUp("This is Ban Squad phase. Please Select Squad to be Banned!")
    }else 
    if(this.gameState?.currentPlayer === `Player ${this.playerSlot + 1}`)
    {
      this.selectedOperator = operator;
      this.selectedSquad = null;

      const action: PlayerAction = {
        player: this.gameState?.currentPlayer ?? '',
        type: this.gameState?.phase ?? '',
        character: operator.char_alt_name,
        squad: ''
      };
      this.ws.sendPlayerAction(this.lobbyId, action);
    }
  }

  getPlaceHolderContent(content: string): DraftItem | null{
    const temp = content.split(" ");
    
    const lastElement = temp[temp.length - 1];

    if(lastElement === "Squad"){
      const squad = this.squads.find(s => s.squad_name === content);
      return squad ? { img: squad.squad_img, name: squad.squad_name } : null;
    }else{
      const op = this.operators.find(o => o.char_alt_name === content);
      return op ? { img: op.char_img, name: op.char_alt_name } : null;
    }

  }

  getSlotContent(slot: string): DraftItem | null {
    if (slot.startsWith('Ban Squad')) {
      const index = parseInt(slot.replace('Ban Squad ', ''), 10) - 1;
      const squadName = this.bannedSquad[index];
      const squad = this.squads.find(s => s.squad_name === squadName);
      return squad ? { img: squad.squad_img, name: squad.squad_name } : null;
    }

    if (slot.startsWith('Ban ')) {
      const index = parseInt(slot.replace('Ban ', ''), 10) - 1;
      const opName = this.bannedOps[index];
      const op = this.operators.find(o => o.char_alt_name === opName);
      return op ? { img: op.char_img, name: op.char_alt_name } : null;
    }

    if (slot.startsWith('Pick ')) {
      const index = parseInt(slot.replace('Pick ', ''), 10) - 1;
      const opName = this.picked[index];
      const op = this.operators.find(o => o.char_alt_name === opName);
      return op ? { img: op.char_img, name: op.char_alt_name } : null;
    }

    return null;
  }

  onDraftEnd() {
    sessionStorage.clear();
    this.router.navigateByUrl('/', { skipLocationChange: true}).then(() => {
      this.router.navigate(['/lobby']);
    });
  }
}
