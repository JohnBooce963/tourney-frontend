import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinRequest } from '../model/joinRequest';
import { WebSocketService } from '../services/web-socket-service.service';
import { LobbyResponse } from '../model/lobbyResponse';
import { firstValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { JoinAsPlayerComponent } from '../joinasplayer/joinasplayer.component';
import { PopupService } from '../services/popup.service';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule} from '@angular/material/form-field';
import { CoinflipComponent } from '../coinflip/coinflip.component';
import { environment } from '../environments/environment.development';
import { HttpServiceService } from '../services/http-service.service';
import { operator } from '../model/operator';
import { Squad } from '../model/squad';

@Component({
  selector: 'app-lobby-room',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule],
  templateUrl: './lobby-room.component.html',
  styleUrl: './lobby-room.component.scss'
})
export class LobbyRoomComponent implements OnInit, OnDestroy {

  constructor(
    public ws: WebSocketService, 
    public dialog: MatDialog, 
    public popUp: PopupService, 
    public route: ActivatedRoute, 
    public http: HttpServiceService,
    public router: Router
  ){}

  private wsSub?: Subscription;
  // private route = inject(ActivatedRoute);
  // private http = inject(HttpClient);
  // private router = inject(Router);
  
  isFlipping: boolean = false;
  lobbyId!: string;
  lobby: LobbyResponse | null = null;
  startDraft: any;
  ready: boolean = false;
  playerSlot: string | null = null;
  playerName: string | null = null;
  ownerToken: string | null = null;
  operators: operator[] | null = null;
  squads: Squad[] | null = null;

  private destroy$ = new Subject<void>();

  public themes = [
    { value: 1, label: "Phantom & Crimson Solitaire" },
    { value: 2, label: "Mizuki & Caerula Arbor" },
    { value: 3, label: "Expeditioner's Jǫklumarkar" },
    { value: 4, label: "Sarkaz's Furnaceside Fables"}
  ];

