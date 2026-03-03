import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PanierService } from '../../services/panier/panier.service';
import { Panier, PanierItem } from '../../models/panier.model';

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit {
  panier: Panier | null = null;
  loading = true;
  error = '';
  updating = false;
  private apiUrl = 'http://localhost:5000';

  constructor(private panierService: PanierService) {}

  ngOnInit(): void {
    this.chargerPanier();
  }

  chargerPanier(): void {
    this.loading = true;
    this.error = '';
    this.panierService.getPanier().subscribe({
      next: (data) => {
        this.panier = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement panier', err);
        this.error = 'Impossible de charger le panier.';
        this.loading = false;
      }
    });
  }

  // Retourne l'objet produit si peuplé, sinon null
  getProduit(item: PanierItem): { _id: string; nom: string; images: string[] } | null {
    if (typeof item.produitId === 'object') {
      return item.produitId;
    }
    return null;
  }

  // Retourne l'ID du produit sous forme de string
  getProduitId(item: PanierItem): string {
    if (typeof item.produitId === 'object') {
      return item.produitId._id;
    }
    return item.produitId;
  }

  modifierQuantite(item: PanierItem, nouvelleQuantite: string | number): void {
    const qte = typeof nouvelleQuantite === 'string' ? parseInt(nouvelleQuantite, 10) : nouvelleQuantite;
    if (isNaN(qte) || qte < 1) return;
    this.updating = true;
    const produitId = this.getProduitId(item);
    this.panierService.modifierQuantite(produitId, qte).subscribe({
      next: (panierMisAJour) => {
        this.panier = panierMisAJour;
        this.updating = false;
      },
      error: (err) => {
        console.error('Erreur modification quantité', err);
        alert('Erreur lors de la modification.');
        this.updating = false;
      }
    });
  }

  supprimerArticle(produitId: string): void {
    if (!confirm('Supprimer cet article du panier ?')) return;
    this.updating = true;
    this.panierService.supprimerArticle(produitId).subscribe({
      next: (panierMisAJour) => {
        this.panier = panierMisAJour;
        this.updating = false;
      },
      error: (err) => {
        console.error('Erreur suppression article', err);
        alert('Erreur lors de la suppression.');
        this.updating = false;
      }
    });
  }

  viderPanier(): void {
    if (!confirm('Vider tout le panier ?')) return;
    this.updating = true;
    this.panierService.viderPanier().subscribe({
      next: () => {
        this.chargerPanier();
        this.updating = false;
      },
      error: (err) => {
        console.error('Erreur vidage panier', err);
        alert('Erreur lors du vidage.');
        this.updating = false;
      }
    });
  }

  get totalFormate(): string {
    if (!this.panier) return '0';
    return this.panier.total.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  getImageUrl(imagePath: string): string {
    return imagePath || 'assets/images/default-product.png';
  }

}
