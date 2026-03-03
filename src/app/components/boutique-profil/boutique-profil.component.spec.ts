import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoutiqueProfilComponent } from './boutique-profil.component';

describe('BoutiqueProfilComponent', () => {
  let component: BoutiqueProfilComponent;
  let fixture: ComponentFixture<BoutiqueProfilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoutiqueProfilComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoutiqueProfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
