import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseFormsTutorComponent } from './course-forms-tutor.component';

describe('CourseFormsTutorComponent', () => {
  let component: CourseFormsTutorComponent;
  let fixture: ComponentFixture<CourseFormsTutorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseFormsTutorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseFormsTutorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
