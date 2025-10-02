import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule
  ],
  templateUrl: './joinasplayer.component.html',
  styleUrl: './joinasplayer.component.scss'
})
export class JoinAsPlayerComponent {

  constructor(public dialogRef: MatDialogRef<JoinAsPlayerComponent>){}

  name: string = ""

  onSubmit(){
    if(this.name === ""){
      this.name = "Guest"
    }

    this.dialogRef.close(this.name);
  }

  onCancel(){
    this.dialogRef.close();
  }
}
