import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router ,RouterOutlet, RouterLink, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { operator} from '../model/operator';
import { Squad } from '../model/squad';
import { CommonModule } from '@angular/common';
import { ChatboxComponent } from '../chatbox/chatbox.component';
import { HeaderTurnComponent } from '../header-turn/header-turn.component';
import { Observable } from 'rxjs';
import { WebSocketService } from '../services/web-socket-service.service';
import { GameStatus } from '../model/gamestatus';
import { PlayerAction } from '../model/playerAction';
import { DraftComponent } from '../draft/draft.component';
import { LobbyComponent } from '../lobby/lobby.component';
import { environment } from '../environments/environment';
import { HttpServiceService } from '../services/http-service.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // navigateToDraft(){
  //   this.router.navigate(['/draft']);
  // }
}
