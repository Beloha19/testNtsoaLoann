import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Import ajouté
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  typesClient: any[] = [];
  loadingTypes = false;

  private apiUrl = 'http://localhost:5000/typeClient';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: [''],
      email: ['', [Validators.required, Validators.email]],
      mdp: ['', [Validators.required, Validators.minLength(6)]],
      telephone: ['', [Validators.pattern(/^[0-9]+$/)]],
      typeClient: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTypesClient();
  }

  loadTypesClient(): void {
    this.loadingTypes = true;
    this.http.get<any[]>(`${this.apiUrl}/listeTypeClient`).subscribe({
      next: (data) => {
        this.typesClient = data;
        this.loadingTypes = false;
      },
      error: (err) => {
        console.error('Erreur chargement types client', err);
        this.errorMessage = 'Impossible de charger les types de client.';
        this.loadingTypes = false;
      }
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.registerForm.value;
    const userData = {
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      mdp: formValue.mdp,
      telephone: formValue.telephone || '',
      roles: ['acheteur'],
      typeClient: formValue.typeClient
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Inscription réussie ! Redirection vers la connexion...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription.';
      }
    });
  }
}
