import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';

// ── Jours fériés Madagascar (fallback si l'API externe échoue) ─
const JOURS_FERIES_MG: { month: number; day: number; name: string }[] = [
  { month: 1,  day: 1,  name: 'Jour de l\'An' },
  { month: 3,  day: 8,  name: 'Journée de la Femme' },
  { month: 3,  day: 29, name: 'Commémoration 1947' },
  { month: 5,  day: 1,  name: 'Fête du Travail' },
  { month: 6,  day: 26, name: 'Fête de l\'Indépendance' },
  { month: 8,  day: 15, name: 'Assomption' },
  { month: 11, day: 1,  name: 'Toussaint' },
  { month: 12, day: 11, name: 'Proclamation de la République' },
  { month: 12, day: 25, name: 'Noël' },
];

export interface CalendarCell {
  date: Date | null;
  isPast: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isAvailable: boolean;
  isTaken: boolean;
  isToday: boolean;
  isFirstOfMonth?: boolean;
  isLastOfMonth?: boolean;
  weekNumber?: number;
}

// Réponse de l'API /date-visite-disponibles
interface DateDispoApi {
  date: string;
  creneaux_disponibles: string[];
}

@Component({
  selector: 'app-reserver-visite',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './visite.component.html',
  styleUrls: ['./visite.component.scss']
})
export class ReserverVisiteComponent implements OnInit, OnDestroy {

  // ── IDs
  localId   = '';
  localName = '';

  // ── CALENDAR
  today         = new Date();
  currentMonth: number;
  currentYear:  number;
  calendarCells: CalendarCell[] = [];

  // Dates ayant encore au moins 1 créneau libre
  availableDates = new Set<string>();

  // Map dateStr → liste des créneaux disponibles
  creneauxDispoParDate = new Map<string, string[]>();

  // Statistiques du mois
  monthStats = {
    totalDays: 0,
    availableDays: 0,
    fullyBookedDays: 0,
    weekendDays: 0,
    holidayDays: 0
  };

  // ── SELECTION
  selectedDate: Date | null = null;

