// pages/private/studio/manage.course/module/chapter/chapter.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

type TabKey = 'detail' | 'content' | 'test';

@Component({
  selector: 'app-chapter',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './chapter.component.html',
  styleUrl: './chapter.component.css'
})
export class ChapterComponent {
  tabs = [
    { key: 'detail' as TabKey, label: 'Detalles',  path: 'detail'  },
    { key: 'content' as TabKey, label: 'Contenido', path: 'content' },
    { key: 'test' as TabKey, label: 'Test',        path: 'test'    },
  ];
}
