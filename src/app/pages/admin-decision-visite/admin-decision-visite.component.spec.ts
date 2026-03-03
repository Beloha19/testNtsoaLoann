import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDecisionVisiteComponent } from './admin-decision-visite.component';

describe('AdminDecisionVisiteComponent', () => {
  let component: AdminDecisionVisiteComponent;
  let fixture: ComponentFixture<AdminDecisionVisiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDecisionVisiteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDecisionVisiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
