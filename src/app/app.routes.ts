import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LobbyComponent } from './lobby/lobby.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Tourney · IS Draft' },
  { path: 'lobby/:id', component: LobbyComponent, title: 'Lobby · Tourney' },
  { path: '**', redirectTo: '' },
];
