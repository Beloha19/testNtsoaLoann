import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VenteBoutiqueComponent } from './vente-boutique.component';

describe('VenteBoutiqueComponent', () => {
  let component: VenteBoutiqueComponent;
  let fixture: ComponentFixture<VenteBoutiqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VenteBoutiqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VenteBoutiqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
