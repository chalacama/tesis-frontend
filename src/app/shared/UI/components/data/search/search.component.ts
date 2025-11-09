import { Component, DestroyRef, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith, switchMap, tap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { IconComponent } from '../../button/icon/icon.component';
import { StartService } from '../../../../../core/api/start/start.service';
import { SuggestionItem } from '../../../../../core/api/start/suggestion.interface';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']   // <- usar styleUrls
})
export class SearchComponent {
  private router = inject(Router);
  private start = inject(StartService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('panel', { static: false }) panelRef?: ElementRef<HTMLElement>;

  control = new FormControl<string>('', { nonNullable: true });
  suggestions: SuggestionItem[] = [];
  open = false;
  loading = false;
  activeIndex = -1;

  // id para aria-controls
  listboxId = 'search-suggestions';

  constructor() {
   this.control.valueChanges.pipe(
  startWith(this.control.value),
  debounceTime(180),
  distinctUntilChanged(),
  // ANTES: tap(() => { this.loading = true; this.open = true; }),
  tap(() => { this.loading = true; /* no abrir aquí */ }),
  switchMap(q =>
    this.start.getSuggestionByFilter(q ?? '', 10).pipe(
      catchError(() => of({ suggestions: [] }))
    )
  ),
  tap(res => {
    this.suggestions = res.suggestions ?? [];
    this.activeIndex = this.suggestions.length ? 0 : -1;
    this.loading = false;
  }),
  takeUntilDestroyed(this.destroyRef)
).subscribe();

  }

  onFocus() {
    this.open = true;
    if (!this.control.value || this.control.value.trim() === '') {
      this.control.setValue('', { emitEvent: true });
    }
  }

  onKeyDown(ev: KeyboardEvent) {
    if (!this.open && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      this.open = true;
    }

    if (!this.suggestions.length) {
      if (ev.key === 'Enter') this.submit();
      return;
    }

    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % this.suggestions.length;
      this.scrollToActive();
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + this.suggestions.length) % this.suggestions.length;
      this.scrollToActive();
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      const active = this.suggestions[this.activeIndex];
      if (active) this.select(active);
      else this.submit();
    } else if (ev.key === 'Escape') {
      this.open = false;
    }
  }

  select(item: SuggestionItem) {
    const q = (item.text || '').trim();
    if (!q) return;
    this.start.updateSuggestion(q).subscribe();
    this.open = false;
    this.router.navigate(['/learning/results'], { queryParams: { q } });
  }

  submit() {
    const q = (this.control.value || '').trim();
    if (!q) return;
    this.start.updateSuggestion(q).subscribe();
    this.open = false;
    this.router.navigate(['/learning/results'], { queryParams: { q } });
  }

  clear() {
    this.control.setValue('');
    this.searchInput.nativeElement.focus();
  }

  trackByText = (_: number, it: SuggestionItem) => it.text;

  private scrollToActive() {
    queueMicrotask(() => {
      const panel = this.panelRef?.nativeElement;
      if (!panel) return;
      const items = panel.querySelectorAll<HTMLElement>('.suggestion-item');
      const el = items[this.activeIndex];
      if (!el) return;
      const { offsetTop, offsetHeight } = el;
      const { scrollTop, clientHeight } = panel;
      if (offsetTop < scrollTop) panel.scrollTop = offsetTop;
      else if (offsetTop + offsetHeight > scrollTop + clientHeight) {
        panel.scrollTop = offsetTop + offsetHeight - clientHeight;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    const host = (this.searchInput?.nativeElement?.closest('.search-wrap')) as HTMLElement | null;
    if (host && !host.contains(target)) {
      this.open = false;
    }
  }
}
