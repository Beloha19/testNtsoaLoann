import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthAdminService } from '../../services/auth-admin.service';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-admin.component.html',
  styleUrls: ['./login-admin.component.css']
})
export class LoginAdminComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authAdminService: AuthAdminService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mdp: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email, mdp } = this.loginForm.value;

    this.authAdminService.login(email, mdp).subscribe({
      next: (response: { token: any; }) => {
        this.loading = false;
        this.authAdminService.setToken(response.token);
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: { error: { message: string; }; }) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Erreur de connexion';
      }
    });
  }
}
