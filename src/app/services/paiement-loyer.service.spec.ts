import { TestBed } from '@angular/core/testing';

import { PaiementLoyerService } from './paiement-loyer.service';

describe('PaiementLoyerService', () => {
  let service: PaiementLoyerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaiementLoyerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
