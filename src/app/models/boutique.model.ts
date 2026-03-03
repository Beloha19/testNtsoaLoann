import {Categorie} from './categorie.model';

export interface Local {
  _id: string;
  nom_local: string;
  avantage: string[];
  description?: string;
  surface?: number;
  emplacement: 'Emplacement FC' | 'Emplacement OS' | 'Emplacement Ev' | 'Emplacement Str-RDC' | 'Emplacement Str-1Etg';
  loyer?: number;
  image?: string;
  etat_boutique: 'disponible' | 'louée' | 'maintenance';
  categorie: 'Pop-up-store' | 'Open-space' | 'Evenementiel' | 'Food-court';
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Horaire {
  jour: string;
  is_open: boolean;
  ouverture?: string;
  fermeture?: string;
}

export interface Boutique {
  _id: string;
  utilisateurId: string;
  local: Local;
  nom: string;
  description?: string;
  telephone: string;
  logo?: string;
  categorie: Categorie;
  horaires: Horaire[];
  is_active: boolean;
  inscription: Date;
}
