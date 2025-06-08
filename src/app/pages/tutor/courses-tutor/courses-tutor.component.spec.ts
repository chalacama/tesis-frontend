import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursesTutorComponent } from './courses-tutor.component';

describe('CoursesTutorComponent', () => {
  let component: CoursesTutorComponent;
  let fixture: ComponentFixture<CoursesTutorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursesTutorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoursesTutorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
