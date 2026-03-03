export interface PanierItem {
  produitId: string | { _id: string; nom: string; images: string[] };
  quantite: number;
  prixUnitaire: number;
  taille?: string;
}

export interface Panier {
  _id?: string;
  utilisateurId: string;
  items: PanierItem[];
  total: number;
  createdAt?: Date;
  updatedAt?: Date;
}
