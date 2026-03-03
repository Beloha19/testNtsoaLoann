import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BoutiqueService } from '../../services/boutique/boutique.service';
import { ProduitService } from '../../services/produit/produit.service';
import { Boutique } from '../../models/boutique.model';
import { Produit } from '../../models/produit.model';

@Component({
  selector: 'app-boutique-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './boutique-detail.component.html',
  styleUrls: ['./boutique-detail.component.css']
})
export class BoutiqueDetailComponent implements OnInit {
  boutique: Boutique | null = null;
  produits: Produit[] = [];
  loadingBoutique = true;
  loadingProduits = true;
  errorBoutique = '';
  errorProduits = '';
  private apiUrl = 'http://localhost:5000';

  constructor(
    private route: ActivatedRoute,
    private boutiqueService: BoutiqueService,
    private produitService: ProduitService
  ) {}

  ngOnInit(): void {
    const boutiqueId = this.route.snapshot.paramMap.get('id');
    if (boutiqueId) {
      this.loadBoutique(boutiqueId);
      this.loadProduits(boutiqueId);
    }
  }

  loadBoutique(id: string): void {
    this.loadingBoutique = true;
    this.errorBoutique = '';
    this.boutiqueService.getBoutiqueInfo(id).subscribe({
      next: (data) => {
        this.boutique = data;
        this.loadingBoutique = false;
      },
      error: (err) => {
        console.error('Erreur chargement boutique', err);
        this.errorBoutique = 'Impossible de charger les informations de la boutique.';
        this.loadingBoutique = false;
      }
    });
  }

  loadProduits(boutiqueId: string): void {
    this.loadingProduits = true;
    this.errorProduits = '';
    this.produitService.getProduitsBoutique(boutiqueId).subscribe({
      next: (data) => {
        this.produits = data;
        this.loadingProduits = false;
      },
      error: (err) => {
        console.error('Erreur chargement produits', err);
        this.errorProduits = 'Impossible de charger les produits.';
        this.loadingProduits = false;
      }
    });
  }

  getLogoUrl(boutique: Boutique): string {
    return boutique?.logo || 'assets/images/default-logo.png';
  }

  getImageUrl(imagePath: string): string {
    return imagePath || 'assets/images/default-product.png';
  }

}
