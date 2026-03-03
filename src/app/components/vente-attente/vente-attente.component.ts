import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VenteService, Vente } from '../../services/vente/vente.service';

@Component({
  selector: 'app-ventes-attente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vente-attente.component.html',
  styleUrls: ['./vente-attente.component.css']
})
export class VentesAttenteComponent implements OnInit {
  ventes: Vente[] = [];
  loading = true;
  error = '';
  private apiUrl = 'http://localhost:5000';

  constructor(private venteService: VenteService) {}

  ngOnInit(): void {
    this.chargerVentes();
  }

  chargerVentes(): void {
    this.loading = true;
    this.venteService.getVentesAttente().subscribe({
      next: (data) => {
        this.ventes = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur chargement des ventes';
        this.loading = false;
      }
    });
  }

  confirmer(id: string): void {
    if (confirm('Confirmer cette vente ?')) {
      this.venteService.confirmerVente(id).subscribe({
        next: () => {
          this.chargerVentes();
        },
        error: (err) => alert(err.error?.message || 'Erreur')
      });
    }
  }

  annuler(id: string): void {
    if (confirm('Annuler cette vente ?')) {
      this.venteService.annulerVente(id).subscribe({
        next: () => {
          this.chargerVentes();
        },
        error: (err) => alert(err.error?.message || 'Erreur')
      });
    }
  }

  imprimerTicket(vente: Vente): void {
    this.venteService.imprimerTicket(vente);
  }

  getProduitNom(item: any): string {
    if (typeof item.produitId === 'object' && item.produitId?.nom) {
      return item.produitId.nom;
    }
    return 'Produit';
  }

  getProduitImage(item: any): string | null {
    if (typeof item.produitId === 'object' && item.produitId?.images?.length) {
      return this.getImageUrl(item.produitId.images[0]);
    }
    return null;
  }

  getImageUrl(imagePath: string): string {
    return imagePath || 'assets/images/default-product.png';
  }

  getTotal(vente: Vente): number {
    return vente.items.reduce((acc, i) => acc + i.prixUnitaire * i.quantite, 0) + (vente.fraisLivraison || 0);
  }
}
