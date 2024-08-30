import { Component } from '@angular/core';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { UserLogin } from '../../../model/user.model';
import { AuthService } from '../../../services/auth.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    FloatLabelModule,
    InputTextModule,
    PasswordModule,
    FormsModule,
    ButtonModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  providers: []
})
export class LoginPageComponent {
  loading: boolean = false;
  credentials: UserLogin = { username: '', password: '' };

  constructor(private authService: AuthService) { }

  login() {
    this.loading = true;
    this.authService.login(this.credentials.username, this.credentials.password).subscribe(
      response => {
        this.loading = false;
      },
      error => {
        this.loading = false;
      }
    );
  }

  triggerSubmit(){
   this.login();
  }
}
