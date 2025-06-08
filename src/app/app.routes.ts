import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./learning/learning.component').then((c) => c.LearningComponent),
    children: [
      {
        path: '', loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((c) => c.DashboardComponent)
      },
      {
        path: 'profile', loadComponent: () =>
          import('./pages/profile/profile.component').then((c) => c.ProfileComponent)
      },
      {
        path: 'journey', loadComponent: () =>
          import('./pages/journey/journey.component').then((c) => c.JourneyComponent)
      },
      {
        path: 'certifications', loadComponent: () =>
          import('./pages/certifications/certifications.component').then((c) => c.CertificationsComponent)
      },
      {
        path: 'course', loadComponent: () =>
          import('./pages/course/course.component').then((c) => c.CourseComponent)
      },
      {
        path: 'forms', loadComponent: () =>
          import('./pages/forms/forms.component').then((c) => c.FormsComponent)
      },

      {
        path: 'admin',
        //canActivate: [authGuard], // Aplica el guardia a todas las rutas de admin
        children: [
          {
            path: 'users', loadComponent: () =>
              import('./pages/admin/users/users.component').then((c) => c.UsersComponent)
          },
          {
            path: 'courses', loadComponent: () =>
              import('./pages/admin/courses-admin/courses-admin.component').then((c) => c.CoursesAdminComponent)
          },
          {
            path: 'course-content', loadComponent: () =>
              import('./pages/admin/course-content-admin/course-content-admin.component').then((c) => c.CourseContentAdminComponent)
          },
          {
            path: 'course-forms', loadComponent: () =>
              import('./pages/admin/course-forms-admin/course-forms-admin.component').then((c) => c.CourseFormsAdminComponent)
          },
          {
            path: 'assign', loadComponent: () =>
              import('./pages/admin/assign/assign.component').then((c) => c.AssignComponent)
          },
        ],
      },
      {
        path: 'tutor',
        //canActivate: [authGuard], // Aplica el guardia a todas las rutas de admin
        children: [
          {
            path: 'my-courses', loadComponent: () =>
              import('./pages/tutor/courses-tutor/courses-tutor.component').then((c) => c.CoursesTutorComponent)
          },
          {
            path: 'course-content', loadComponent: () =>
              import('./pages/tutor/course-content-tutor/course-content-tutor.component').then((c) => c.CourseContentTutorComponent)
          },
          {
            path: 'course-forms', loadComponent: () =>
              import('./pages/tutor/course-forms-tutor/course-forms-tutor.component').then((c) => c.CourseFormsTutorComponent)
          },
        ],
      },
    ]
  },
  {
    path: 'sig-in',
    loadComponent: () =>
      import('./pages/auth/sig-in/sig-in.component').then((c) => c.SigInComponent)

  },
  {
    path: 'sig-up',
    loadComponent: () =>
      import('./pages/auth/sig-up/sig-up.component').then((c) => c.SigUpComponent)

  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((c) => c.NotFoundComponent),
  }
];

