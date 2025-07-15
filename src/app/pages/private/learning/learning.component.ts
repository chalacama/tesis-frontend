import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { MenuItem, MessageService } from 'primeng/api';
import { TieredMenu } from 'primeng/tieredmenu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { Router } from '@angular/router';
import { PanelMenu } from 'primeng/panelmenu';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-learning',
  imports: [RouterOutlet, BadgeModule,
    AvatarModule, InputTextModule, CommonModule, ButtonModule, CardModule, RippleModule, TieredMenu, PanelMenuModule, PanelMenu, RouterModule],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.css',
  providers: [MessageService]
})
export class LearningComponent implements OnInit {
  visible: boolean = false;
  manageItems: MenuItem[] | undefined;
  items: MenuItem[] | undefined;
  isDarkMode: boolean = false;

  isMobile: boolean = false;
  constructor(public router: Router) {
    /* this.router.routeReuseStrategy.shouldReuseRoute = () => false; */
  }
  ngOnInit() {
    let darkMode = false;
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (isBrowser && window.localStorage) {
      darkMode = localStorage.getItem('darkMode') === 'true';
      this.isDarkMode = darkMode;
      const element = document.querySelector('html');
      if (element != null) {
        if (darkMode) {
          element.classList.add('my-app-dark');
        } else {
          element.classList.remove('my-app-dark');
        }
      }
    }
    /* this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
      if (this.isMobile) this.visible = false; // Cierra el drawer si cambia a móvil
    }); */
    
    this.manageItems = [
      {
        label: 'User',
        icon: 'pi pi-user',
        command: () => {
          this.router.navigate(['/manage/users']);
        }
      },
      {
        label: 'Cursos',
        icon: 'pi pi-video',
        command: () => {
          this.router.navigate(['/manage/courses']);
        }
      },

    ];
    this.items = [
      {
        label: 'inicio',
        icon: 'pi pi-home',
        command: () => {
          this.router.navigate(['']);
        }
      },
      {
        label: 'Trayecto',
        icon: 'pi pi-map',
        command: () => {
          this.router.navigate(['/journey']);
        }
      },
      {
        label: 'Certificados',
        icon: 'pi pi-graduation-cap',
        command: () => {
          this.router.navigate(['/certifications']);
        }
      },
      {
        label: 'Gestión',
        icon: 'pi pi-code',
        items: [
          {
            label: 'Users',
            icon: 'pi pi-users',
            command: () => {
              this.router.navigate(['/manage/users']);
            }
          },
          {
            label: 'Cursos',
            icon: 'pi pi-video',
            command: () => {
              this.router.navigate(['/manage/courses']);
            }
          }
        ]
      }
    ];

  }


  toggleDarkMode() {
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (isBrowser) {
      const element = document.querySelector('html');
      if (element != null) {
        element.classList.toggle('my-app-dark');
        this.isDarkMode = element.classList.contains('my-app-dark');
        if (window.localStorage) {
          localStorage.setItem('darkMode', this.isDarkMode ? 'true' : 'false');
        }
      }
    }
  }
}
