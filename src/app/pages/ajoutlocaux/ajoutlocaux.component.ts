// src/app/pages/add-local/add-local.component.ts
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalService } from '../../services/local.service';
import { Subject, takeUntil } from 'rxjs';
import {NavbarComponent} from '../../shared/navbar-admin/navbar.component';
import {FooterComponent} from '../../shared/footer-admin/footer.component';

export interface LocalForm {
  nom_boutique: string;
  categorie: string;
  emplacement: string;
  surface: number | null;
  loyer: number | null;
  etat_boutique: string;
  description: string;
  avantage: string[];
}

export interface ImagePreview {
  file: File;
  url: string;
  name: string;
  size: string;
}

@Component({
  selector: 'app-add-local',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './ajoutlocaux.component.html',
  styleUrls: ['./ajoutlocaux.component.scss']
})
export class AddLocalComponent implements OnInit, OnDestroy {

  // ── FORM DATA
  form: LocalForm = {
    nom_boutique: '',
    categorie: '',
    emplacement: '',
    surface: null,
    loyer: null,
    etat_boutique: 'disponible',
    description: '',
    avantage: []
  };

  // ── IMAGES
  imagePreviews: ImagePreview[] = [];
  readonly MAX_IMAGES = 5;
  readonly MAX_SIZE_MB = 5;
  isDragOver = false;
  imageError = '';
  activePreview: number | null = null;

  // ── AVANTAGES
  newAvantage = '';
  readonly AVANTAGES_SUGGESTIONS = [
    'Vitrine', 'Climatisé', 'WiFi', 'Parking', 'Sécurité 24h',
    'Cuisine équipée', 'Lumière naturelle', 'Modulable', 'Scène',
    'Sono', 'Lumières', '40 couverts', 'Accès PMR', 'Stock inclus'
  ];

  // ── ENUMS
  readonly CATEGORIES = [
    { value: 'Pop-up-store',  label: 'Pop-up store' },
    { value: 'Open-space',    label: 'Open-space' },
    { value: 'Evenementiel',  label: 'Événementiel' },
    { value: 'Food-court',    label: 'Food-court' }
  ];

  readonly EMPLACEMENTS = [
    { value: 'Emplacement FC',       label: 'FC — Food Court' },
    { value: 'Emplacement OS',       label: 'OS — Open Space' },
    { value: 'Emplacement Ev',       label: 'Ev — Événementiel' },
    { value: 'Emplacement Str-RDC',  label: 'Str RDC — Street Rez-de-chaussée' },
    { value: 'Emplacement Str-1Etg', label: 'Str 1er — Street 1er étage' }
  ];

  readonly ETATS = [
    { value: 'disponible',   label: 'Disponible' },
    { value: 'louée',        label: 'Louée' },
    { value: 'maintenance',  label: 'Maintenance' }
  ];

  // ── UI STATE
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';
  currentStep = 1;
  readonly TOTAL_STEPS = 3;

  // ── VALIDATION
  errors: {
    nom_boutique?: string;
    categorie?: string;
    emplacement?: string;
    surface?: string;
    loyer?: string;
    images?: string;
  } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private localService: LocalService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.imagePreviews.forEach(p => URL.revokeObjectURL(p.url));
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── STEPS
  nextStep(): void {
    if (this.validateStep(this.currentStep))
      this.currentStep = Math.min(this.currentStep + 1, this.TOTAL_STEPS);
  }

  prevStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 1);
  }

  get progressPct(): number {
    return ((this.currentStep - 1) / (this.TOTAL_STEPS - 1)) * 100;
  }

  // ── VALIDATION
  validateStep(step: number): boolean {
    this.errors = {};
    if (step === 1) {
      if (!this.form.nom_boutique.trim())
        this.errors['nom_boutique'] = 'Le nom est requis';
      if (!this.form.categorie)
        this.errors['categorie'] = 'Choisissez une catégorie';
      if (!this.form.emplacement)
        this.errors['emplacement'] = 'Choisissez un emplacement';
    }
    if (step === 2) {
      if (!this.form.surface || this.form.surface <= 0)
        this.errors['surface'] = 'Surface invalide';
      if (!this.form.loyer || this.form.loyer <= 0)
        this.errors['loyer'] = 'Loyer invalide';
    }
    return Object.keys(this.errors).length === 0;
  }

  validateAll(): boolean {
    const s1 = this.validateStep(1);
    const s2 = this.validateStep(2);
    return s1 && s2;
  }

  // Helper pour template strict — évite string | undefined
  getError(field: string): string {
    return (this.errors as Record<string, string>)[field] ?? '';
  }

  hasError(field: string): boolean {
    return !!(this.errors as Record<string, string>)[field];
  }

  // ── IMAGES
  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.isDragOver = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
    if (e.dataTransfer?.files) this.addFiles(Array.from(e.dataTransfer.files));
  }

  addFiles(files: File[]): void {
    this.imageError = '';
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) {
      this.imageError = 'Seuls les fichiers image sont acceptés (JPG, PNG, WEBP…)';
      return;
    }
    for (const file of imageFiles) {
      if (this.imagePreviews.length >= this.MAX_IMAGES) {
        this.imageError = `Maximum ${this.MAX_IMAGES} images autorisées`; break;
      }
      if (file.size > this.MAX_SIZE_MB * 1024 * 1024) {
        this.imageError = `"${file.name}" dépasse ${this.MAX_SIZE_MB} Mo`; continue;
      }
      if (this.imagePreviews.find(p => p.name === file.name)) continue;
      this.imagePreviews.push({
        file, url: URL.createObjectURL(file),
        name: file.name, size: this.formatBytes(file.size)
      });
    }
  }

  removeImage(index: number): void {
    URL.revokeObjectURL(this.imagePreviews[index].url);
    this.imagePreviews.splice(index, 1);
    if (this.activePreview === index) this.activePreview = null;
  }

  setMain(index: number): void {
    // Déplace l'image à la position 0 (= image principale)
    this.moveImage(index, 0);
    this.activePreview = 0;
  }

  moveImage(from: number, to: number): void {
    const arr = [...this.imagePreviews];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    this.imagePreviews = arr;
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  get canAddMore(): boolean { return this.imagePreviews.length < this.MAX_IMAGES; }

  // ── AVANTAGES
  addAvantage(value?: string): void {
    const av = (value ?? this.newAvantage).trim();
    if (av && !this.form.avantage.includes(av))
      this.form.avantage = [...this.form.avantage, av];
    if (!value) this.newAvantage = '';
  }

  removeAvantage(av: string): void {
    this.form.avantage = this.form.avantage.filter(a => a !== av);
  }

  isAvantageSelected(av: string): boolean { return this.form.avantage.includes(av); }

  toggleSuggestion(av: string): void {
    this.isAvantageSelected(av) ? this.removeAvantage(av) : this.addAvantage(av);
  }

  onAvantageKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') { e.preventDefault(); this.addAvantage(); }
  }

  // ── SUBMIT — envoie FormData multipart vers /add-newLocal
  onSubmit(): void {
    if (!this.validateAll()) { this.currentStep = 1; return; }

    this.isSubmitting = true;
    this.submitError = '';

    const fd = new FormData();
    fd.append('nom_boutique',  this.form.nom_boutique);
    fd.append('categorie',     this.form.categorie);
    fd.append('emplacement',   this.form.emplacement);
    fd.append('surface',       String(this.form.surface));
    fd.append('loyer',         String(this.form.loyer));
    fd.append('etat_boutique', this.form.etat_boutique);
    fd.append('description',   this.form.description);

    // avantage[] — multer le reconstruit en tableau
    this.form.avantage.forEach(av => fd.append('avantage', av));

    // images[] — champ nommé "images" pour upload.array('images', 5)
    this.imagePreviews.forEach(p => fd.append('images', p.file, p.name));

    this.localService.createLocal(fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.submitSuccess = true;
          setTimeout(() => this.ngZone.run(() => this.router.navigate(['/espaces'])), 2200);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.submitError = err?.error?.message ?? 'Une erreur est survenue. Réessayez.';
        }
      });
  }

  formatPrice(val: number | null): string {
    if (!val) return '—';
    return new Intl.NumberFormat('fr-FR').format(val) + ' Ar';
  }

  goBack(): void { this.router.navigate(['/espaces']); }
}
