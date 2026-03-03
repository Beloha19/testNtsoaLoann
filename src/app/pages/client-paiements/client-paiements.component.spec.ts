import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientPaiementsComponent } from './client-paiements.component';

describe('ClientPaiementsComponent', () => {
  let component: ClientPaiementsComponent;
  let fixture: ComponentFixture<ClientPaiementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientPaiementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientPaiementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
