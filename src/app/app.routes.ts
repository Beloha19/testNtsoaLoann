import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AccueilComponent } from './components/accueil/accueil.component';
import {VenteBoutiqueComponent} from './components/vente-boutique/vente-boutique.component';
import {LocauxComponent} from './pages/locaux/locaux.component';
import {MonContratComponent} from './pages/client-contrat/client-contrat.component';
import {AddLocalComponent} from './pages/ajoutlocaux/ajoutlocaux.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home/boutiques', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then(c => c.RegisterComponent) },
  {
    path: 'reserver/:localId/:clientId',
    loadComponent: () => import('./pages/visite/visite.component').then(m => m.ReserverVisiteComponent)
  },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
      { path: 'accueil', component: AccueilComponent },
      { path: 'boutiques', loadComponent: () => import('./components/boutiques-list/boutiques-list.component').then(c => c.BoutiquesListComponent) },
      { path: 'boutique/detail/:id', loadComponent: () => import('./components/boutique-detail/boutique-detail.component').then(c => c.BoutiqueDetailComponent) },
      { path: 'boutique/profil', loadComponent: () => import('./components/boutique-profil/boutique-profil.component').then(c => c.BoutiqueProfilComponent) },
      { path: 'boutique/produits', loadComponent: () => import('./components/boutique-produits/boutique-produits.component').then(c => c.BoutiqueProduitsComponent) },
      { path: 'produit/:id', loadComponent: () => import('./components/produit-detail/produit-detail.component').then(m => m.ProduitDetailComponent) },
      { path: 'panier', loadComponent: () => import('./components/panier/panier.component').then(m => m.PanierComponent) },
      { path: 'commander', loadComponent: () => import('./components/commande/commande.component').then(c => c.CommanderComponent) },
      {path: 'ventes-attente', loadComponent: () => import('./components/vente-attente/vente-attente.component').then(m => m.VentesAttenteComponent)},
      {path: 'ventes-boutique', loadComponent: () => import('./components/vente-boutique/vente-boutique.component').then(m => m.VenteBoutiqueComponent)},
      {path: 'mes-paiements', loadComponent: () => import('./pages/client-paiements/client-paiements.component').then(m => m.ClientPaiementsComponent)},
      { path: 'locales', component: LocauxComponent },
      { path: 'mon-contrat', component: MonContratComponent },
      {
        path: 'allreservation',
        loadComponent: () => import('./pages/client-reservation/client-reservation.component').then(m => m.ClientReservationsComponent)
      },
      { path: 'ajout-nouveaux-locals', component: AddLocalComponent },
      {
        path: 'allvisiteNeedeDecision',
        loadComponent: () => import('./pages/admin-decision-visite/admin-decision-visite.component').then(m => m.AdminVisitesComponent)
      },
      { path: 'admin', redirectTo: '/admin/login', pathMatch: 'full' },
      {
        path: 'admin/login',
        loadComponent: () => import('./components/login-admin/login-admin.component').then(c => c.LoginAdminComponent)
      },
      {
        path: 'admin/dashboard',
        loadComponent: () => import('./pages/dashboard-stats/dashboard-stats.component').then(m => m.DashboardStatsComponent)
      },
      {
        path: 'admin/demandes',
        loadComponent: () => import('./pages/admin-demandes/admin-demandes.component').then(m => m.AdminDemandesComponent)
      },
      {
        path: 'admin/locataires',
        loadComponent: () => import('./pages/locataire/locataire.component').then(m => m.AdminLocatairesComponent)
      },
      {
        path: 'admin/paiements',
        loadComponent: () => import('./pages/admin-paiements/admin-paiements.component').then(m => m.AdminPaiementsComponent)
      },
      {
        path: 'admin/commandes',
        loadComponent: () => import('./pages/admin-commande/admin-commande.component').then(m => m.AdminCommandesComponent)
      },
    ]
  },

];
