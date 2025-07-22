import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']  // corregí de styleUrl a styleUrls (plural)
})
export class LandingComponent {
  constructor(private router: Router) {}

  goToAuth() {
    this.router.navigate(['/auth']);
  }
}
