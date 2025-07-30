import { ApplicationRef, Component, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter, first } from 'rxjs';



@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'DigiMentor';
  
    constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private appRef: ApplicationRef,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngOnInit(): void {
   
  }
}
