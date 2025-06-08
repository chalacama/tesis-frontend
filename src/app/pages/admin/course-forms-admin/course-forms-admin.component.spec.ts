import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseFormsAdminComponent } from './course-forms-admin.component';

describe('CourseFormsAdminComponent', () => {
  let component: CourseFormsAdminComponent;
  let fixture: ComponentFixture<CourseFormsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseFormsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseFormsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
