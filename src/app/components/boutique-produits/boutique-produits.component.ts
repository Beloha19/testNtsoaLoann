import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BoutiqueGestionService } from '../../services/boutique-gestion/boutique-gestion.service';
import { ProduitService } from '../../services/produit/produit.service';
import { CategorieService } from '../../services/categorie/categorie.service';
import { SousCategoriesService } from '../../services/sous-categorie/sous-categorie.service';
import { StockService } from '../../services/stock/stock.service';
import { Produit } from '../../models/produit.model';
import { Categorie } from '../../models/categorie.model';

@Component({
  selector: 'app-boutique-produits',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './boutique-produits.component.html',
  styleUrls: ['./boutique-produits.component.css']
})
export class BoutiqueProduitsComponent implements OnInit {
  boutiqueId: string = '';
  produits: Produit[] = [];
  filteredProduits: Produit[] = [];
  loading = false;
  error = '';

  searchTerm: string = '';
  selectedSousCategorie: string = '';
  sousCategories: { id: string; nom: string }[] = [];

  showAddModal = false;
  addForm: FormGroup;
  selectedFiles: File[] = [];
  uploading = false;
  successMessage = '';
  errorMessage = '';

  categories: Categorie[] = [];
  formSousCategories: { id: string; nom: string }[] = [];

  // Stock
  showStockModal = false;
  selectedProduit: Produit | null = null;
  stockForm: FormGroup;
  stockUploading = false;
  stockError = '';
  stockSuccess = '';

  // Modification
  showEditModal = false;
  editSelectedProduit: Produit | null = null;
  editForm: FormGroup;
  editSelectedFiles: File[] = [];
  editUploading = false;
  editSuccess = '';
  editError = '';
  editExistingImages: string[] = [];
  editFormSousCategories: { id: string; nom: string }[] = [];

  // Suppression
  showDeleteModal = false;
  produitToDelete: Produit | null = null;
  deleteLoading = false;

