import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/public/landing/landing.component').then((c) => c.LandingComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children:[
      {
      path: 'learning',
      /* canActivate: [authGuard], */
      loadComponent: () => import('./pages/private/learning/learning.component').then((c) => c.LearningComponent),
      children: [
      {
        path: '',
        loadComponent: () => import('./pages/private/learning/home/home.component').then((c) => c.HomeComponent)
      },
      {
        path: 'path',
        loadComponent: () => import('./pages/private/learning/path/path.component').then((c) => c.PathComponent)
      },
      {
        path: 'certification',
        loadComponent: () => import('./pages/private/learning/certification/certification.component').then((c) => c.CertificationComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/private/learning/profile/profile.component').then((c) => c.ProfileComponent)
      },
      ]
      },
      {
      path: 'studio',
      children: [
      {
        path: 'courses',
        loadComponent: () => import('./pages/private/studio/courses/courses.component').then((c) => c.CoursesComponent)
      },
      ]
  },
  {
    path: 'manage',
    children: [
      {
        path: 'users',
        loadComponent: () => import('./pages/private/manage/users/users.component').then((c) => c.UsersComponent)
      },
    ]
  },
    ]

  },
  
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/public/auth/auth.component').then((c) => c.AuthComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/public/not-found/not-found.component').then((c) => c.NotFoundComponent),
  }
];