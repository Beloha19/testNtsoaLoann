import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandeAttenteComponent } from './vente-attente.component';

describe('CommandeAttenteComponent', () => {
  let component: CommandeAttenteComponent;
  let fixture: ComponentFixture<CommandeAttenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandeAttenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommandeAttenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
