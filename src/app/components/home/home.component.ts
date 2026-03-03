import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { Categorie } from '../../models/categorie.model';
import { CategorieService } from '../../services/categorie/categorie.service';
import { Boutique } from '../../models/boutique.model';          // <-- import
import { BoutiqueService } from '../../services/boutique/boutique.service'; // <-- import

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  user: any = null;
  showDropdown = false;
  showCategoriesDropdown = false;
  showRestaurantsDropdown = false;
  mobileMenuOpen = false;
  showVentesDropdown = false;


  categories: Categorie[] = [];
  loadingCategories = false;
  errorCategories = '';

  restaurants: Boutique[] = [];
  loadingRestaurants = false;
  errorRestaurants = '';

  constructor(
    private authService: AuthService,
    private categorieService: CategorieService,
    private boutiqueService: BoutiqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();

    if (this.isBoutique) {
      const currentUrl = this.router.url;
      if (!currentUrl.includes('/boutique/profil')) {
        this.router.navigate(['/home/boutique/profil']);
      }
    } else {
      this.loadRestaurants();
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  get isAcheteur(): boolean {
    return this.user && this.user.roles && this.user.roles.includes('acheteur');
  }

  get isBoutique(): boolean {
    return this.user && this.user.roles && this.user.roles.includes('boutique');
  }

  toggleCategoriesDropdown(): void {
    this.showCategoriesDropdown = !this.showCategoriesDropdown;
    if (this.showCategoriesDropdown && this.categories.length === 0 && !this.loadingCategories) {
      this.loadCategories();
    }
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.errorCategories = '';
    this.categorieService.getCategoriesHorsRestauration().subscribe({
      next: (data) => {
        this.categories = data;
        this.loadingCategories = false;
      },
      error: (err) => {
        this.errorCategories = 'Erreur de chargement des catégories';
        this.loadingCategories = false;
      }
    });
  }


  toggleRestaurantsDropdown(): void {
    this.showRestaurantsDropdown = !this.showRestaurantsDropdown;
    if (this.showRestaurantsDropdown && this.restaurants.length === 0 && !this.loadingRestaurants) {
      this.loadRestaurants();
    }
  }

  loadRestaurants(): void {
    this.loadingRestaurants = true;
    this.errorRestaurants = '';
    this.boutiqueService.getRestaurants().subscribe({
      next: (data) => {
        this.restaurants = data;
        this.loadingRestaurants = false;
      },
      error: (err) => {
        this.errorRestaurants = 'Erreur de chargement des restaurants';
        this.loadingRestaurants = false;
      }
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  toggleVentesDropdown(): void {
    this.showVentesDropdown = !this.showVentesDropdown;
  }

  closeVentesDropdown(): void {
    this.showVentesDropdown = false;
  }

}
