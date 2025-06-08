import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseContentAdminComponent } from './course-content-admin.component';

describe('CourseContentAdminComponent', () => {
  let component: CourseContentAdminComponent;
  let fixture: ComponentFixture<CourseContentAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseContentAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseContentAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
