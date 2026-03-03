import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';

export interface CartItem {
  _id: string;
  produit: {
    _id: string;
    nom: string;
    prix: number;
    images?: string[];
    stock: number;
    is_disponible: boolean;
  } | null;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

export interface Panier {
  nombreArticles: number;
  total: number;
  items: CartItem[];
}

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.scss']
})
export class PanierComponent implements OnInit, OnDestroy {

  panier: Panier = { nombreArticles: 0, total: 0, items: [] };
  isLoading = false;
  isSubmitting = false;
  toastMessage = '';
  isToastVisible = false;
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  isViderModalOpen = false;
  isCommandeModalOpen = false;
  noteCommande = '';
  isSuccessModalOpen = false;
  commandeNumero = '';
  commandeMontant = 0;
  deletingId: string | null = null;
  updatingId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void { this.loadPanier(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  loadPanier(): void {
    this.isLoading = true;
    this.http.get<Panier>(`${API_URL}/commandes/panier`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.panier = data; this.isLoading = false; },
        error: () => { this.showToast('Erreur lors du chargement du panier', 'error'); this.isLoading = false; }
      });
  }

  updateQuantite(item: CartItem, delta: number): void {
    const nouvelleQte = item.quantite + delta;
    if (nouvelleQte < 1) return;
    const stock = item.produit?.stock ?? 0;
    if (nouvelleQte > stock) { this.showToast(`Stock max : ${stock}`, 'error'); return; }
    this.updatingId = item._id;
    this.http.patch(`${API_URL}/commandes/panier/${item._id}`, { quantite: nouvelleQte })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          item.quantite = nouvelleQte;
          item.sousTotal = item.prixUnitaire * nouvelleQte;
          this.recalculerTotal();
          this.updatingId = null;
        },
        error: (err) => { this.showToast(err?.error?.message ?? 'Erreur mise à jour', 'error'); this.updatingId = null; }
      });
  }

  supprimerItem(item: CartItem): void {
    this.deletingId = item._id;
    this.http.delete(`${API_URL}/commandes/panier/${item._id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast('Article retiré', 'success');
          setTimeout(() => {
            this.panier.items = this.panier.items.filter(i => i._id !== item._id);
            this.recalculerTotal();
            this.deletingId = null;
          }, 380);
        },
        error: () => { this.deletingId = null; this.showToast('Erreur suppression', 'error'); }
      });
  }

  viderPanier(): void {
    this.http.delete(`${API_URL}/commandes/panier`).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.panier = { nombreArticles: 0, total: 0, items: [] };
        this.isViderModalOpen = false;
        this.showToast('Panier vidé', 'success');
      },
      error: () => this.showToast('Erreur', 'error')
    });
  }

  passerCommande(): void {
    if (!this.panier.items.length) return;
    this.isSubmitting = true;
    this.http.post<any>(`${API_URL}/commandes/passer`, { note: this.noteCommande || null })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.isCommandeModalOpen = false;
          this.commandeNumero = res.numero;
          this.commandeMontant = res.montantTotal;
          this.panier = { nombreArticles: 0, total: 0, items: [] };
          this.noteCommande = '';
          this.isSuccessModalOpen = true;
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err?.error?.message ?? 'Erreur lors de la commande', 'error');
        }
      });
  }

  allerAuxCommandes(): void {
    this.isSuccessModalOpen = false;
    this.router.navigate(['/mes-commandes']);
  }

  private recalculerTotal(): void {
    this.panier.total = this.panier.items.reduce((s, i) => s + i.sousTotal, 0);
    this.panier.nombreArticles = this.panier.items.length;
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg; this.toastType = type; this.isToastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.isToastVisible = false, 3500);
  }

  formatPrix(prix: any): string {
    const n = typeof prix === 'object' && prix?.$numberDecimal ? parseFloat(prix.$numberDecimal) : Number(prix);
    return new Intl.NumberFormat('fr-FR').format(n) + ' Ar';
  }

  getImage(item: CartItem): string { return item.produit?.images?.[0] ?? ''; }
}
