import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-portfolio',
  imports: [],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent implements OnInit {
 constructor( private router: Router){

 }
ngOnInit(): void {
  
}
  goToCourses(){
    this.router.navigate(['/studio/courses']);
  }
}
