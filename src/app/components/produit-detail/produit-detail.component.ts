import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProduitService } from '../../services/produit/produit.service';
import { StockService } from '../../services/stock/stock.service';
import { Produit } from '../../models/produit.model';
import { PanierService } from '../../services/panier/panier.service';

@Component({
  selector: 'app-produit-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './produit-detail.component.html',
  styleUrls: ['./produit-detail.component.css']
})
export class ProduitDetailComponent implements OnInit {
  produit: Produit | null = null;
  loading = true;
  error = '';

  stocksParTaille: { taille: string; quantite: number }[] = [];
  tailleSelectionnee: string = '';
  quantite: number = 1;
  hasTaille: boolean = false;

  currentImageIndex = 0;
  private slideshowInterval: any;

  private apiUrl = 'http://localhost:5000';

  constructor(
    private route: ActivatedRoute,
    private produitService: ProduitService,
    private stockService: StockService,
    private panierService: PanierService
  ) {}

  ngOnInit(): void {
    const produitId = this.route.snapshot.paramMap.get('id');
    if (produitId) {
      this.loadProduit(produitId);
      this.loadStocks(produitId);
    }
  }

  startSlideshow(): void {
    if (this.produit && this.produit.images.length > 1) {
      this.slideshowInterval = setInterval(() => {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.produit!.images.length;
      }, 1000);
    }
  }

  stopSlideshow(): void {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
      this.slideshowInterval = null;
      this.currentImageIndex = 0;
    }
  }


  loadProduit(id: string): void {
    this.loading = true;
    this.produitService.getProduitById(id).subscribe({
      next: (data) => {
        this.produit = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement produit', err);
        this.error = 'Impossible de charger le produit.';
        this.loading = false;
      }
    });
  }

  loadStocks(produitId: string): void {
    this.stockService.getStockParProduit(produitId).subscribe({
      next: (stocks) => {
        this.stocksParTaille = stocks;
        // Vérifier s'il y a au moins une taille non vide
        this.hasTaille = stocks.some(s => s.taille && s.taille.trim() !== '');

        if (stocks.length > 0) {
          if (this.hasTaille) {
            // Sélectionner la première taille disponible
            const firstAvailable = stocks.find(s => s.quantite > 0 && s.taille);
            this.tailleSelectionnee = firstAvailable ? firstAvailable.taille : stocks[0].taille;
          } else {
            // Pas de taille, on utilise une chaîne vide
            this.tailleSelectionnee = '';
          }
        }
      },
      error: (err) => {
        console.error('Erreur chargement stocks', err);
        this.stocksParTaille = [];
        this.hasTaille = false;
      }
    });
  }

  getStockTotal(): number {
    if (!this.tailleSelectionnee && this.stocksParTaille.length === 1 && !this.hasTaille) {
      // Cas particulier : un seul stock sans taille
      return this.stocksParTaille[0].quantite;
    }
    const stock = this.stocksParTaille.find(s => s.taille === this.tailleSelectionnee);
    return stock ? stock.quantite : 0;
  }

  getImageUrl(imagePath: string): string {
    return imagePath || 'assets/images/default-product.png';
  }

  ajouterAuPanier(): void {
    if (!this.produit || !this.tailleSelectionnee || this.quantite < 1) return;
    if (this.quantite > this.getStockTotal()) {
      alert('Quantité non disponible');
      return;
    }

    this.panierService.ajouterAuPanier(
      this.produit._id,
      this.quantite,
      this.produit.prix,
      this.tailleSelectionnee // ← maintenant accepté
    ).subscribe({
      next: () => {
        alert('Produit ajouté au panier');
      },
      error: (err) => {
        console.error('Erreur ajout panier', err);
        alert('Erreur lors de l\'ajout au panier');
      }
    });
  }

}