  constructor(
    private boutiqueGestionService: BoutiqueGestionService,
    private produitService: ProduitService,
    private categorieService: CategorieService,
    private sousCategoriesService: SousCategoriesService,
    private stockService: StockService,
    private fb: FormBuilder
  ) {
    this.addForm = this.fb.group({
      reference: ['', Validators.required],
      nom: ['', Validators.required],
      description: [''],
      prix: ['', [Validators.required, Validators.min(0)]],
      categorieId: ['', Validators.required],
      sousCategorieId: ['', Validators.required]
    });

    this.stockForm = this.fb.group({
      taille: [''],
      quantite: [1, [Validators.required, Validators.min(1)]]
    });

    this.editForm = this.fb.group({
      reference: ['', Validators.required],
      nom: ['', Validators.required],
      description: [''],
      prix: ['', [Validators.required, Validators.min(0)]],
      categorieId: ['', Validators.required],
      sousCategorieId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadBoutiqueId();
    this.loadAllCategories();

    this.addForm.get('categorieId')?.valueChanges.subscribe(value => {
      if (value) {
        this.loadSousCategoriesForCategorie(value, 'add');
      } else {
        this.formSousCategories = [];
        this.addForm.patchValue({ sousCategorieId: '' });
      }
    });

    this.editForm.get('categorieId')?.valueChanges.subscribe(value => {
      if (value) {
        this.loadSousCategoriesForCategorie(value, 'edit');
      } else {
        this.editFormSousCategories = [];
        this.editForm.patchValue({ sousCategorieId: '' });
      }
    });
  }

  trackById(index: number, item: any): string {
    return item?.id || index;
  }

  loadBoutiqueId(): void {
    this.loading = true;
    this.boutiqueGestionService.getProfilBoutique().subscribe({
      next: (boutique) => {
        this.boutiqueId = boutique._id;
        this.loadProduits();
        if (boutique.categorie && boutique.categorie._id) {
          this.loadAllSousCategoriesForFilter([boutique.categorie._id]);
        } else {
          this.sousCategories = [];
        }
      },
      error: (err) => {
        console.error(err);
        this.error = 'Impossible de charger les informations de la boutique.';
        this.loading = false;
      }
    });
  }

  loadAllCategories(): void {
    this.categorieService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Erreur chargement catégories', err);
      }
    });
  }

  loadAllSousCategoriesForFilter(categorieIds: string[]): void {
    if (categorieIds.length === 0) {
      this.sousCategories = [];
      return;
    }
    const observables = categorieIds.map(id => this.sousCategoriesService.getSousCategoriesByCategorie(id));
    forkJoin(observables).subscribe({
      next: (results) => {
        const allSousCats = results.reduce((acc, val) => acc.concat(val), []);
        const validSousCats = allSousCats.filter(sc => sc && sc._id);
        const unique = new Map();
        validSousCats.forEach(sc => unique.set(sc._id, sc));
        this.sousCategories = Array.from(unique.values()).map(sc => ({ id: sc._id, nom: sc.nom }));
        this.sousCategories.sort((a, b) => a.nom.localeCompare(b.nom));
      },
      error: (err) => {
        console.error('Erreur chargement sous-catégories pour filtre', err);
        this.sousCategories = [];
      }
    });
  }

  loadSousCategoriesForCategorie(categorieId: string, target: 'add' | 'edit'): void {
    this.sousCategoriesService.getSousCategoriesByCategorie(categorieId).subscribe({
      next: (data) => {
        const validData = data.filter(sc => sc && sc._id);
        if (target === 'add') {
          this.formSousCategories = validData.map(sc => ({ id: sc._id, nom: sc.nom }));
        } else {
          this.editFormSousCategories = validData.map(sc => ({ id: sc._id, nom: sc.nom }));
        }
      },
      error: (err) => {
        console.error('Erreur chargement sous-catégories', err);
        if (target === 'add') {
          this.formSousCategories = [];
        } else {
          this.editFormSousCategories = [];
        }
      }
    });
  }

  loadProduits(): void {
    this.loading = true;
    this.produitService.getProduitsBoutique(this.boutiqueId).subscribe({
      next: (data) => {
        this.produits = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur de chargement des produits.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredProduits = this.produits.filter(p => {
      const matchNom = p.nom.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchSousCat = this.selectedSousCategorie ? p.sousCategorieId === this.selectedSousCategorie : true;
      return matchNom && matchSousCat;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSousCategorieChange(): void {
    this.applyFilters();
  }

  openAddModal(): void {
    this.showAddModal = true;
    this.addForm.reset();
    this.selectedFiles = [];
    this.successMessage = '';
    this.errorMessage = '';
    this.formSousCategories = [];
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files.length > 5) {
      this.errorMessage = 'Vous ne pouvez sélectionner que 5 images maximum.';
      return;
    }
    if (files.length === 0) {
      this.selectedFiles = [];
      return;
    }
    this.selectedFiles = Array.from(files);
  }

  onSubmitAdd(): void {
    if (this.addForm.invalid || this.selectedFiles.length === 0) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires et sélectionner au moins une image.';
      return;
    }

    this.uploading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('boutiqueId', this.boutiqueId);
    formData.append('reference', this.addForm.value.reference);
    formData.append('nom', this.addForm.value.nom);
    formData.append('description', this.addForm.value.description || '');
    formData.append('prix', this.addForm.value.prix);
    formData.append('categorieId', this.addForm.value.categorieId);
    formData.append('sousCategorieId', this.addForm.value.sousCategorieId);

    for (let i = 0; i < this.selectedFiles.length; i++) {
      formData.append('images', this.selectedFiles[i]);
    }

    this.produitService.ajouterProduit(formData).subscribe({
      next: (response) => {
        this.uploading = false;
        this.successMessage = 'Produit ajouté avec succès !';
        this.loadProduits();
        setTimeout(() => this.closeAddModal(), 2000);
      },
      error: (err) => {
        this.uploading = false;
        console.error('Détails de l\'erreur:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de l\'ajout.';
      }
    });
  }

  // Suppression avec modal
  openDeleteModal(produit: Produit): void {
    this.produitToDelete = produit;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.produitToDelete = null;
  }

  confirmDelete(): void {
    if (!this.produitToDelete) return;
    this.deleteLoading = true;
    this.produitService.supprimerProduit(this.produitToDelete._id).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.closeDeleteModal();
        this.loadProduits();
      },
      error: (err) => {
        this.deleteLoading = false;
        alert('Erreur : ' + (err.error?.message || 'Suppression échouée'));
      }
    });
  }

  // Stock
  openStockModal(produit: Produit): void {
    this.selectedProduit = produit;
    this.showStockModal = true;
    this.stockForm.reset({ taille: '', quantite: 1 });
    this.stockError = '';
    this.stockSuccess = '';
  }

  closeStockModal(): void {
    this.showStockModal = false;
    this.selectedProduit = null;
  }

  onSubmitStock(): void {
    if (this.stockForm.invalid || !this.selectedProduit) return;

    this.stockUploading = true;
    this.stockError = '';
    this.stockSuccess = '';

    const stockData = {
      produitId: this.selectedProduit._id,
      taille: this.stockForm.value.taille || undefined,
      quantite: this.stockForm.value.quantite
    };

    this.stockService.ajouterStock(stockData).subscribe({
      next: (response) => {
        this.stockUploading = false;
        this.stockSuccess = 'Stock ajouté avec succès !';
        setTimeout(() => {
          this.closeStockModal();
          this.loadProduits();
        }, 1500);
      },
      error: (err) => {
        this.stockUploading = false;
        this.stockError = err.error?.message || 'Erreur lors de l\'ajout du stock.';
      }
    });
  }

  // Modification
  openEditModal(produit: Produit): void {
    this.editSelectedProduit = produit;
    this.editExistingImages = produit.images || [];

    const getCategorieId = (id: string | { _id: string }): string => {
      return typeof id === 'string' ? id : id._id;
    };

    const catId = getCategorieId(produit.categorieId);
    const sousCatId = getCategorieId(produit.sousCategorieId);

    this.editForm.patchValue({
      reference: produit.reference,
      nom: produit.nom,
      description: produit.description,
      prix: produit.prix,
      categorieId: catId,
      sousCategorieId: sousCatId
    });

    if (catId) {
      this.loadSousCategoriesForCategorie(catId, 'edit');
    }
    this.editSelectedFiles = [];
    this.editSuccess = '';
    this.editError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editSelectedProduit = null;
    this.editExistingImages = [];
  }

  onEditFileSelected(event: any): void {
    const files = event.target.files;
    if (files.length > 5) {
      this.editError = 'Vous ne pouvez sélectionner que 5 images maximum.';
      return;
    }
    this.editSelectedFiles = Array.from(files);
  }

  onSubmitEdit(): void {
    if (this.editForm.invalid || !this.editSelectedProduit) {
      this.editError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.editUploading = true;
    this.editSuccess = '';
    this.editError = '';

    const formData = new FormData();
    formData.append('reference', this.editForm.value.reference);
    formData.append('nom', this.editForm.value.nom);
    formData.append('description', this.editForm.value.description || '');
    formData.append('prix', this.editForm.value.prix);
    formData.append('categorieId', this.editForm.value.categorieId);
    formData.append('sousCategorieId', this.editForm.value.sousCategorieId);

    if (this.editSelectedFiles.length > 0) {
      for (let i = 0; i < this.editSelectedFiles.length; i++) {
        formData.append('images', this.editSelectedFiles[i]);
      }
    }

    this.produitService.modifierProduit(this.editSelectedProduit._id, formData).subscribe({
      next: (response) => {
        this.editUploading = false;
        this.editSuccess = 'Produit modifié avec succès !';
        this.loadProduits();
        setTimeout(() => this.closeEditModal(), 2000);
      },
      error: (err) => {
        this.editUploading = false;
        console.error('Erreur modification:', err);
        this.editError = err.error?.message || 'Erreur lors de la modification.';
      }
    });
  }

  getImageUrl(imagePath: string): string {
    return imagePath || 'assets/images/default-product.png';
  }
}
