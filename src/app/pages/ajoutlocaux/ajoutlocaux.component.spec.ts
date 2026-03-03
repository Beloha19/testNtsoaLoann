import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutlocauxComponent } from './ajoutlocaux.component';

describe('AjoutlocauxComponent', () => {
  let component: AjoutlocauxComponent;
  let fixture: ComponentFixture<AjoutlocauxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjoutlocauxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjoutlocauxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
