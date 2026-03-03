import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BoutiqueService } from '../../services/boutique/boutique.service';
import { CategorieService } from '../../services/categorie/categorie.service';
import { Boutique } from '../../models/boutique.model';
import { Categorie } from '../../models/categorie.model';

@Component({
  selector: 'app-boutiques-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './boutiques-list.component.html',
  styleUrls: ['./boutiques-list.component.css']
})
export class BoutiquesListComponent implements OnInit {

  boutiques: Boutique[] = [];
  filteredBoutiques: Boutique[] = [];
  loading = true;
  error = '';
  totalCount = 0;

  // Gestion des filtres
  showFilters = false;
  categories: Categorie[] = [];
  selectedCategories: Set<string> = new Set();
  loadingCategories = false;
  categoriesError = '';

  constructor(
    private boutiqueService: BoutiqueService,
    private categorieService: CategorieService
  ) {}

  ngOnInit(): void {
    this.loadBoutiques();
  }

  loadBoutiques(): void {
    this.loading = true;
    this.error = '';
    this.boutiqueService.getBoutiquesHorsRestauration().subscribe({
      next: (data) => {
        this.boutiques = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement boutiques', err);
        this.error = 'Impossible de charger les boutiques. Veuillez réessayer plus tard.';
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    if (this.categories.length > 0) return;
    this.loadingCategories = true;
    this.categoriesError = '';
    this.categorieService.getCategoriesHorsRestauration().subscribe({
      next: (data) => {
        this.categories = data;
        this.loadingCategories = false;
      },
      error: (err) => {
        console.error('Erreur chargement catégories', err);
        this.categoriesError = 'Impossible de charger les catégories.';
        this.loadingCategories = false;
      }
    });
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    if (this.showFilters) this.loadCategories();
  }

  onCategoryChange(categorieId: string, event: any): void {
    if (event.target.checked) {
      this.selectedCategories.add(categorieId);
    } else {
      this.selectedCategories.delete(categorieId);
    }
  }

  applyFilter(): void {
    if (this.selectedCategories.size === 0) {
      this.filteredBoutiques = [...this.boutiques];
    } else {
      this.filteredBoutiques = this.boutiques.filter(boutique => {
        const catId = typeof boutique.categorie === 'string'
          ? boutique.categorie
          : boutique.categorie?._id;
        return catId && this.selectedCategories.has(catId);
      });
    }
    this.totalCount = this.filteredBoutiques.length;
    this.showFilters = false;
  }

  getLogoUrl(boutique: Boutique): string {
    return boutique?.logo || 'assets/images/default-logo.png';
  }

}
