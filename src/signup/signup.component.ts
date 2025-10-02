import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpClient } from '@angular/common/http';
import { user } from '../model/user';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  
  private router = inject(Router);
  private http = inject(HttpClient);

  private url = "http://localhost:8080";

  username: string = "";
  password: string = "";
  confirmPassword: string = '';

  goToLogin(){
    this.router.navigate(['/login'])
  }

  signup(){
    if (this.password !== this.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    const userDetail: user = {
      username: this.username,
      password: this.password
    }

    this.http.post('http://localhost:8080/createUser', userDetail, { responseType: 'text' }).subscribe(res => {
      if(res)
      alert("Sign up successfully!");
      this.router.navigate(['/lobby']);
    },
    err => {
      if (err) {
        alert('Sign up failed!');
      } 
    })
  }
}
