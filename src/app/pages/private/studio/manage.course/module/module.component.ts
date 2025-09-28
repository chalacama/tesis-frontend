import { Component } from '@angular/core';
import { SidebarComponent } from '../../../../../shared/UI/components/overlay/sidebar/sidebar.component';

@Component({
  selector: 'app-module',
  imports: [
    SidebarComponent
  ],
  templateUrl: './module.component.html',
  styleUrl: './module.component.css'
})
export class ModuleComponent {
  
  sidebarOpen = true;
  sidebarMin=false;
}