  // ── CRENEAUX
  readonly CRENEAUX_POSSIBLES = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
  ];

  // Créneaux par période (pour meilleure organisation)
  readonly CRENEAUX_MATIN = this.CRENEAUX_POSSIBLES.slice(0, 3);
  readonly CRENEAUX_APRESMIDI = this.CRENEAUX_POSSIBLES.slice(3);

  selectedCreneau = '';

  // ── FORM
  form = { heure_debut: '', heure_fin: '' };

  // ── UI
  isLoading     = false;
  isSubmitting  = false;
  submitSuccess = false;
  submitError   = '';

  // Messages animés
  loadingMessages = [
    'Vérification des disponibilités...',
    'Consultation du calendrier...',
    'Presque prêt...'
  ];
  currentLoadingMessage = this.loadingMessages[0];
  loadingMessageInterval: any;

  // ── CONSTANTS
  readonly WEEKDAYS  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  readonly MONTHS_FR = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient
  ) {
    this.currentMonth = this.today.getMonth();
    this.currentYear  = this.today.getFullYear();
  }

  ngOnInit(): void {
    this.localId   = this.route.snapshot.paramMap.get('localId') ?? '';
    this.localName = this.route.snapshot.queryParamMap.get('nom') ?? '';
    if (this.localId) this.loadAvailableDates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.loadingMessageInterval) {
      clearInterval(this.loadingMessageInterval);
    }
  }

  // ── GETTERS POUR LE TEMPLATE ───────────────────────────────

  get currentMonthLabel(): string {
    return this.MONTHS_FR[this.currentMonth];
  }

  /**
   * Retourne l'emoji correspondant au type de jour
   */
  getDayEmoji(cell: CalendarCell): string {
    if (cell.isHoliday) return '🎉';
    if (cell.isWeekend) return '😎';
    if (cell.isTaken) return '❌';
    if (cell.isAvailable) return '✅';
    if (cell.isPast) return '⏳';
    return '';
  }

  /**
   * Retourne le statut formaté du jour
   */
  getDayStatus(cell: CalendarCell): string {
    if (cell.isHoliday) return 'Férié';
    if (cell.isWeekend) return 'Week-end';
    if (cell.isTaken) return 'Complet';
    if (cell.isAvailable) return 'Disponible';
    if (cell.isPast) return 'Passé';
    return '';
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatusClass(cell: CalendarCell): string {
    if (cell.isHoliday) return 'holiday';
    if (cell.isWeekend) return 'weekend';
    if (cell.isTaken) return 'taken';
    if (cell.isAvailable) return 'available';
    if (cell.isPast) return 'past';
    return '';
  }

  /**
   * Retourne le nombre de créneaux disponibles pour une date
   */
  getAvailableSlotsCount(date: Date | null): number {
    if (!date) return 0;
    const dateStr = this.toDateStr(date);
    const slots = this.creneauxDispoParDate.get(dateStr) ?? [];
    return slots.length;
  }

  /**
   * Retourne un libellé pour le nombre de créneaux
   */
  getSlotsLabel(count: number): string {
    if (count === 0) return 'Aucun créneau';
    if (count === 1) return '1 créneau disponible';
    return `${count} créneaux disponibles`;
  }

  /**
   * Vérifie si une date a des créneaux le matin
   */
  hasMorningSlots(date: Date | null): boolean {
    if (!date) return false;
    const slots = this.getAvailableSlotsCount(date);
    return slots > 0 && this.CRENEAUX_MATIN.some(c => this.isCreneauDispoForDate(c, date));
  }

  /**
   * Vérifie si une date a des créneaux l'après-midi
   */
  hasAfternoonSlots(date: Date | null): boolean {
    if (!date) return false;
    const slots = this.getAvailableSlotsCount(date);
    return slots > 0 && this.CRENEAUX_APRESMIDI.some(c => this.isCreneauDispoForDate(c, date));
  }

  /**
   * Version statique de isCreneauDispo pour une date donnée
   */
  private isCreneauDispoForDate(creneau: string, date: Date): boolean {
    const dateStr = this.toDateStr(date);
    const dispos = this.creneauxDispoParDate.get(dateStr) ?? [];
    return dispos.includes(creneau);
  }

  /**
   * Retourne les statistiques du mois pour l'affichage
   */
  getMonthStats() {
    return this.monthStats;
  }

  /**
   * Retourne le pourcentage d'occupation du mois
   */
  getMonthOccupationRate(): number {
    const totalWorkable = this.monthStats.totalDays -
      this.monthStats.weekendDays -
      this.monthStats.holidayDays;
    if (totalWorkable <= 0) return 0;
    return Math.round((this.monthStats.availableDays / totalWorkable) * 100);
  }

  /**
   * Formate une date en français lisible
   */
  formatDateFrench(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // ── CHARGER DATES + CRÉNEAUX DISPOS ───────────────────────
  loadAvailableDates(): void {
    this.isLoading = true;
    this.rotateLoadingMessages();

    const url = `${API_URL}/VisiteCM/date-visite-disponibles/${this.localId}`
      + `?month=${this.currentMonth + 1}&year=${this.currentYear}`;

    this.http.get<DateDispoApi[]>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dates) => {
          // Réinitialiser
          this.availableDates      = new Set<string>();
          this.creneauxDispoParDate = new Map<string, string[]>();

          // Alimenter la Map et le Set depuis la réponse API
          dates.forEach(d => {
            this.availableDates.add(d.date);
            this.creneauxDispoParDate.set(d.date, d.creneaux_disponibles);
          });

          this.buildCalendar();
          this.stopLoadingMessages();
          this.isLoading = false;
        },
        error: () => {
          // En cas d'erreur réseau, on affiche quand même le calendrier vide
          this.buildCalendar();
          this.stopLoadingMessages();
          this.isLoading = false;
        }
      });
  }

  /**
   * Fait défiler les messages de chargement
   */
  private rotateLoadingMessages(): void {
    let index = 0;
    this.loadingMessageInterval = setInterval(() => {
      index = (index + 1) % this.loadingMessages.length;
      this.currentLoadingMessage = this.loadingMessages[index];
    }, 2000);
  }

  private stopLoadingMessages(): void {
    if (this.loadingMessageInterval) {
      clearInterval(this.loadingMessageInterval);
    }
  }

  // ── BUILD CALENDAR ─────────────────────────────────────────
  buildCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay  = new Date(this.currentYear, this.currentMonth + 1, 0);

    // Décalage ISO : lundi = 0
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const cells: CalendarCell[] = [];

    // Réinitialiser les stats
    this.monthStats = {
      totalDays: 0,
      availableDays: 0,
      fullyBookedDays: 0,
      weekendDays: 0,
      holidayDays: 0
    };

    // Cellules vides avant le 1er du mois
    for (let i = 0; i < startDow; i++) {
      cells.push({
        date: null, isPast: false, isWeekend: false,
        isHoliday: false, isAvailable: false, isTaken: false, isToday: false
      });
    }

    const todayMidnight = new Date(
      this.today.getFullYear(),
      this.today.getMonth(),
      this.today.getDate()
    );

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date      = new Date(this.currentYear, this.currentMonth, d);
      const dow       = date.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const isPast    = date < todayMidnight;
      const isToday   = this.isSameDay(date, this.today);
      const holiday   = this.getHoliday(date);
      const isHoliday = !!holiday;
      const dateStr   = this.toDateStr(date);

      // Disponible = pas passé, pas WE, pas férié ET présent dans la réponse API
      const isAvailable = !isPast && !isWeekend && !isHoliday
        && this.availableDates.has(dateStr);

      // Complet = jour ouvrable, non passé, mais ABSENT de la réponse API
      // (l'API n'inclut que les dates avec au moins 1 créneau libre)
      const isTaken = !isPast && !isWeekend && !isHoliday
        && !this.availableDates.has(dateStr);

      // Mettre à jour les stats
      this.monthStats.totalDays++;
      if (isWeekend) this.monthStats.weekendDays++;
      if (isHoliday) this.monthStats.holidayDays++;
      if (isAvailable) this.monthStats.availableDays++;
      if (isTaken) this.monthStats.fullyBookedDays++;

      cells.push({
        date,
        isPast,
        isWeekend,
        isHoliday,
        holidayName: holiday?.name,
        isAvailable,
        isTaken,
        isToday,
        isFirstOfMonth: d === 1,
        isLastOfMonth: d === lastDay.getDate(),
        weekNumber: this.getWeekNumber(date)
      });
    }

    this.calendarCells = cells;
  }

  /**
   * Calcule le numéro de semaine
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // ── NAVIGATION MOIS ────────────────────────────────────────
  prevMonth(): void {
    if (this.isPrevMonthDisabled()) return;
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.resetSelection();
    this.loadAvailableDates();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.resetSelection();
    this.loadAvailableDates();
  }

  /**
   * Va au mois actuel
   */
  goToCurrentMonth(): void {
    this.currentMonth = this.today.getMonth();
    this.currentYear = this.today.getFullYear();
    this.resetSelection();
    this.loadAvailableDates();
  }

  isPrevMonthDisabled(): boolean {
    return this.currentYear  === this.today.getFullYear()
      && this.currentMonth <= this.today.getMonth();
  }

  private resetSelection(): void {
    this.selectedDate    = null;
    this.selectedCreneau = '';
    this.submitError     = '';
  }

  // ── SELECTION DATE ─────────────────────────────────────────
  selectDate(date: Date): void {
    this.selectedDate    = date;
    this.selectedCreneau = '';
    this.submitError     = '';
  }

  // ── CRÉNEAUX ───────────────────────────────────────────────
  /**
   * Vérifie si un créneau est disponible pour la date sélectionnée
   */
  isCreneauDispo(creneau: string): boolean {
    if (!this.selectedDate) return false;
    return this.isCreneauDispoForDate(creneau, this.selectedDate);
  }

  /**
   * Vérifie si c'est le premier créneau disponible
   */
  isFirstAvailableSlot(): boolean {
    if (!this.selectedDate) return false;
    const slots = this.creneauxDispoParDate.get(this.toDateStr(this.selectedDate)) ?? [];
    return slots.length > 0 && this.selectedCreneau === slots[0];
  }

  selectCreneau(creneau: string): void {
    this.selectedCreneau = creneau;
    this.submitError     = '';

    // Parse "09:00-10:00" → heure_debut = "09", heure_fin = "10"
    const [debut, fin]    = creneau.split('-');
    this.form.heure_debut = debut.split(':')[0];
    this.form.heure_fin   = fin.split(':')[0];
  }

  /**
   * Retourne tous les créneaux disponibles pour la date sélectionnée
   */
  getAvailableSlotsForSelectedDate(): string[] {
    if (!this.selectedDate) return [];
    return this.creneauxDispoParDate.get(this.toDateStr(this.selectedDate)) ?? [];
  }

  // ── SUBMIT ─────────────────────────────────────────────────
  onSubmit(): void {
    if (!this.selectedDate || !this.selectedCreneau) return;

    // Vérification côté client avant d'envoyer
    if (!this.isCreneauDispo(this.selectedCreneau)) {
      this.submitError = 'Ce créneau n\'est plus disponible.';
      return;
    }

    this.isSubmitting = true;
    this.submitError  = '';

    const body = {
      localeID:    this.localId,
      date:        this.selectedDate.toISOString(),
      heure_debut: this.form.heure_debut,
      heure_fin:   this.form.heure_fin
    };

    this.http.post(`${API_URL}/VisiteCM/Reserved-visit`, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting  = false;
          this.submitSuccess = true;
        },
        error: (err) => {
          this.isSubmitting = false;
          this.submitError  = err?.error?.message ?? 'Une erreur est survenue. Réessayez.';
        }
      });
  }

  // ── HELPERS ────────────────────────────────────────────────
  isSameDay(a: Date | null, b: Date | null): boolean {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear()
      && a.getMonth()      === b.getMonth()
      && a.getDate()       === b.getDate();
  }

  toDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getHoliday(date: Date): { name: string } | null {
    const f = JOURS_FERIES_MG.find(
      j => j.month === date.getMonth() + 1 && j.day === date.getDate()
    );
    return f ? { name: f.name } : null;
  }

  goBack(): void {
    this.router.navigate(['/locales']);
  }
}
