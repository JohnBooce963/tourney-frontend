import { Component, inject, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { WebSocketService } from '../services/web-socket-service.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-coinflip',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule],
  templateUrl: './coinflip.component.html',
  styleUrl: './coinflip.component.scss'
})
export class CoinflipComponent implements OnInit{
  flipping = false;
  // result: string | null = null;

  private http = inject(HttpClient);

  dialogRef = inject(MatDialogRef<CoinflipComponent>);
  data = inject(MAT_DIALOG_DATA);
  ws = inject(WebSocketService);

  ngOnInit(){
    // this.flipCoin(this.data.lobbyId);
    // if(this.result){
    //   this.playCoinFlipAnimation()
    // }
    this.playCoinFlipAnimation(this.data.result)
  }

  // flipCoin(lobbyId: string) {

    
    // http method
    // this.http.get<any>(`http://localhost:8080/lobby/${lobbyId}/flip`).subscribe(res => {
    //   console.log(res);
    //   this.result = res.result; // "Heads" or "Tails"
    //   this.playCoinFlipAnimation()
    // })
    // determine rotation based on result
    
    // //this.ws.flipCoin(lobbyId);
  // }

  playCoinFlipAnimation(result: any){
    if(this.flipping) return;
    this.flipping = true;
    const coin = document.querySelector('.coin') as HTMLElement;
    if (!coin) return;

    // Reset rotation instantly
    coin.style.transition = 'none';
    coin.style.transform = 'rotateY(0deg)';

    requestAnimationFrame(() => {
      // Apply transition
      coin.style.transition = 'transform 3s ease-out';
      const rotations = 10;
      const angle = result === 'Heads' ? 360 * rotations : 360 * rotations + 180;
      coin.style.transform = `rotateY(${angle}deg)`;
    });

    setTimeout(() => {
      this.flipping = false
    }, 3000); // match duration
  }

  // onClose(){
  //   this.dialogRef.close(this.flipping)
  // }

}
