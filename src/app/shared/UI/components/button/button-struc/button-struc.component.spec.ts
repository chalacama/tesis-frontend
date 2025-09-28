import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonStrucComponent } from './button-struc.component';

describe('ButtonStrucComponent', () => {
  let component: ButtonStrucComponent;
  let fixture: ComponentFixture<ButtonStrucComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonStrucComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonStrucComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
