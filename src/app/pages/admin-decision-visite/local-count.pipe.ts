import { Pipe, PipeTransform } from '@angular/core';
import { Visite } from './admin-decision-visite.component';

@Pipe({ name: 'localCount', standalone: true })
export class LocalCountPipe implements PipeTransform {
  transform(visites: Visite[], localId: string, enAttenteOnly: boolean): number {
    return visites.filter(v => {
      const matchLocal = v.localeID?._id === localId;
      const matchStatut = enAttenteOnly ? v.statut === 'en attente de confirmation' : true;
      return matchLocal && matchStatut;
    }).length;
  }
}
