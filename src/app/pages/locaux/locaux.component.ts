// src/app/pages/locaux/locaux.component.ts
import { Component, OnInit, OnDestroy, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalService } from '../../services/local.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';
import { Router } from '@angular/router';

export interface Local {
  _id: string;
  nom_boutique: string;
  categorie: 'Pop-up-store' | 'Open-space' | 'Evenementiel' | 'Food-court';
  emplacement: 'Emplacement FC' | 'Emplacement OS' | 'Emplacement Ev' | 'Emplacement Str-RDC' | 'Emplacement Str-1Etg';
  surface: number;
  loyer: number;
  etat_boutique: 'disponible' | 'louée' | 'maintenance';
  description?: string;
  avantage?: string[];
  images?: string[];
}

export interface FilterState {
  search: string;
  categorie: string;
  emplacement: string;
  surfaceMin: number | null;
  surfaceMax: number | null;
  prixMin: number | null;
  prixMax: number | null;
}

export interface FilterTag {
  label: string;
  clear: () => void;
}

@Component({
  selector: 'app-locaux',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './locaux.component.html',
  styleUrls: ['./locaux.component.scss']
})
export class LocauxComponent implements OnInit, OnDestroy {

  // ── DATA ──────────────────────────────────────────────────────
  allLocals: Local[] = [];
  filteredLocals: Local[] = [];
  pagedLocals: Local[] = [];
  bookmarked = new Set<string>();

  // ── UI STATE ──────────────────────────────────────────────────
  isLoading = true;
  currentView: 'grid' | 'list' = 'grid';
  sortValue = 'default';
  selectedLocal: Local | null = null;
  isModalOpen = false;
  toastMessage = '';
  isToastVisible = false;
  modalImageIndex = 0;

  // ── HERO SLIDER ───────────────────────────────────────────────
  heroSlide = 0;
  private sliderInterval: any;
  readonly SLIDER_COUNT = 4;

  // ── FILTERS ───────────────────────────────────────────────────
  filters: FilterState = {
    search: '', categorie: '', emplacement: '',
    surfaceMin: null, surfaceMax: null,
    prixMin: null, prixMax: null
  };
  filterTags: FilterTag[] = [];

  // ── PAGINATION ────────────────────────────────────────────────
  currentPage = 1;
  itemsPerPage = 6;

  // ── PRIVATE ───────────────────────────────────────────────────
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private toastTimer: any;

  constructor(private localService: LocalService, private ngZone: NgZone, private router: Router  ) {}

