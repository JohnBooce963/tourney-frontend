import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LobbyRequest } from '../model/lobbyRequest';
import { LobbyResponse } from '../model/lobbyResponse';
import { HttpClient } from '@angular/common/http';
import { PopupService } from '../services/popup.service';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { HttpServiceService } from '../services/http-service.service';

@Component({
  selector: 'app-create-lobby',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './create-lobby.component.html',
  styleUrl: './create-lobby.component.scss'
})
export class CreateLobbyComponent {

  dialogRef = inject(MatDialogRef<CreateLobbyComponent>);
  data = inject(MAT_DIALOG_DATA);
  popUp = inject(PopupService);

  private httpService = inject(HttpServiceService);
  private router = inject(Router);

  lobbyName: string = "";
  lobbyTheme: number = 0;

  public themes = [
    { value: 1, label: "Phantom & Crimson Solitaire" },
    { value: 2, label: "Mizuki & Caerula Arbor" },
    { value: 3, label: "Expeditioner's Jǫklumarkar" },
    { value: 4, label: "Sarkaz's Furnaceside Fables"}
  ];

  onClose(){
    this.dialogRef.close()
  }

  createLobby(){
    const lobbyRequest: LobbyRequest = {
      lobbyName: this.lobbyName,
      lobbyTheme: this.lobbyTheme
    }

    console.log(lobbyRequest);

    this.httpService.createLobby(lobbyRequest).subscribe({
      next: (res: LobbyResponse) => {
        console.log('Lobby created(Create Lobby):', res);
        sessionStorage.setItem("ownerToken", res.ownerToken);
        this.dialogRef.close(res);
        this.router.navigate(['/lobbyRoom', res?.id]);
      },
      error: (err) => {
        console.error('Lobby creation failed', err);
        this.popUp.errorPopUp('Lobby Create Failed!');
        this.dialogRef.close();
      }
    });
  }
}
