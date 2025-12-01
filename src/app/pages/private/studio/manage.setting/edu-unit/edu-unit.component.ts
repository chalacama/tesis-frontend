import { Component } from '@angular/core';
import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { LandingComponent } from '../../../../public/landing/landing.component';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';

@Component({
  selector: 'app-edu-unit',
  imports: [IconComponent , LandingComponent, ToastComponent],
  templateUrl: './edu-unit.component.html',
  styleUrl: './edu-unit.component.css'
})
export class EduUnitComponent {
  
}
