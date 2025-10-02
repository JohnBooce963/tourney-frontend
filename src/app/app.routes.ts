import { Routes } from '@angular/router';
import { LobbyComponent } from '../lobby/lobby.component';
import { DraftComponent } from '../draft/draft.component';
import { LobbyRoomComponent } from '../lobby-room/lobby-room.component';

export const routes: Routes = [
  { path: 'draft/:id', component: DraftComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: 'lobbyRoom/:id', component: LobbyRoomComponent },
  // { path: 'login', component: LoginComponent},
  // { path: 'signup', component: SignupComponent},
  { path: '', redirectTo: 'lobby', pathMatch: 'full'}
];