  // ── LIFECYCLE ─────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadLocals();
    this.startSlider();
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.sliderInterval);
  }

  // ── SLIDER ────────────────────────────────────────────────────
  startSlider(): void {
    // setInterval en dehors de la zone Angular pour les performances,
    // mais on re-entre dans la zone pour déclencher la détection de changements
    this.ngZone.runOutsideAngular(() => {
      this.sliderInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.heroSlide = (this.heroSlide + 1) % this.SLIDER_COUNT;
        });
      }, 4000);
    });
  }

  goToSlide(index: number): void {
    this.heroSlide = index;
    // Redémarre l'intervalle pour éviter un saut juste après un clic manuel
    clearInterval(this.sliderInterval);
    this.startSlider();
  }

  // ── KEYBOARD ──────────────────────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.closeModal();
    if (!this.isModalOpen) {
      if (e.key === 'ArrowRight') this.goToPage(this.currentPage + 1);
      if (e.key === 'ArrowLeft')  this.goToPage(this.currentPage - 1);
    }
  }

  // ── DATA ──────────────────────────────────────────────────────
  loadLocals(): void {
    this.isLoading = true;
    this.localService.getLocalsDisponibles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locals) => {
          this.allLocals = locals.map(item => ({
            _id:           item._id,
            nom_boutique:  item.nom_boutique,
            categorie:     item.categorie,
            emplacement:   item.emplacement,
            surface:       item.surface,
            loyer:         typeof item.loyer === 'object'
              ? parseFloat(item.loyer['$numberDecimal'] ?? item.loyer.toString())
              : Number(item.loyer),
            etat_boutique: item.etat_boutique,
            description:   item.description,
            avantage:      item.avantage ?? [],
            images: Array.isArray(item.images) ? item.images : []
          }));
          this.filteredLocals = [...this.allLocals];
          this.renderPage();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur API:', err);
          this.allLocals = MOCK_LOCALS;
          this.filteredLocals = [...MOCK_LOCALS];
          this.renderPage();
          this.isLoading = false;
        }
      });
  }

  // ── FILTERS ───────────────────────────────────────────────────
  onSearchChange(): void {
    this.searchSubject.next(this.filters.search);
  }

  applyFilters(): void {
    const { search, categorie, emplacement, surfaceMin, surfaceMax, prixMin, prixMax } = this.filters;
    const s = search.toLowerCase();

    this.filteredLocals = this.allLocals.filter(l => {
      const matchSearch = !s ||
        l.nom_boutique.toLowerCase().includes(s) ||
        l.emplacement.toLowerCase().includes(s) ||
        l.categorie.toLowerCase().includes(s);
      const matchCat  = !categorie   || l.categorie   === categorie;
      const matchEmp  = !emplacement || l.emplacement === emplacement;
      const matchSurf = (!surfaceMin || l.surface >= surfaceMin) &&
        (!surfaceMax || l.surface <= surfaceMax);
      const matchPrix = (!prixMin || l.loyer >= prixMin) &&
        (!prixMax || l.loyer <= prixMax);
      return matchSearch && matchCat && matchEmp && matchSurf && matchPrix;
    });

    this.currentPage = 1;
    this.renderPage();
    this.updateFilterTags();
  }

  resetFilters(): void {
    this.filters = {
      search: '', categorie: '', emplacement: '',
      surfaceMin: null, surfaceMax: null,
      prixMin: null, prixMax: null
    };
    this.filteredLocals = [...this.allLocals];
    this.currentPage = 1;
    this.renderPage();
    this.updateFilterTags();
  }

  updateFilterTags(): void {
    const tags: FilterTag[] = [];
    const f = this.filters;
    if (f.search)
      tags.push({ label: `"${f.search}"`, clear: () => { this.filters.search = ''; this.applyFilters(); }});
    if (f.categorie)
      tags.push({ label: f.categorie, clear: () => { this.filters.categorie = ''; this.applyFilters(); }});
    if (f.emplacement)
      tags.push({ label: f.emplacement, clear: () => { this.filters.emplacement = ''; this.applyFilters(); }});
    if (f.surfaceMin || f.surfaceMax)
      tags.push({ label: `Surface: ${f.surfaceMin||0}–${f.surfaceMax||'∞'} m²`,
        clear: () => { this.filters.surfaceMin = null; this.filters.surfaceMax = null; this.applyFilters(); }});
    if (f.prixMin || f.prixMax)
      tags.push({ label: `Prix: ${f.prixMin||0}–${f.prixMax||'∞'} Ar`,
        clear: () => { this.filters.prixMin = null; this.filters.prixMax = null; this.applyFilters(); }});
    this.filterTags = tags;
  }

  // ── SORT ──────────────────────────────────────────────────────
  sortLocals(): void {
    const arr = [...this.filteredLocals];
    switch (this.sortValue) {
      case 'prix-asc':     arr.sort((a,b) => a.loyer - b.loyer); break;
      case 'prix-desc':    arr.sort((a,b) => b.loyer - a.loyer); break;
      case 'surface-asc':  arr.sort((a,b) => a.surface - b.surface); break;
      case 'surface-desc': arr.sort((a,b) => b.surface - a.surface); break;
      case 'nom-asc':      arr.sort((a,b) => a.nom_boutique.localeCompare(b.nom_boutique)); break;
    }
    this.filteredLocals = arr;
    this.currentPage = 1;
    this.renderPage();
  }

  // ── PAGINATION ────────────────────────────────────────────────
  get totalPages(): number {
    return Math.ceil(this.filteredLocals.length / this.itemsPerPage);
  }

  get paginationRange(): (number | '...')[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    const left  = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('...');
    pages.push(total);
    return pages;
  }

  get rangeStart(): number { return (this.currentPage - 1) * this.itemsPerPage + 1; }
  get rangeEnd(): number   { return Math.min(this.currentPage * this.itemsPerPage, this.filteredLocals.length); }
  get progressPct(): number {
    return this.totalPages <= 1 ? 100 : ((this.currentPage - 1) / (this.totalPages - 1)) * 100;
  }

  renderPage(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.pagedLocals = this.filteredLocals.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isNumber(val: number | '...'): val is number { return val !== '...'; }

  // ── VIEW ──────────────────────────────────────────────────────
  setView(view: 'grid' | 'list'): void { this.currentView = view; }

  // ── MODAL ─────────────────────────────────────────────────────
  openModal(local: Local): void {
    this.selectedLocal = local;
    this.isModalOpen = true;
    this.modalImageIndex = 0;  // ← ajoute cette ligne
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedLocal = null;
    document.body.style.overflow = '';
  }
  // ← ajoute ces deux méthodes ici
  prevModalImage(): void {
    if (this.modalImageIndex > 0) this.modalImageIndex--;
  }
  nextModalImage(): void {
    if (this.selectedLocal && this.modalImageIndex < this.selectedLocal.images!.length - 1)
      this.modalImageIndex++;
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.closeModal();
  }

  reserverVisite(local: Local): void {
    if (!local) return;
    this.closeModal();
    const clientId = '699973f144fbc2ed5161181f'; // user id statique
    this.router.navigate(
      ['/reserver', local._id, clientId],
      { queryParams: { nom: local.nom_boutique } }
    );
  }

  // ── BOOKMARK ──────────────────────────────────────────────────
  toggleBookmark(local: Local, event: Event): void {
    event.stopPropagation();
    if (this.bookmarked.has(local._id)) {
      this.bookmarked.delete(local._id);
      this.showToast('Retiré des favoris');
    } else {
      this.bookmarked.add(local._id);
      this.showToast('Ajouté aux favoris ♥');
    }
  }

  isBookmarked(id: string): boolean { return this.bookmarked.has(id); }

  // ── TOAST ─────────────────────────────────────────────────────
  showToast(msg: string): void {
    this.toastMessage = msg;
    this.isToastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.isToastVisible = false, 3000);
  }

  // ── HELPERS ───────────────────────────────────────────────────
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }
  getThumbnailUrl(url: string): string {
    if (!url) return '';
    if (!url.startsWith('http')) return ''; // ancien nom de fichier local, on ignore
    return url.replace('/upload/', '/upload/w_400,h_300,c_fill,f_auto,q_auto/');
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (!url.startsWith('http')) return ''; // ancien nom de fichier local, on ignore
    return url;
  }

  getInitiale(nom: string): string { return nom.charAt(0).toUpperCase(); }

  isPremium(local: Local): boolean  { return local.loyer > 2000000; }
  isNew(idx: number): boolean       { return idx < 2; }

  trackById(_: number, local: Local): string { return local._id; }
}


