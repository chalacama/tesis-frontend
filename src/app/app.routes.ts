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
  path: 'results',
  loadComponent: () => import('./pages/private/learning/result/result.component').then(c => c.ResultComponent)
}
,
      {
        path: 'me',
        loadComponent: () => import('./pages/private/learning/path/path.component').then((c) => c.PathComponent),
        children: [
            {
            path: 'historial',
            loadComponent: () => import('./pages/private/learning/path/history/history.component').then((c) => c.HistoryComponent)
            },
            {
              path: 'completados',
              loadComponent: () => import('./pages/private/learning/path/history/history.component').then((c) => c.HistoryComponent)
            },
            {
              path: 'guardados',
              loadComponent: () => import('./pages/private/learning/path/history/history.component').then((c) => c.HistoryComponent)
            },
          ]
      },
      {
        path: 'certification',
        loadComponent: () => import('./pages/private/learning/certification/certification.component').then((c) => c.CertificationComponent)
      },
      {
  path: 'profile',
  loadComponent: () =>
    import('./pages/private/learning/profile/profile.component').then(c => c.ProfileComponent),
  children: [
    { path: '', pathMatch: 'full', redirectTo: 'information' }, // ← default
    {
      path: 'information',
      loadComponent: () =>
        import('./pages/private/learning/profile/information/information.component')
          .then(c => c.InformationComponent),
    },
    {
      path: 'education',
      loadComponent: () =>
        import('./pages/private/learning/profile/education/education.component')
          .then(c => c.EducationComponent),
    },
  ],
}
,
      
      {
      path: 'course/:title/:id/:chapterTitle/:chapterId',
      loadComponent: () =>
        import('./pages/private/learning/course/course.component')
          .then(c => c.CourseComponent),
           children: [
            {
              path: 'content',
              loadComponent: () => import('./pages/private/learning/course/content/content.component').then((c) => c.ContentComponent)
            },
            {
              path: 'test',
              loadComponent: () => import('./pages/private/learning/course/test/test.component').then((c) => c.TestComponent)
            }
           ]
    },
    // 2) NUEVA ruta corta sin capítulo (para entrar desde Home)
    {
      path: 'course/:title/:id',
      loadComponent: () =>
        import('./pages/private/learning/course/course.component')
          .then(c => c.CourseComponent)
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
        loadComponent: () => import('./pages/private/studio/studio.component').then((c) => c.StudioComponent),
        children: [
          {
            path: 'courses',
            loadComponent: () => import('./pages/private/studio/manage.courses/courses/courses.component').then((c) => c.CoursesComponent),
            title: 'Mis Cursos'
          },
          {
            path: 'panel',
            loadComponent: () => import('./pages/private/studio/manage.courses/panel/panel.component').then((c) => c.PanelComponent),
            title: 'Mi panel'
          },
          {
            path: 'users',
            canActivate: [adminGuard],
            loadComponent: () => import('./pages/private/studio/manage.users/users/users.component').then((c) => c.UsersComponent)
          },
        ]
      },
      {
        path: 'studio/:username',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/private/studio/studio.component').then(c => c.StudioComponent),
        children: [
          {
            path: 'courses',
            loadComponent: () => import('./pages/private/studio/manage.courses/courses/courses.component').then((c) => c.CoursesComponent),
            title: 'Cursos del Tutor'
          },
          {
            path: 'panel',
            loadComponent: () => import('./pages/private/studio/manage.courses/panel/panel.component').then((c) => c.PanelComponent),
            title: 'Panel del Tutor'
          },
        ]
        
      },
      {
        path: 'studio/:id',
        canActivate: [studioGuard],
        loadComponent: () => import('./pages/private/studio/studio.component').then((c) => c.StudioComponent),
        children: [
        {
          path: 'details',
        loadComponent: () => import('./pages/private/studio/manage.course/details/details.component').then((c) => c.DetailsComponent),
        },
        {
          path: 'modules',
        loadComponent: () => import('./pages/private/studio/manage.course/module/module.component').then((c) => c.ModuleComponent),
        
        },
        {
            path: 'module/:module/chapter/:chapter',
            loadComponent: () => import('./pages/private/studio/manage.course/module/chapter/chapter.component').then((c) => c.ChapterComponent),
            // children: [
            //   {
            //     path: 'content',
            //     loadComponent: () => import('./pages/private/studio/manage.course/module/chapter/content-learning/content-learning.component').then((c) => c.ContentLearningComponent)
            //   },
            //   {
            //     path: 'test',
            //     loadComponent: () => import('./pages/private/studio/manage.course/module/chapter/test/test.component').then((c) => c.TestComponent)
            //   }
            // ]
        },
        {
          path: 'analytic',
        loadComponent: () => import('./pages/private/studio/manage.course/analytic/analytic.component').then((c) => c.AnalyticComponent),
        }
        ]
      },
      {
        path: 'studio/:username/:id',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/private/studio/studio.component').then((c) => c.StudioComponent),
        children: [
        {
          path: 'details',
        loadComponent: () => import('./pages/private/studio/manage.course/details/details.component').then((c) => c.DetailsComponent),
        },
        {
          path: 'modules',
        loadComponent: () => import('./pages/private/studio/manage.course/module/module.component').then((c) => c.ModuleComponent),
        },
        {
          path: 'analytic',
        loadComponent: () => import('./pages/private/studio/manage.course/analytic/analytic.component').then((c) => c.AnalyticComponent),
        }
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