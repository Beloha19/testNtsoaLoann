import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPaiementsComponent } from './admin-paiements.component';

describe('AdminPaiementsComponent', () => {
  let component: AdminPaiementsComponent;
  let fixture: ComponentFixture<AdminPaiementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPaiementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPaiementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
