import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';
import { studioGuard } from './core/guards/studio.guard';

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
      {
        path: 'course/:id',
        loadComponent: () => import('./pages/private/learning/course/course.component').then((c) => c.CourseComponent)
      },
      {
        path: 'portfolio/:username',
        loadComponent: () => import('./pages/private/learning/portfolio/portfolio.component').then((c) => c.PortfolioComponent)
      },
      ]
      },      
      {
        path: 'studio',
        canActivate: [studioGuard],
        loadComponent: () => import('./pages/private/studio/panel.courses/panel.courses.component').then((c) => c.PanelCoursesComponent),
        children: [
          {
            path: 'courses',
            loadComponent: () => import('./pages/private/studio/panel.courses/courses/courses.component').then((c) => c.CoursesComponent),
            title: 'Mis Cursos'
          },
        ]
      },
      {
        path: 'studio/:username',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/private/studio/panel.courses/panel.courses.component').then(c => c.PanelCoursesComponent),
        children: [
          {
            path: 'courses',
            loadComponent: () => import('./pages/private/studio/panel.courses/courses/courses.component').then((c) => c.CoursesComponent),
            title: 'Cursos del Tutor'
          },
        ]
        
      },
      {
        path: 'studio/:id',
        canActivate: [studioGuard],
        loadComponent: () => import('./pages/private/studio/panel.course/panel.course.component').then((c) => c.PanelCourseComponent),
        children: [
        {
          path: 'details',
        loadComponent: () => import('./pages/private/studio/panel.course/details/details.component').then((c) => c.DetailsComponent),
        }
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