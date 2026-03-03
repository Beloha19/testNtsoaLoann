import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';
import {NavbarComponent} from '../../shared/navbar-admin/navbar.component';
import {FooterComponent} from '../../shared/footer-admin/footer.component';

// ─── Types ───────────────────────────────────────────────────────────────────
interface MoisData   { mois: string; label: string; total?: number; count?: number; }
interface StatutData { statut: string; count: number; total?: number; }
interface ModeData   { mode: string;  count: number; total: number; }

export interface StatsResponse {
  generatedAt: string;
  kpis: {
    locaux:   { total: number; disponibles: number; loues: number; maintenance: number; tauxOccupation: number; };
    clients:  { total: number; nouveauxCeMois: number; };
    alertes:  { demandesEnAttente: number; visitesEnAttente: number; loyersEnRetard: number; preuvesEnAttente: number; };
  };
  finances: {
    resume: { totalLoyersDus: number; totalLoyersPaies: number; totalLoyersRestant: number; totalCommandesPaies: number; revenusTotal: number; };
    loyersMensuels:    MoisData[];
    commandesMensuels: MoisData[];
    loyersParStatut:   StatutData[];
    commandesParStatut:StatutData[];
    loyersParMode:     ModeData[];
    commandesParMode:  ModeData[];
  };
  locaux: {
    etatGlobal:          { disponibles: number; loues: number; maintenance: number; tauxOccupation: number; };
    parCategorie:        { categorie: string; total: number; disponibles: number; loues: number; }[];
    parEmplacement:      { emplacement: string; total: number; disponibles: number; loues: number; }[];
    topLocauxRevenus:    { nom: string; emplacement: string; categorie: string; totalPaye: number; nbPaiements: number; }[];
    reservationsParStatut: StatutData[];
    demandesParStatut:   StatutData[];
  };
  visites: {
    resume:     { total: number; enAttente: number; confirmees: number; terminees: number; annulees: number; tauxConversion: number; };
    parStatut:  StatutData[];
    mensuelles: MoisData[];
    parHeure:   { heure: string; count: number; }[];
    topLocaux:  { nom: string; count: number; }[];
  };
}

type ActiveTab = 'finances' | 'locaux' | 'visites';

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './dashboard-stats.component.html',
  styleUrls: ['./dashboard-stats.component.scss']
})
export class DashboardStatsComponent implements OnInit, OnDestroy, AfterViewInit {

  stats: StatsResponse | null = null;
  isLoading = true;
  hasError  = false;
  activeTab: ActiveTab = 'finances';
  private destroy$ = new Subject<void>();

  // Pour utilisation dans le template
  Math = Math;

