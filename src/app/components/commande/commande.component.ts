import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PanierService } from '../../services/panier/panier.service';
import { CommandeService } from '../../services/commande/commande.service';
import { Panier } from '../../models/panier.model';

@Component({
  selector: 'app-commander',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.css']
})
export class CommanderComponent implements OnInit {
  panier: Panier | null = null;
  loading = true;
  submitting = false;
  error = '';
  success = '';
  commandeForm: FormGroup;

  constructor(
    private panierService: PanierService,
    private commandeService: CommandeService,
    private fb: FormBuilder
  ) {
    this.commandeForm = this.fb.group({
      typeLivraison: ['retrait', Validators.required],
      adresseLivraison: ['']
    });

    // Rendre l'adresse obligatoire si livraison est choisie
    this.commandeForm.get('typeLivraison')?.valueChanges.subscribe(value => {
      const adresseControl = this.commandeForm.get('adresseLivraison');
      if (value === 'livraison') {
        adresseControl?.setValidators([Validators.required]);
      } else {
        adresseControl?.clearValidators();
      }
      adresseControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.chargerPanier();
  }

  chargerPanier(): void {
    this.loading = true;
    this.panierService.getPanier().subscribe({
      next: (data) => {
        this.panier = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Impossible de charger le panier.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.commandeForm.invalid || !this.panier || this.panier.items.length === 0) return;

    this.submitting = true;
    this.error = '';
    this.success = '';

    const data: any = {
      typeLivraison: this.commandeForm.value.typeLivraison
    };
    if (data.typeLivraison === 'livraison') {
      data.adresseLivraison = this.commandeForm.value.adresseLivraison;
    }

    this.commandeService.passerCommande(data).subscribe({
      next: (response) => {
        this.submitting = false;
        this.success = 'Commande passée avec succès !';
        // Rediriger vers l'historique après 2 secondes
        setTimeout(() => {
          // this.router.navigate(['/home/mes-commandes']);
        }, 2000);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.message || 'Erreur lors du passage de la commande.';
      }
    });
  }

  get totalFormate(): string {
    if (!this.panier) return '0';
    return this.panier.total.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  getProduitNom(item: any): string {
    return typeof item.produitId === 'object' ? item.produitId.nom : 'Produit';
  }
}
