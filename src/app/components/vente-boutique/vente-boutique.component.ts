import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoutiqueGestionService } from '../../services/boutique-gestion/boutique-gestion.service';
import { ProduitService } from '../../services/produit/produit.service';
import { StockService } from '../../services/stock/stock.service';
import { VenteService } from '../../services/vente/vente.service';
import { Produit } from '../../models/produit.model';

interface ArticleVente {
  produit: Produit;
  quantite: number;
  taille: string;
  prixUnitaire: number;
}

@Component({
  selector: 'app-vente-boutique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vente-boutique.component.html',
  styleUrls: ['./vente-boutique.component.css']
})
export class VenteBoutiqueComponent implements OnInit {
  boutiqueId: string = '';
  produits: Produit[] = [];
  produitsFiltres: Produit[] = [];
  loading = false;
  error = '';

  searchTerm: string = '';

  produitSelectionne: Produit | null = null;
  tailleSelectionnee: string = '';
  quantite: number = 1;
  stocksParTaille: { taille: string; quantite: number }[] = [];
  hasTaille: boolean = false;

  // Panier de vente
  articles: ArticleVente[] = [];
  fraisLivraison: number = 0;
  notes: string = '';
  methodePaiement: string = 'espèces';
  refTrans: string = '';

  private apiUrl = 'http://localhost:5000';

  constructor(
    private boutiqueGestionService: BoutiqueGestionService,
    private produitService: ProduitService,
    private stockService: StockService,
    private venteService: VenteService
  ) {}

  ngOnInit(): void {
    this.loadBoutiqueId();
  }

  loadBoutiqueId(): void {
    this.loading = true;
    this.boutiqueGestionService.getProfilBoutique().subscribe({
      next: (boutique) => {
        this.boutiqueId = boutique._id;
        this.loadProduits();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Impossible de charger les informations de la boutique.';
        this.loading = false;
      }
    });
  }

  loadProduits(): void {
    this.loading = true;
    this.produitService.getProduitsBoutique(this.boutiqueId).subscribe({
      next: (data) => {
        this.produits = data;
        this.produitsFiltres = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur de chargement des produits.';
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    if (!this.searchTerm) {
      this.produitsFiltres = this.produits;
    } else {
      this.produitsFiltres = this.produits.filter(p =>
        p.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  // Sélection d'un produit
  selectionnerProduit(produit: Produit): void {
    this.produitSelectionne = produit;
    this.quantite = 1;
    this.tailleSelectionnee = '';
    this.loadStocks(produit._id);
  }

  loadStocks(produitId: string): void {
    this.stockService.getStockParProduit(produitId).subscribe({
      next: (stocks) => {
        this.stocksParTaille = stocks;
        this.hasTaille = stocks.some(s => s.taille && s.taille.trim() !== '');
        if (stocks.length > 0) {
          if (this.hasTaille) {
            const firstAvailable = stocks.find(s => s.quantite > 0 && s.taille);
            this.tailleSelectionnee = firstAvailable ? firstAvailable.taille : stocks[0].taille;
          } else {
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
    if (!this.produitSelectionne) return 0;
    if (!this.tailleSelectionnee && this.stocksParTaille.length === 1 && !this.hasTaille) {
      return this.stocksParTaille[0].quantite;
    }
    const stock = this.stocksParTaille.find(s => s.taille === this.tailleSelectionnee);
    return stock ? stock.quantite : 0;
  }

  ajouterArticle(): void {
    if (!this.produitSelectionne || this.quantite < 1 || this.quantite > this.getStockTotal()) {
      alert('Quantité invalide ou stock insuffisant');
      return;
    }
    if (this.hasTaille && !this.tailleSelectionnee) {
      alert('Veuillez choisir une taille');
      return;
    }

    this.articles.push({
      produit: this.produitSelectionne,
      quantite: this.quantite,
      taille: this.tailleSelectionnee || '',
      prixUnitaire: this.produitSelectionne.prix
    });

    this.produitSelectionne = null;
    this.stocksParTaille = [];
    this.hasTaille = false;
    this.quantite = 1;
    this.tailleSelectionnee = '';
  }

  supprimerArticle(index: number): void {
    this.articles.splice(index, 1);
  }

  get total(): number {
    const sum = this.articles.reduce((acc, a) => acc + a.prixUnitaire * a.quantite, 0);
    return sum + (this.fraisLivraison || 0);
  }

  validerVente(): void {
    if (this.articles.length === 0) {
      alert('Aucun article dans la vente');
      return;
    }

    const items = this.articles.map(a => ({
      produitId: a.produit._id,
      quantite: a.quantite,
      prixUnitaire: a.prixUnitaire,
      taille: a.taille || undefined
    }));

    const data: any = {
      items,
      fraisLivraison: this.fraisLivraison || 0,
      notes: this.notes || undefined,
      methodePaiement: this.methodePaiement
    };
    if (this.methodePaiement === 'mobile money') {
      if (!this.refTrans) {
        alert('Référence de transaction requise');
        return;
      }
      data.refTrans = this.refTrans;
    }

    this.venteService.creerVente(data).subscribe({
      next: (response) => {
        alert('Vente enregistrée avec succès');
        this.articles = [];
        this.fraisLivraison = 0;
        this.notes = '';
        this.methodePaiement = 'espèces';
        this.refTrans = '';
      },
      error: (err) => {
        console.error(err);
        alert('Erreur : ' + (err.error?.message || 'Échec de la vente'));
      }
    });
  }

  getImageUrl(imagePath: string): string {
    return imagePath || 'assets/images/default-product.png';
  }

  getProduitNom(item: ArticleVente): string {
    return item.produit?.nom || 'Produit';
  }

  getProduitImage(item: ArticleVente): string | null {
    if (item.produit?.images?.length) {
      return this.getImageUrl(item.produit.images[0]);
    }
    return null;
  }
}
