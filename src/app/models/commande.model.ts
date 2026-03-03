export interface ArticleCommande {
  produitId: { _id: string; nom: string; images: string[] };
  quantite: number;
  prixUnitaire: number;
  taille?: string;
}

export interface Commande {
  _id: string;
  utilisateurId: string;
  articles: ArticleCommande[];
  total: number;
  statut: string;
  typeLivraison: 'retrait' | 'livraison';
  adresseLivraison?: string;
  telephoneContact?: string;
  dateCommande: Date;
}
