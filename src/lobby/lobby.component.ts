import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { WebSocketService } from '../services/web-socket-service.service';
import { LobbyRequest } from '../model/lobbyRequest';
import { LobbyResponse } from '../model/lobbyResponse';
import { Subscription } from 'rxjs';
import { MatButton } from '@angular/material/button';

import { HeaderTurnComponent } from '../header-turn/header-turn.component';

import { PopupService } from '../services/popup.service';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule} from '@angular/material/form-field';
import { environment } from '../environments/environment.development';
import { HttpServiceService } from '../services/http-service.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule, MatFormFieldModule, MatInputModule, HeaderTurnComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit, OnDestroy{

  constructor(public ws: WebSocketService, public popUp: PopupService, private http: HttpServiceService){}

  private router = inject(Router);

  lobbyName: string = '';
  theme: number = 4;
  lobbies: any[] = [];

  public themes = [
    { value: 1, label: "Phantom & Crimson Solitaire" },
    { value: 2, label: "Mizuki & Caerula Arbor" },
    { value: 3, label: "Expeditioner's Jǫklumarkar" },
    { value: 4, label: "Sarkaz's Furnaceside Fables"}
  ];

  async ngOnInit() {
    await this.ws.waitUntilConnected();
    // this.sse.connect();

    this.warm()

    // this.sse.subscribeToLobbies();
      
    // this.ws.lobbies$.subscribe(lobbies => {
    //   this.lobbies = lobbies;
    // });

    // this.sseSub = this.sse.lobbies$.subscribe(update => {
    //   this.lobbies = update
    //   console.log("lobbies update:", this.lobbies);
    // })

    await this.ws.subscribeToLobbies();

    this.ws.lobbies$.subscribe(lobbies => {
      if(lobbies){
        this.lobbies = lobbies;
      }
    });

    await this.loadLobbies();

    sessionStorage.removeItem("playerSlot");
    sessionStorage.removeItem("playerName");
    sessionStorage.removeItem("ownerToken");
  }

  ngOnDestroy() {
    //this.wsSub?.unsubscribe();

    // if (//this.ws.isConnected()) {
    //   //this.ws.unsubscribeFromLobby();
    // } else {
    //   console.warn('Skipping unsubscribe — WebSocket not connected.');
    // }
  }

  warm(){
    const endpoints = [
      '/api/lobby',
      '/api/lobby/test-id',
      '/api/lobby/test-id/flip',
      '/api/db/squad/1',
      '/api/db/operator'
    ];

    endpoints.forEach(ep =>
      fetch(`${environment.apiUrl}${ep}`, { method: 'GET' })
        .then(() => console.log(`Warmed ${ep}`))
        .catch(() => console.warn(`Failed to warm ${ep}`))
    );

    this.http.warmUpLobbies().subscribe({
      next: () => console.log('All POST endpoints warmed up!'),
      error: err => console.log('Warm-up error', err)
    });
  }

  async loadLobbies() {
    this.http.getLobbies().subscribe({
      next: (data) => {
        console.log('Lobbies loaded:', data);
        this.lobbies = data;
      },
      error: (err) => {
        this.popUp.errorPopUp('Error fetching lobbies: ' + err);
      }
    });
  }

  createLobby() {
    this.popUp.createLobbyPopUp();

    // const lobbyRequest: LobbyRequest = {
    //   lobbyName: this.lobbyName,
    //   lobbyTheme: this.theme
    // }

    // console.log(lobbyRequest);

    // this.http.post<LobbyResponse>(
    //   `${environment.apiUrl}/api/lobby`,
    //   lobbyRequest
    // ).subscribe({
    //   next: (res) => {
    //     console.log('Lobby created:', res);
    //     this.loadLobbies(); // refresh list
    //     sessionStorage.setItem("ownerToken", res.ownerToken);
    //     // this.router.navigate(['/lobbyRoom', res?.id])
    //   },
    //   error: (err) => {
    //     this.popUp.errorPopUp('Server has shutdown')
    //   }
    // });
  }

  joinLobby(id: string) {
    const lobby = this.lobbies.find(l => l.id === id);

    if (lobby && this.getPlayerCount(lobby.players) >= 2) {
      this.popUp.errorPopUp("Lobby is full!")
    }else{
      this.router.navigate(['/lobbyRoom', id]); 
    }

  }

  getPlayerCount(players: { [key: number]: string | null }): number {
    return Object.values(players).filter(p => p).length;
  }

  getThemeLabel(themeId: number){
    let theme = this.themes.find(t => t.value === themeId)
    return theme ? theme.label : "Unknow Theme"
  }
}
