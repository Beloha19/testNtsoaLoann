import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BoutiqueGestionService } from '../../services/boutique-gestion/boutique-gestion.service';
import { Boutique } from '../../models/boutique.model';

@Component({
  selector: 'app-boutique-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './boutique-profil.component.html',
  styleUrls: ['./boutique-profil.component.css']
})
export class BoutiqueProfilComponent implements OnInit {
  boutique: Boutique | null = null;
  boutiqueId: string = '';
  profilForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  editMode = false;

  constructor(
    private fb: FormBuilder,
    private boutiqueGestionService: BoutiqueGestionService
  ) {
    this.profilForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''],
      telephone: ['', Validators.required],
      localNom: [{ value: '', disabled: true }],
      localEmplacement: [{ value: '', disabled: true }],
      horaires: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadProfil();
  }

  get horairesArray(): FormArray {
    return this.profilForm.get('horaires') as FormArray;
  }

  loadProfil(): void {
    this.boutiqueGestionService.getProfilBoutique().subscribe({
      next: (data: Boutique) => {
        this.boutique = data;
        this.boutiqueId = data._id;
        this.profilForm.patchValue({
          nom: data.nom,
          description: data.description,
          telephone: data.telephone,
          localNom: data.local.nom_local,
          localEmplacement: data.local.emplacement
        });
        this.setHoraires(data.horaires);
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Erreur de chargement du profil.';
      }
    });
  }

  setHoraires(horaires: any[]): void {
    const horaireFGs = horaires.map(h => this.fb.group({
      jour: [h.jour],
      is_open: [h.is_open],
      ouverture: [h.ouverture || ''],
      fermeture: [h.fermeture || '']
    }));
    this.profilForm.setControl('horaires', this.fb.array(horaireFGs));
  }

  toggleEditMode(): void {
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
    // Recharger les données originales
    this.loadProfil();
  }

  onSubmit(): void {
    if (this.profilForm.invalid) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formValue = this.profilForm.getRawValue();
    const infos = {
      nom: formValue.nom,
      description: formValue.description,
      telephone: formValue.telephone
    };
    const horaires = formValue.horaires;

    forkJoin({
      infos: this.boutiqueGestionService.updateInfos(this.boutiqueId, infos),
      horaires: this.boutiqueGestionService.updateHoraires(this.boutiqueId, horaires)
    }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Profil mis à jour avec succès.';
        this.editMode = false; // Sortir du mode édition
        // Recharger les données pour refléter les changements
        this.loadProfil();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour.';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }


  getLogoUrl(): string {
    return this.boutique?.logo || 'assets/images/default-logo.png';
  }

}
