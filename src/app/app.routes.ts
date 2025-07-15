import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/private/learning/learning.component').then((c) => c.LearningComponent),
    children: [
      {
        path: '', loadComponent: () =>
          import('./pages/private/learning/dashboard/dashboard.component').then((c) => c.DashboardComponent)
      },
      {
        path: 'profile', loadComponent: () =>
          import('./pages/private/learning/profile/profile.component').then((c) => c.ProfileComponent)
      },
      {
        path: 'journey', loadComponent: () =>
          import('./pages/private/learning/journey/journey.component').then((c) => c.JourneyComponent)
      },
      {
        path: 'certifications', loadComponent: () =>
          import('./pages/private/learning/certifications/certifications.component').then((c) => c.CertificationsComponent)
      },
      {
        path: 'course', loadComponent: () =>
          import('./pages/private/learning/course/course.component').then((c) => c.CourseComponent)
      },
      {
        path: 'manage',
        //canActivate: [authGuard], // Aplica el guardia a todas las rutas de admin
        children: [
          {
            path: 'users', loadComponent: () =>
              import('./pages/private/learning/manage/users/users.component').then((c) => c.UsersComponent)
          },
          {
            path: 'courses', loadComponent: () =>
              import('./pages/private/learning/manage/courses/courses.component').then((c) => c.CoursesComponent)
          },
          {
            path: 'edit-course', loadComponent: () =>
              import('./pages/private/learning/manage/edit-course/edit-course.component').then((c) => c.EditCourseComponent)
          },
          
        ],
      },
    ]
  },
  {
    path: 'sig-in',
    loadComponent: () =>
      import('./pages/public/auth/sig-in/sig-in.component').then((c) => c.SigInComponent)

  },
  {
    path: 'sig-up',
    loadComponent: () =>
      import('./pages/public/auth/sig-up/sig-up.component').then((c) => c.SigUpComponent)

  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/public/not-found/not-found.component').then((c) => c.NotFoundComponent),
  }
];

