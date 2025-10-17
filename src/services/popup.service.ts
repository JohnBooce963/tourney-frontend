import { Inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { JoinAsPlayerComponent } from '../joinasplayer/joinasplayer.component';
import { PopupComponent } from '../popup/popup.component';
import { Router } from '@angular/router';
import { CreateLobbyComponent } from '../create-lobby/create-lobby.component';
import { LobbyResponse } from '../model/lobbyResponse';
import { CoinflipComponent } from '../coinflip/coinflip.component';

@Injectable({
  providedIn: 'root'
})
export class PopupService {

  constructor(public dialog: MatDialog) { }

  private router = Inject(Router);


  enterNamePopUp(): Promise<string | undefined> {
    const dialogRef = this.dialog.open(JoinAsPlayerComponent, {
      disableClose: true
    });

    return dialogRef.afterClosed().toPromise();
  }

  createLobbyPopUp(): void {
    let dialogRef = this.dialog.open(CreateLobbyComponent, 
    {
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
      console.log("Lobby Created (PopUp): ", result)
      this.successPopUp("Lobby Created!");
      }
    })
  }

  alertPopUp(message: string){
    let dialogRef = this.dialog.open(PopupComponent, { 
      data: { type: 'warn', message: message },
      disableClose: true
    })

    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
    })
  }

  errorPopUp(message: string){
    let dialogRef = this.dialog.open(PopupComponent, { 
      data: { type: 'error', message: message },
      disableClose: true
    })

    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
    })
  }

  successPopUp(message: string){
    let dialogRef = this.dialog.open(PopupComponent, { 
      data: { type: 'success', message: message },
      disableClose: true
    
    })

    dialogRef.afterClosed().subscribe(result => {
      
    })
  }

  coinFlipPopUp(lobbyId: string, result: any){
    let dialogRef = this.dialog.open(CoinflipComponent, { 
      width: "360px",      
      height: "360px",
      panelClass: "coinflip-dialog",
      data: { lobbyId: lobbyId, result: result},
      disableClose: true
    })

    dialogRef.afterClosed().subscribe(result => {
      console.log(result)
    })

  }
}
