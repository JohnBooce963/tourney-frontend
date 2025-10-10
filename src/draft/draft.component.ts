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

@Component({
  selector: 'app-draft',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatboxComponent, HeaderTurnComponent],
  templateUrl: './draft.component.html',
  styleUrl: './draft.component.scss'
})
export class DraftComponent implements OnInit, OnDestroy{


  constructor(public ws : WebSocketService, private route: ActivatedRoute, public popUp: PopupService){}

  private router = inject(Router);
  private subs: Subscription[] = [];

  slots = [
        'Ban Squad 1','Ban Squad 2',
        'Ban 1','Ban 2','Ban 3','Ban 4','Ban 5','Ban 6',
        'Pick 1','Pick 2','Pick 3','Pick 4','Pick 5',
        'Pick 6','Pick 7','Pick 8','Pick 9','Pick 10'
      ];

  activeSlot: string | null = '';

  

  private http = inject(HttpClient);

  private url = "http://localhost:8080";

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

    this.playerSlot = Number(sessionStorage.getItem("playerSlot"))
    this.playerName = sessionStorage.getItem("playerName") || "Guest";

    console.log(this.playerSlot, this.playerName)
    // this.startDraft().subscribe({
    //   next: () => console.log("Draft started!"),
    //   error: (err) => console.error("Failed to start draft", err)
    // });
    this.fetchOperators();

   this.subs.push(
      //this.ws.status$.subscribe(status => {
      //   this.gameState = status;
      //   this.activeSlot = status.currentSlot;
      // }),

      //this.ws.theme$.subscribe(theme => {
      //     this.fetchSquad(theme)
      // }),

      //this.ws.messages$.subscribe(state => this.playerAction = state),
      //this.ws.picked$.subscribe(picked => this.picked = picked),
      //this.ws.bannedoperator$.subscribe(banOps => this.bannedOps = banOps),
      //this.ws.bannedsquad$.subscribe(banSquad => this.bannedSquad = banSquad),
      //this.ws.selectedOp$.subscribe(currentOp => this.currentOp = currentOp),
      //this.ws.selectedSquad$.subscribe(currentSquad => this.currentSquad = currentSquad)
    )

  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
    //this.ws.unsubscribeFromDrafting(this.lobbyId); // 👈 optional helper
  }

  startDraft(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/start`, {});
  }

  fetchOperators(): void {
    this.http.get<operator[]>(`${environment.apiUrl}/Operator`)
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

  fetchOperator(name: string): void {
    this.http.get<operator>(`${environment.apiUrl}/${name}`).subscribe(op => {
      this.operator = op;
      console.log("Operator: " ,this.operator)
    });

  }

  fetchSquad(theme: number): void {
    this.http.get<Squad[]>(`${environment.apiUrl}/Squad/${theme}`)
    .subscribe({
        next: (data) => {
          this.squads = data;
          console.log('Squads:', this.squads);
        },
        error: (err) => {
          console.error('Error fetching operators', err);
        }
      });

  }

  filteredOperators(): operator[] {
  return this.operators.filter(op =>
    op.char_alt_name.toLowerCase().includes(this.searchText.toLowerCase()) || op.char_name.toLowerCase().includes(this.searchText.toLowerCase())
  );
  }

  isActive(slot: string): boolean {
    return this.activeSlot === slot
  }

  onChoose() {
    if (!this.gameState?.currentPlayer || !this.gameState?.phase) return;

    console.log(this.gameState)

    if (this.gameState?.currentPlayer === `Player ${this.playerSlot}`) {
      if(this.selectedOperator){
        const action: PlayerAction = {
          player: this.gameState?.currentPlayer ?? '',
          type: this.gameState?.phase ?? '',
          character: this.selectedOperator.char_alt_name,
          squad: ''
        };
        //this.ws.sendConfirmedAction(this.lobbyId, action);
          
      }else if(this.selectedSquad){
        const action: PlayerAction = {
          player: this.gameState?.currentPlayer ?? '',
          type: this.gameState?.phase ?? '',
          character: '',
          squad: this.selectedSquad.squad_name
        };

        //this.ws.sendConfirmedAction(this.lobbyId, action);
      }
    }

    this.selectedOperator = null;
    this.selectedSquad = null;
  }

  chooseSquad(squad: Squad){
    if(this.gameState?.phase === 'BAN' || this.gameState?.phase === 'PICK'){
      this.popUp.alertPopUp("This is Ban/Pick phase. Please Select Operator to be Banned/Picked!")
    }else if(this.gameState?.currentPlayer === `Player ${this.playerSlot}`){
      this.selectedSquad = squad;
      this.selectedOperator = null;

      const action: PlayerAction = {
        player: this.gameState?.currentPlayer ?? '',
        type: this.gameState?.phase ?? '',
        character: '',
        squad: squad.squad_name
      };

      //this.ws.sendPlayerAction(this.lobbyId, action);
    }
  }

  chooseOperator(operator: operator) {
    if(this.gameState?.phase === 'BAN SQUAD'){
      this.popUp.alertPopUp("This is Ban Squad phase. Please Select Squad to be Banned!")
    }else if(this.gameState?.currentPlayer === `Player ${this.playerSlot}`){
      this.selectedOperator = operator;
      this.selectedSquad = null;

      const action: PlayerAction = {
        player: this.gameState?.currentPlayer ?? '',
        type: this.gameState?.phase ?? '',
        character: operator.char_alt_name,
        squad: ''
      };
      //this.ws.sendPlayerAction(this.lobbyId, action);
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
