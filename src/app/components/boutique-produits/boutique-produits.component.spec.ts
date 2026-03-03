import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoutiqueProduitsComponent } from './boutique-produits.component';

describe('BoutiqueProduitsComponent', () => {
  let component: BoutiqueProduitsComponent;
  let fixture: ComponentFixture<BoutiqueProduitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoutiqueProduitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoutiqueProduitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
