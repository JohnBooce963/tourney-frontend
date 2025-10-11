import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinRequest } from '../model/joinRequest';
import { WebSocketService } from '../services/web-socket-service.service';
import { LobbyResponse } from '../model/lobbyResponse';
import { Subscription } from 'rxjs';
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

@Component({
  selector: 'app-lobby-room',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule],
  templateUrl: './lobby-room.component.html',
  styleUrl: './lobby-room.component.scss'
})
export class LobbyRoomComponent implements OnInit, OnDestroy {

  constructor(public ws: WebSocketService, public dialog: MatDialog, public popUp: PopupService){}

  private wsSub?: Subscription;
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);
  
  isFlipping: boolean = false;
  lobbyId!: string;
  lobby: LobbyResponse | null = null;
  startDraft: any;
  ready: boolean = false;
  playerSlot: string | null = null;
  playerName: string | null = null;
  ownerToken: string | null = null;

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

    // this.ws.room$.subscribe(update => {
    //   this.lobbyId = update;
    //   console.log("lobby update:", update);

    // });


    this.loadLobby()

    this.ws.subscribeToRoom(this.lobbyId);
  //  //this.wsSub = //this.ws.coinFlipLobby$.subscribe(res => {
  //   if (res && res.lobbyId === this.lobbyId) {
  //     console.log("Coin flip result:", res);
  //     this.popUp.coinFlipPopUp(this.lobbyId); // optional, show result
  //   }
  //  });

    //this.ws.draftRoom(this.lobbyId);

    this.playerName = sessionStorage.getItem("playerName");
    this.playerSlot = sessionStorage.getItem("playerSlot")
    this.ownerToken = sessionStorage.getItem("ownerToken");

    
  }

  ngOnDestroy() {
    //this.wsSub?.unsubscribe();   // 🔥 stop listening
    //this.ws.unsubscribeFromRoom(this.lobbyId); // optional helper in your WebSocketService
  }

  loadLobby() {
    this.http.get<LobbyResponse>(`${environment.apiUrl}/api/lobby/${this.lobbyId}`).subscribe({
      next: (res) => {
        console.log(res)
        this.lobby = res
      },
      error: (err) => console.error('Error loading lobby', err)
    });
  }

  join(slot: number) {
    const playereSlot = sessionStorage.getItem('playerSlot');
    if (playereSlot){
      this.popUp.alertPopUp("Please cancel previous role before join!")
      return;
    } 
    let dialogRef = this.dialog.open(JoinAsPlayerComponent);
    
    dialogRef.afterClosed().subscribe(playerName => {
      if(playerName){
      console.log(playerName);

      const req: JoinRequest = {
        playerName: playerName,
        slot: slot
      };

      console.log(req);
      this.http.post<LobbyResponse>(`${environment.apiUrl}/api/lobby/${this.lobbyId}/join`, req).subscribe({
        next: (res) => {
          this.lobby = res;
          console.log(this.lobby);

          sessionStorage.setItem("playerSlot", slot.toString());
          this.playerSlot = slot.toString();
          sessionStorage.setItem("playerName", playerName);
          this.playerName = playerName;
          // if ((res.players[1] != null) && (res.players[2] != null)) {
          //   // Both players are in → go to draft
          //   this.router.navigate(['/draft', this.lobbyId]);
          // }
        },
        error: (err) => this.popUp.errorPopUp("Failed to join: " + (err.error?.message || "unknown error"))
      });
      }
    })
  }

  getThemeLabel(themeId: number | undefined){
    let theme = this.themes.find(t => t.value === themeId)
    return theme ? theme.label : "Unknow Theme"
  }

  cancelRole() {
    const slot = sessionStorage.getItem('playerSlot');
    if (!slot) return;

    this.http.post<LobbyResponse>(`${environment.apiUrl}/api/lobby/${this.lobbyId}/cancel/${slot}`, {})
      .subscribe({
        next: res => {
          this.lobby = res;
          sessionStorage.removeItem('playerSlot');
          this.playerSlot = null;
          this.playerName = null;
          console.log("Role cancelled");
        },
        error: err => this.popUp.errorPopUp("Failed to cancel role: " + (err.error?.message || "unknown error"))
      });
  }

  leaveLobby() {
    const playerName = sessionStorage.getItem('playerName');
    const token = sessionStorage.getItem("ownerToken");
    if (token){
      this.popUp.alertPopUp("You can not leave the because you are the lobby owner")
    }else if(playerName && !token){
      this.http.post<LobbyResponse>(`${environment.apiUrl}/api/lobby/${this.lobbyId}/leave`, { playerName })
        .subscribe({
          next: res => {
            this.lobby = res;
            sessionStorage.clear();
            this.router.navigate(['/lobby']); // back to lobby list
          },
          error: err => this.popUp.errorPopUp("Failed to leave lobby: " + (err.error?.message || "unknown error"))
        });
    }else{
      this.router.navigate(['/lobby'])
    };


  }

  deleteLobby() {
    const token = sessionStorage.getItem("ownerToken");
    if (!token) {
      this.popUp.alertPopUp("You are not the lobby owner")
      return;
    }

    this.http.post(`${environment.apiUrl}/api/lobby/${this.lobbyId}/delete`, { ownerToken: token })
      .subscribe({
        next: () => {
          this.popUp.successPopUp("Lobby Deleted!")
          sessionStorage.removeItem("ownerToken");
          this.router.navigate(['/lobby']);
        },
        error: err => this.popUp.errorPopUp("Failed to delete: " + (err.error?.error || "unknown error"))
      });
  }

  flipCoin(){
    // this.http.get<any>(`http://localhost:8080/lobby/${this.lobbyId}/flip`).subscribe(res => {
    //   if(res){
    //     console.log(res);
    //   }
    // })
    // let dialogRef = this.dialog.open(CoinflipComponent, {
    //   width: "360px",
    //   height: "360px",
    //   data: { lobbyId: this.lobbyId}
    // })

    //this.ws.flipCoin(this.lobbyId)

    
  }

  startGame(){
    //this.ws.startDraft(this.lobbyId);
  }

}