const MOCK_LOCALS: Local[] = [
  { _id:'1', nom_boutique:'Espace Lumière',  categorie:'Pop-up-store', emplacement:'Emplacement FC',       surface:45,  loyer:1500000, etat_boutique:'disponible', description:'Un espace lumineux idéal pour un pop-up de mode.', avantage:['Vitrine', 'Climatisé'] },
  { _id:'2', nom_boutique:'Galerie Ouverte', categorie:'Open-space',   emplacement:'Emplacement OS',       surface:80,  loyer:2800000, etat_boutique:'disponible', description:'Grand open-space modulable.', avantage:['WiFi', 'Parking'] },
  { _id:'3', nom_boutique:'Pop-Up Corner',   categorie:'Pop-up-store', emplacement:'Emplacement Str-RDC',  surface:22,  loyer:750000,  etat_boutique:'disponible', description:'Espace compact et modulable.', avantage:['Modulable'] },
  { _id:'4', nom_boutique:'Salle Events',    categorie:'Evenementiel', emplacement:'Emplacement Ev',       surface:120, loyer:3500000, etat_boutique:'disponible', description:'Salle événementielle haut standing.', avantage:['Scène', 'Sono', 'Lumières'] },
  { _id:'5', nom_boutique:'Atelier Créatif', categorie:'Open-space',   emplacement:'Emplacement Str-1Etg', surface:35,  loyer:980000,  etat_boutique:'disponible', description:'Atelier polyvalent.', avantage:['Lumière naturelle'] },
  { _id:'6', nom_boutique:'Food Corner',     categorie:'Food-court',   emplacement:'Emplacement FC',       surface:95,  loyer:4200000, etat_boutique:'disponible', description:'Local food-court entièrement équipé.', avantage:['Cuisine équipée', '40 couverts'] },
];
