import { Component,inject } from '@angular/core';
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
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private router = inject(Router);
  private http = inject(HttpClient);
  
  private url = "http://localhost:8080";
  
  username: string = "";
  password: string = "";

  goToSignUp(){
    this.router.navigate(['/signup'])
  }

  login(){
    const userDetail: user = {
      username: this.username,
      password: this.password
    }

    console.log(userDetail)
    
    this.http.post('http://localhost:8080/login', userDetail, { responseType: 'text' }).subscribe(res => {
          if(res)
          alert("Login successfully!");
          this.router.navigate(['/lobby']);
        },
        err => {
          if (err.status == 400) {
            alert('Login failed! Due to Password Incorrect');
          }else if(err.status == 500){
            alert('Login failed! Due to User Not Found');
          } 
        })
  }
}
