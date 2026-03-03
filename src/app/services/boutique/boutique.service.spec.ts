import { TestBed } from '@angular/core/testing';

import { BoutiqueService } from './boutique.service';

describe('BoutiqueService', () => {
  let service: BoutiqueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoutiqueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
