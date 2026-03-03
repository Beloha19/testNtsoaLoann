export interface SousCategorie {
  _id: string;
  nom: string;
  categorieId: string;
  typesProduits?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
