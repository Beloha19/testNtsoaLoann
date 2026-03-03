import { TestBed } from '@angular/core/testing';

import { CommandeUserService } from './commande-user.service';

describe('CommandeUserService', () => {
  let service: CommandeUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommandeUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
