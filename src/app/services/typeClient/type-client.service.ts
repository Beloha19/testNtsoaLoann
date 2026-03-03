import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TypeClient {
  _id: string;
  typeClientex: string;
}

@Injectable({
  providedIn: 'root'
})
export class TypeClientService {
  private apiUrl = 'http://localhost:5000/typeClient/listeTypeClient';

  constructor(private http: HttpClient) {}

  getTypes(): Observable<TypeClient[]> {
    return this.http.get<TypeClient[]>(this.apiUrl);
  }
}