  async ngOnInit() {
    await this.ws.waitUntilConnected();

    // this.sse.connect();

    this.lobbyId = this.route.snapshot.paramMap.get('id')!;
    console.log(this.lobbyId)

    // this.sse.subscribeToRoom(this.lobbyId);

    //this.ws.subscribeToCoinFlip(this.lobbyId);

    // //this.ws.coinFlipLobby$.subscribe(res => {
    //   if(res){
    //     console.log(res)
    //   }
    // })

    //this.ws.flipping$.subscribe(flipping => {
    //   console.log(flipping)
    //   this.isFlipping = flipping;
    // })
    await this.ws.subscribeToRoom(this.lobbyId);

    this.ws.room$
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        if (!update) {   // deleted lobby
          console.log('Lobby deleted');
          this.popUp.successPopUp("Lobby has been deleted");
          this.router.navigate(['/lobby']);
          return;
        }
        if (update.id === this.lobbyId) {
          this.lobby = update;
        }    
      });
  //  //this.wsSub = //this.ws.coinFlipLobby$.subscribe(res => {
  //   if (res && res.lobbyId === this.lobbyId) {
  //     console.log("Coin flip result:", res);
  //     this.popUp.coinFlipPopUp(this.lobbyId); // optional, show result
  //   }
  //  });

    this.ws.coinFlipLobby$.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result?.lobbyId === this.lobbyId) {
        this.popUp.coinFlipPopUp(this.lobbyId, result.result);
      }
    });

    //this.ws.draftRoom(this.lobbyId);

    this.playerName = sessionStorage.getItem("playerName");
    this.playerSlot = sessionStorage.getItem("playerSlot")
    this.ownerToken = sessionStorage.getItem("ownerToken");

    await this.loadLobby()
    this.loadOperators();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.ws.unSubscribeToRoom(this.lobbyId);
  }

  async loadLobby() {
    this.lobbyId = this.route.snapshot.paramMap.get('id')!;

    try {
      const res = await firstValueFrom(this.http.getLobby(this.lobbyId));

      if (!res) {
        this.router.navigate(['/lobby']);
        return;
      }

      console.log('Lobby loaded:', res);
      this.lobby = res;

    } catch (err) {
      console.error('Error loading lobby', err);
      this.router.navigate(['/lobby']); // optional redirect on failure
    }
  }


    // this.http.get<LobbyResponse>(`${environment.apiUrl}/api/lobby/${this.lobbyId}`).subscribe({
    //   next: (res) => {
    //     if(res === null) {this.router.navigate(['/lobby'])};
    //     console.log(res)
    //     this.lobby = res
    //   },
    //   error: (err) => console.error('Error loading lobby', err)
    // });
  // }

  async join(slot: number) {
    this.lobbyId = this.route.snapshot.paramMap.get('id')!;
    const playereSlot = sessionStorage.getItem('playerSlot');
    if (playereSlot){
      this.popUp.alertPopUp("Please cancel previous role before join!")
      return;
    } 
    let dialogRef = this.dialog.open(JoinAsPlayerComponent, {
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe(async playerName => {
      if(playerName){
      console.log(playerName);

      const req: JoinRequest = {
        playerName: playerName,
        slot: slot
      };

      console.log(req);

      try{
          const res = await firstValueFrom(this.http.joinLobby(this.lobbyId, req));
         console.log('Joined lobby:', res);

          this.lobby = res;
          sessionStorage.setItem("playerSlot", slot.toString());
          this.playerSlot = slot.toString();
          sessionStorage.setItem("playerName", playerName);
          this.playerName = playerName;

        // Optionally navigate to another screen
        // if (res.players[1] && res.players[2]) {
        //   this.router.navigate(['/draft', this.lobbyId]);
        // }

      } catch (err: any) {
        console.error('Failed to join:', err);
        this.popUp.errorPopUp("Failed to join: " + (err.error?.message || "unknown error"));
      }
  
      // this.http.post<LobbyResponse>(`${environment.apiUrl}/api/lobby/${this.lobbyId}/join`, req).subscribe({
      //   next: (res) => {
      //     this.lobby = res;
      //     console.log(this.lobby);

      //     sessionStorage.setItem("playerSlot", slot.toString());
      //     this.playerSlot = slot.toString();
      //     sessionStorage.setItem("playerName", playerName);
      //     this.playerName = playerName;
      //     // if ((res.players[1] != null) && (res.players[2] != null)) {
      //     //   // Both players are in → go to draft
      //     //   this.router.navigate(['/draft', this.lobbyId]);
      //     // }
      //   },
      //   error: (err) => this.popUp.errorPopUp("Failed to join: " + (err.error?.message || "unknown error"))
      // });
      }
    })
  }

  getThemeLabel(themeId: number | undefined){
    let theme = this.themes.find(t => t.value === themeId)
    return theme ? theme.label : "Unknow Theme"
  }

  async cancelRole() {
    const slot = sessionStorage.getItem('playerSlot');
    if (!slot) return;

    this.lobbyId = this.route.snapshot.paramMap.get('id')!;
    try {
        const res = await firstValueFrom(this.http.cancelRole(this.lobbyId, slot));
        this.lobby = res;
        sessionStorage.removeItem('playerSlot');
        sessionStorage.removeItem('playerName');
        this.playerSlot = null;
        this.playerName = null;
        console.log("Role cancelled");
      } catch (err: any) {
        this.popUp.errorPopUp("Failed to cancel role: " + (err.error?.message || "unknown error"));
      }
  }

  async leaveLobby() {
    const playerName = sessionStorage.getItem('playerName');
    const token = sessionStorage.getItem("ownerToken");
    this.lobbyId = this.route.snapshot.paramMap.get('id')!;

    if (token){
      this.popUp.alertPopUp("You can not leave the because you are the lobby owner")
    }
    if (playerName && !token) {
      try {
        const res = await firstValueFrom(this.http.leaveLobby(this.lobbyId, playerName));
        this.lobby = res;
        sessionStorage.clear();
        this.router.navigate(['/lobby']);
      } catch (err: any) {
        this.popUp.errorPopUp("Failed to leave lobby: " + (err.error?.message || "unknown error"));
      }
    } else {
      this.router.navigate(['/lobby']);
    }


  }

  async deleteLobby() {
    const token = sessionStorage.getItem("ownerToken");
    if (!token) {
      this.popUp.alertPopUp("You are not the lobby owner")
      return;
    }

    this.lobbyId = this.route.snapshot.paramMap.get('id')!;

    try {
      await firstValueFrom(this.http.deleteLobby(this.lobbyId, token));
      this.popUp.successPopUp("Lobby Deleted!");
      sessionStorage.removeItem('ownerToken');
      this.router.navigate(['/lobby']);
    } catch (err: any) {
      this.popUp.errorPopUp("Failed to delete: " + (err.error?.error || "unknown error"));
    }
  }

  async flipCoin(){
    this.lobbyId = this.route.snapshot.paramMap.get('id')!;
    try {
      const res = await firstValueFrom(this.http.flipCoin(this.lobbyId));
      console.log('Coin flip result:', res);
    } catch (err) {
      console.error('Failed to flip coin', err);
    }
  }

  startGame(){
    this.ws.startDraft(this.lobbyId);
  }

  loadOperators() {
    this.http.fetchOperators().subscribe({
      next: ops => this.operators = ops,
      error: err => this.popUp.errorPopUp('Error loading operators: ' + err)
    });
  }

}
