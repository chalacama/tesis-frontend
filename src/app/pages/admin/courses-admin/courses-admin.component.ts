import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CoursesComponent } from '../../../shared/components/courses/courses.component';


@Component({
  selector: 'app-courses-admin',
  imports: [ButtonModule,CommonModule,CoursesComponent],
  templateUrl: './courses-admin.component.html',
  styleUrl: './courses-admin.component.css'
})
export class CoursesAdminComponent implements OnInit {
  constructor(public router: Router) {}

  ngOnInit(): void {
    
  }

  
}
