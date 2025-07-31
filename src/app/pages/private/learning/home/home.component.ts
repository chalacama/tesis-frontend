import { Component, OnInit,HostListener, ElementRef, ViewChild } from '@angular/core';
import { Course } from '../../../../core/api/start/start.interfaces';
import { StartService } from '../../../../core/api/start/start.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  courses : Course[] = [];
  filter: string = 'all';
  page: number = 1;
  perPage: number = 9;
  hasMore: boolean = true;
  loading: boolean = false;
  constructor(private startService: StartService) {}

  ngOnInit(): void {
    this.loadCourses();
  }
  loadCourses(): void {
    if (this.loading || !this.hasMore) return;

    this.loading = true;

    this.startService.getCoursesByFilter({
      filter: this.filter,
      page: this.page,
      per_page: this.perPage
    }).subscribe({
      next: (res) => {
        this.courses.push(...res.courses);
        this.page++;
        this.hasMore = res.has_more;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar cursos:', err);
        this.loading = false;
      }
    });
  }

  changeFilter(newFilter: string): void {
    if (this.filter === newFilter) return; // evita recarga innecesaria
    this.filter = newFilter;
    this.page = 1;
    this.hasMore = true;
    this.courses = [];
    this.loadCourses();
  }

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

onContainerScroll(): void {
  const container = this.scrollContainer.nativeElement;
  const scrollThreshold = 100;

  const scrollPos = container.scrollTop + container.clientHeight;
  const scrollHeight = container.scrollHeight;

  if (scrollHeight - scrollPos < scrollThreshold) {
    this.loadCourses();
  }
}

}
