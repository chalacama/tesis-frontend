import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/private/learning/learning.component').then((c) => c.LearningComponent),
    children: [
      {
        path: '', loadComponent: () =>
          import('./pages/private/learning/home/home.component').then((c) => c.HomeComponent)
      },
      {
        path: 'path', loadComponent: () =>
          import('./pages/private/learning/path/path.component').then((c) => c.PathComponent)
      },
      {
        path: 'certification', loadComponent: () =>
          import('./pages/private/learning/certification/certification.component').then((c) => c.CertificationComponent)
      },
      {
        path: 'manage',
        children: [
          {
            path: 'courses', loadComponent: () =>
              import('./pages/private/learning/manage/courses/courses.component').then((c) => c.CoursesComponent)
          },
          {
            path: 'users', loadComponent: () =>
              import('./pages/private/learning/manage/users/users.component').then((c) => c.UsersComponent)
          },
        ]
      }

    ]
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/public/auth/auth.component').then((c) => c.AuthComponent)

  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/public/auth/auth.component').then((c) => c.AuthComponent)

  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/public/not-found/not-found.component').then((c) => c.NotFoundComponent),
  }
];
