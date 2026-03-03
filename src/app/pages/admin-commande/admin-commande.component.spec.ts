import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCommandeComponent } from './admin-commande.component';

describe('AdminCommandeComponent', () => {
  let component: AdminCommandeComponent;
  let fixture: ComponentFixture<AdminCommandeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCommandeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCommandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
