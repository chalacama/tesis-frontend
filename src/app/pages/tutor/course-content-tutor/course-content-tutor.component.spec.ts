import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseContentTutorComponent } from './course-content-tutor.component';

describe('CourseContentTutorComponent', () => {
  let component: CourseContentTutorComponent;
  let fixture: ComponentFixture<CourseContentTutorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseContentTutorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseContentTutorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
