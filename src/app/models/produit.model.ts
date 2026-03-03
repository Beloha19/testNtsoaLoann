export interface Produit {
  _id: string;
  boutiqueId: string;
  reference: string;
  nom: string;
  description?: string;
  prix: number;
  images: string[];
  categorieId: string | { _id: string; nom: string }; // ← Union type
  sousCategorieId: string | { _id: string; nom: string }; // ← Union type
  isDispo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  categorie?: { _id: string; nom: string };
  sousCategorie?: { _id: string; nom: string };
}