  @ViewChildren('chartCanvas') chartCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadStats(); }
  ngAfterViewInit(): void {}
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  setTab(tab: ActiveTab): void {
    this.activeTab = tab;
    setTimeout(() => this.renderAllCharts(), 100);
  }

  loadStats(): void {
    this.isLoading = true;
    this.hasError  = false;
    this.http.get<StatsResponse>(`${API_URL}/Statistique`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats     = data;
          this.isLoading = false;
          setTimeout(() => this.renderAllCharts(), 200);
        },
        error: () => {
          this.hasError  = true;
          this.isLoading = false;
        }
      });
  }

  // ═══════════════════════════════════════════════════════════
  // NOUVELLES MÉTHODES POUR L'INTERFACE AMÉLIORÉE
  // ═══════════════════════════════════════════════════════════

  /**
   * Retourne l'émoji correspondant à l'onglet actif
   */
  getTabEmoji(tab: string): string {
    switch(tab) {
      case 'finances': return '💰';
      case 'locaux': return '🏢';
      case 'visites': return '👥';
      default: return '📊';
    }
  }

  /**
   * Retourne le titre complet de l'onglet actif
   */
  getTabTitle(tab: string): string {
    switch(tab) {
      case 'finances': return 'Vue d\'ensemble financière';
      case 'locaux': return 'Gestion des locaux';
      case 'visites': return 'Suivi des visites';
      default: return 'Dashboard';
    }
  }

  /**
   * Génère la liste des KPIs pour l'affichage en vagues
   */
  getKpiList() {
    if (!this.stats) return [];

    return [
      {
        icon: '💰',
        value: 'Ar ' + this.formatMontantCourt(this.stats.finances.resume.revenusTotal),
        label: 'Revenus totaux',
        trend: 12, // À remplacer par une vraie valeur si disponible
        color: 'var(--or)',
        delay: 1
      },
      {
        icon: '🏠',
        value: this.stats.kpis.locaux.total,
        label: 'Locaux',
        trend: 5, // À remplacer par une vraie valeur si disponible
        color: 'var(--teal)',
        delay: 2
      },
      {
        icon: '👥',
        value: this.stats.kpis.clients.total,
        label: 'Clients',
        trend: 8, // À remplacer par une vraie valeur si disponible
        color: 'var(--green)',
        delay: 3
      },
      {
        icon: '📅',
        value: this.stats.visites.resume.total,
        label: 'Visites',
        color: 'var(--purple)',
        delay: 4
      }
    ];
  }

  /**
   * Retourne les statistiques de visites pour les badges
   */
  getVisitsStats() {
    if (!this.stats) return [];

    return [
      { value: this.stats.visites.resume.total, label: 'Total' },
      { value: this.stats.visites.resume.enAttente, label: 'En attente' },
      { value: this.stats.visites.resume.confirmees, label: 'Confirmées' },
      { value: this.stats.visites.resume.terminees, label: 'Terminées' },
      { value: this.stats.visites.resume.tauxConversion + '%', label: 'Conversion' }
    ];
  }

  /**
   * Calcule le pourcentage pour les barres de progression
   */
  calculatePercentage(value: number, total: number): number {
    if (!total) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  }

  /**
   * Retourne la classe CSS pour la tendance
   */
  getTrendClass(value: number): string {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return '';
  }

  // ═══════════════════════════════════════════════════════════
  // FORMATAGE (existants)
  // ═══════════════════════════════════════════════════════════
  formatMontant(n: number): string {
    if (!n) return '0';
    return n.toLocaleString('fr-FR');
  }

  formatMontantCourt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k';
    return String(n);
  }

  getStatutLabel(s: string): string {
    const map: Record<string, string> = {
      'paye': 'Payé', 'en attente': 'En attente', 'en retard': 'En retard',
      'impaye': 'Impayé', 'accepte': 'Acceptée', 'refuse': 'Refusée',
      'en attente paiement': 'En attente', 'payee': 'Payée', 'annulee': 'Annulée',
      'Confirmée': 'Confirmée', 'En attente': 'En attente', 'Annulée': 'Annulée',
      'Demande soumis': 'Soumise', 'en attente de confirmation': 'En attente',
      'Terminée': 'Terminée'
    };
    return map[s] ?? s;
  }

  getStatutColor(s: string): string {
    const map: Record<string, string> = {
      'paye': '#27ae60', 'payee': '#27ae60', 'accepte': '#27ae60', 'Confirmée': '#27ae60', 'Terminée': '#27ae60',
      'en attente': '#c4a05a', 'en attente paiement': '#c4a05a', 'En attente': '#c4a05a',
      'en attente de confirmation': '#c4a05a', 'Demande soumis': '#c4a05a',
      'en retard': '#e74c3c', 'impaye': '#e74c3c', 'refuse': '#e74c3c', 'Annulée': '#e74c3c', 'annulee': '#e74c3c',
    };
    return map[s] ?? '#7a7870';
  }

  getTopLocalPct(count: number): number {
    const top = this.stats?.visites?.topLocaux;
    if (!top || top.length === 0) return 0;
    const max = top[0].count;
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }

  getModeIcon(mode: string): string {
    const map: Record<string, string> = {
      'mvola': '📱', 'orange_money': '🟠', 'especes': '💵',
      'mobile_money': '📱', 'cheque': '🧾', 'non précisé': '—'
    };
    return map[mode] ?? '💳';
  }

  // ═══════════════════════════════════════════════════════════
  // CANVAS CHARTS (existants)
  // ═══════════════════════════════════════════════════════════
  private renderAllCharts(): void {
    if (!this.stats) return;
    if (this.activeTab === 'finances') {
      this.renderLineChart('chart-loyers',    this.stats.finances.loyersMensuels,    'total',  '#c4a05a');
      this.renderLineChart('chart-commandes', this.stats.finances.commandesMensuels, 'total',  '#2a9d8f');
      this.renderDonut('chart-cmd-statut',    this.stats.finances.commandesParStatut, 'count');
      this.renderDonut('chart-loyer-statut',  this.stats.finances.loyersParStatut,    'count');
      this.renderBarH('chart-modes',          this.stats.finances.loyersParMode,      'total', '#c4a05a');

      // Nouveau graphique combiné
      this.renderCombinedLineChart('chart-revenus-evolution',
        this.stats.finances.loyersMensuels,
        this.stats.finances.commandesMensuels);
    }
    if (this.activeTab === 'locaux') {
      this.renderDonut('chart-locaux-etat',   [
        { statut: 'Disponibles', count: this.stats.locaux.etatGlobal.disponibles },
        { statut: 'Loués',       count: this.stats.locaux.etatGlobal.loues },
        { statut: 'Maintenance', count: this.stats.locaux.etatGlobal.maintenance },
      ], 'count');
      this.renderBarV('chart-categories',   this.stats.locaux.parCategorie.map(c => ({ label: c.categorie, value: c.total })),   '#c4a05a');
      this.renderBarV('chart-emplacements', this.stats.locaux.parEmplacement.map(e => ({ label: e.emplacement.replace('Emplacement ', ''), value: e.total })), '#9b59b6');
      this.renderBarH('chart-top-locaux',   this.stats.locaux.topLocauxRevenus.map(l => ({ mode: l.nom, count: l.nbPaiements, total: l.totalPaye })), 'total', '#27ae60');
    }
    if (this.activeTab === 'visites') {
      this.renderBarV('chart-visites-mois', this.stats.visites.mensuelles.map(v => ({ label: v.label, value: v.count ?? 0 })), '#c4a05a');
      this.renderDonut('chart-visites-statut', this.stats.visites.parStatut, 'count');
      this.renderBarV('chart-visites-heure', this.stats.visites.parHeure.map(v => ({ label: v.heure, value: v.count })), '#2a9d8f');
    }
  }

  private getCanvas(id: string): { ctx: CanvasRenderingContext2D; w: number; h: number } | null {
    const el = document.getElementById(id) as HTMLCanvasElement;
    if (!el) return null;
    const ctx = el.getContext('2d');
    if (!ctx) return null;
    el.width  = el.offsetWidth  || 400;
    el.height = el.offsetHeight || 200;
    ctx.clearRect(0, 0, el.width, el.height);
    return { ctx, w: el.width, h: el.height };
  }

  /**
   * Nouveau graphique combiné pour l'évolution des revenus
   */
  private renderCombinedLineChart(id: string, loyersData: any[], commandesData: any[]): void {
    const c = this.getCanvas(id);
    if (!c) return;
    const { ctx, w, h } = c;

    const loyers = loyersData.map(d => d.total ?? 0);
    const commandes = commandesData.map(d => d.total ?? 0);
    const allVals = [...loyers, ...commandes];
    const max = Math.max(...allVals, 1);

    const pad = { t: 20, r: 20, b: 40, l: 56 };
    const cW = w - pad.l - pad.r;
    const cH = h - pad.t - pad.b;
    const step = loyersData.length > 1 ? cW / (loyersData.length - 1) : cW;

    // Grille
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (cH * i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cW, y); ctx.stroke();
    }

    // Fonction pour dessiner une ligne
    const drawLine = (data: number[], color: string, dashed: boolean = false) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      if (dashed) {
        ctx.setLineDash([5, 3]);
      } else {
        ctx.setLineDash([]);
      }

      data.forEach((val, i) => {
        const x = pad.l + i * step;
        const y = pad.t + cH - (val / max) * cH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Points
      data.forEach((val, i) => {
        const x = pad.l + i * step;
        const y = pad.t + cH - (val / max) * cH;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#0a0a0c';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.stroke();
      });
    };

    drawLine(loyers, '#c4a05a', false);
    drawLine(commandes, '#2a9d8f', true);

    // Labels X
    ctx.fillStyle = 'rgba(176,172,164,0.7)';
    ctx.font = '9px Space Mono, monospace';
    ctx.textAlign = 'center';
    loyersData.forEach((d, i) => {
      if (i % 2 === 0) {
        ctx.fillText(d.label, pad.l + i * step, h - 8);
      }
    });
  }

  // ── Courbe (Line Chart) ────────────────────────────────────
  private renderLineChart(id: string, data: any[], key: string, color: string): void {
    const c = this.getCanvas(id);
    if (!c) return;
    const { ctx, w, h } = c;
    const vals  = data.map(d => d[key] ?? 0);
    const max   = Math.max(...vals, 1);
    const pad   = { t: 20, r: 20, b: 40, l: 56 };
    const cW    = w - pad.l - pad.r;
    const cH    = h - pad.t - pad.b;
    const step  = data.length > 1 ? cW / (data.length - 1) : cW;

    // Grille
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (cH * i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cW, y); ctx.stroke();
      ctx.fillStyle = 'rgba(176,172,164,0.5)';
      ctx.font      = '10px Space Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(this.formatMontantCourt(max * (4 - i) / 4), pad.l - 6, y + 4);
    }

    // Aire de remplissage
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
    grad.addColorStop(0, color + '33');
    grad.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + cH);
    vals.forEach((v, i) => {
      const x = pad.l + i * step;
      const y = pad.t + cH - (v / max) * cH;
      i === 0 ? ctx.lineTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.l + (vals.length - 1) * step, pad.t + cH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Ligne principale
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    vals.forEach((v, i) => {
      const x = pad.l + i * step;
      const y = pad.t + cH - (v / max) * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    vals.forEach((v, i) => {
      const x = pad.l + i * step;
      const y = pad.t + cH - (v / max) * cH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle   = color;
      ctx.fill();
      ctx.strokeStyle = '#111113';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });

    // Labels X (tous les 2)
    ctx.fillStyle = 'rgba(176,172,164,0.7)';
    ctx.font      = '9px Space Mono, monospace';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      if (i % 2 === 0) {
        ctx.fillText(d.label, pad.l + i * step, h - 8);
      }
    });
  }

  // ── Donut Chart ────────────────────────────────────────────
  private renderDonut(id: string, data: StatutData[], key: string): void {
    const c = this.getCanvas(id);
    if (!c) return;
    const { ctx, w, h } = c;
    const colors = ['#c4a05a','#2a9d8f','#e74c3c','#9b59b6','#27ae60','#f39c12','#7a7870'];
    const vals   = data.map(d => (d as any)[key] ?? 0);
    const total  = vals.reduce((s, v) => s + v, 0);
    if (total === 0) return;
    const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 30, ri = r * 0.55;
    let angle = -Math.PI / 2;

    data.forEach((d, i) => {
      const slice = (vals[i] / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      // Séparateur
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.strokeStyle = '#0a0a0b';
      ctx.lineWidth   = 2;
      ctx.stroke();

      angle += slice;
    });

    // Trou central
    ctx.beginPath();
    ctx.arc(cx, cy, ri, 0, Math.PI * 2);
    ctx.fillStyle = '#111113';
    ctx.fill();

    // Texte central
    ctx.fillStyle = '#f0ece4';
    ctx.font      = `bold ${Math.round(ri * 0.4)}px Cormorant Garamond, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(total), cx, cy - 6);
    ctx.fillStyle = 'rgba(176,172,164,0.7)';
    ctx.font      = `${Math.round(ri * 0.22)}px Space Mono, monospace`;
    ctx.fillText('TOTAL', cx, cy + ri * 0.3);

    // Légende
    const legX = 8, legY0 = 14;
    data.forEach((d, i) => {
      const y = legY0 + i * 18;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(legX, y, 10, 10);
      ctx.fillStyle = 'rgba(176,172,164,0.8)';
      ctx.font      = '9px Space Mono, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const pct = Math.round((vals[i] / total) * 100);
      ctx.fillText(`${this.getStatutLabel(d.statut)} ${pct}%`, legX + 14, y + 1);
    });
  }

  // ── Bar chart horizontal ────────────────────────────────────
  private renderBarH(id: string, data: ModeData[], key: string, color: string): void {
    const c = this.getCanvas(id);
    if (!c) return;
    const { ctx, w, h } = c;
    const vals  = data.map(d => (d as any)[key] ?? 0);
    const max   = Math.max(...vals, 1);
    const pad   = { t: 10, r: 20, b: 10, l: 110 };
    const cW    = w - pad.l - pad.r;
    const barH  = Math.min(28, (h - pad.t - pad.b) / Math.max(data.length, 1) - 8);
    const gap   = (h - pad.t - pad.b - data.length * barH) / Math.max(data.length + 1, 1);

    data.forEach((d, i) => {
      const y    = pad.t + gap * (i + 1) + barH * i;
      const barW = (vals[i] / max) * cW;

      // Bg bar
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(pad.l, y, cW, barH);

      // Bar
      const grad = ctx.createLinearGradient(pad.l, 0, pad.l + barW, 0);
      grad.addColorStop(0, color + 'cc');
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.fillRect(pad.l, y, barW, barH);

      // Label gauche
      ctx.fillStyle   = 'rgba(176,172,164,0.8)';
      ctx.font        = '10px DM Sans, sans-serif';
      ctx.textAlign   = 'right';
      ctx.textBaseline= 'middle';
      const label = d.mode?.length > 12 ? d.mode.substring(0, 12) + '…' : (d.mode || '—');
      ctx.fillText(label, pad.l - 8, y + barH / 2);

      // Valeur droite
      ctx.fillStyle = '#f0ece4';
      ctx.font      = '10px Space Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(this.formatMontantCourt(vals[i]), pad.l + barW + 6, y + barH / 2);
    });
  }

  // ── Bar chart vertical ──────────────────────────────────────
  private renderBarV(id: string, data: { label: string; value: number }[], color: string): void {
    const c = this.getCanvas(id);
    if (!c) return;
    const { ctx, w, h } = c;
    const vals  = data.map(d => d.value);
    const max   = Math.max(...vals, 1);
    const pad   = { t: 20, r: 10, b: 36, l: 40 };
    const cW    = w - pad.l - pad.r;
    const cH    = h - pad.t - pad.b;
    const barW  = Math.max(8, (cW / data.length) - 6);
    const gapW  = (cW - barW * data.length) / Math.max(data.length + 1, 1);

    // Grille
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (cH * i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cW, y); ctx.stroke();
      ctx.fillStyle   = 'rgba(176,172,164,0.5)';
      ctx.font        = '9px Space Mono, monospace';
      ctx.textAlign   = 'right';
      ctx.textBaseline= 'middle';
      ctx.fillText(String(Math.round(max * (4 - i) / 4)), pad.l - 4, y);
    }

    data.forEach((d, i) => {
      const x = pad.l + gapW * (i + 1) + barW * i;
      const bH = (vals[i] / max) * cH;
      const y  = pad.t + cH - bH;

      const grad = ctx.createLinearGradient(0, y, 0, y + bH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '55');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, bH);

      // Valeur au-dessus
      if (vals[i] > 0) {
        ctx.fillStyle   = '#f0ece4';
        ctx.font        = '9px Space Mono, monospace';
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'bottom';
        ctx.fillText(String(vals[i]), x + barW / 2, y - 2);
      }

      // Label bas
      ctx.fillStyle   = 'rgba(176,172,164,0.7)';
      ctx.font        = '8px DM Sans, sans-serif';
      ctx.textAlign   = 'center';
      ctx.textBaseline= 'top';
      const lbl = d.label.length > 8 ? d.label.substring(0, 8) : d.label;
      ctx.fillText(lbl, x + barW / 2, pad.t + cH + 4);
    });
  }
}
