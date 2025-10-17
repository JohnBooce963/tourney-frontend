import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { WebSocketService } from '../services/web-socket-service.service';
import { GameStatus } from '../model/gamestatus';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { HttpServiceService } from '../services/http-service.service';

@Component({
  selector: 'app-header-turn',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './header-turn.component.html',
  styleUrl: './header-turn.component.scss'
})
export class HeaderTurnComponent implements OnInit, OnDestroy {
  @Output() draftEnded = new EventEmitter<void>();

  private router = inject(Router);

  status: GameStatus = { currentPlayer: 'Player 1', phase: 'BAN', secondsLeft: 0, currentSlot: 'Ban Squad 1' };
  private wsSub?: Subscription;
  private localTimerSub?: Subscription;
  private endSub?: Subscription;
  private endTimerSub?: Subscription;

  endMessage: string | null = null;
  endSecondsLeft: number = 0;

  constructor(public ws: WebSocketService, private http: HttpServiceService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Subscribe to backend updates
    const ownerToken = sessionStorage.getItem("ownerToken") ?? '';
    const lobbyId = this.route.snapshot.paramMap.get('id')!;

    this.wsSub = this.ws.status$.subscribe(status => {
      this.status = status;

      // Restart local ticking whenever backend pushes
      this.localTimerSub?.unsubscribe();
      this.localTimerSub = interval(1000).subscribe(() => {
        if (this.status.secondsLeft > 0) {
          this.status = { ...this.status, secondsLeft: this.status.secondsLeft - 1 };
        }
      });
    });

    this.endSub = this.ws.end$.subscribe(end => {
      if (end) {
        this.endMessage = end.message;
        this.endSecondsLeft = end.secondsLeft;

        if(ownerToken){
          this.http.deleteLobby(lobbyId,ownerToken).subscribe(() => {
            console.log("lobby deleted")
          })
        }

        this.endTimerSub?.unsubscribe();
        this.endTimerSub = interval(1000).subscribe(() => {
          this.endSecondsLeft--;
          if (this.endSecondsLeft <= 0) {
            this.endTimerSub?.unsubscribe();
            this.endMessage = null;
            this.endSecondsLeft = 0;
            sessionStorage.removeItem("ownerToken");
            sessionStorage.removeItem("playerSlot");
            sessionStorage.removeItem("playerName");
            this.draftEnded.emit();
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    // this.wsSub?.unsubscribe();
    // this.localTimerSub?.unsubscribe();
    // this.endSub?.unsubscribe();
    // this.endTimerSub?.unsubscribe();
  }

  mmss(t: number) {
    const m = Math.floor(t / 60), s = t % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}