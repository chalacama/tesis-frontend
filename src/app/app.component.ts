import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/UI/theme.service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'DigiMentor';
  
    ngOnInit() {
      /* const splash = document.getElementById('splash-screen');
  splash?.remove(); */
    }
}
