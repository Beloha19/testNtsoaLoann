import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientContratComponent } from './client-contrat.component';

describe('ClientContratComponent', () => {
  let component: ClientContratComponent;
  let fixture: ComponentFixture<ClientContratComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientContratComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientContratComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
