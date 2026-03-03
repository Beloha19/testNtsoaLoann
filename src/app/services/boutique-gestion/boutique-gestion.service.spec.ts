import { TestBed } from '@angular/core/testing';

import { BoutiqueGestionService } from './boutique-gestion.service';

describe('BoutiqueGestionService', () => {
  let service: BoutiqueGestionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoutiqueGestionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
