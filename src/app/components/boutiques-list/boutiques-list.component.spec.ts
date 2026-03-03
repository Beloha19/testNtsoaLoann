import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoutiquesListComponent } from './boutiques-list.component';

describe('BoutiquesListComponent', () => {
  let component: BoutiquesListComponent;
  let fixture: ComponentFixture<BoutiquesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoutiquesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoutiquesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
