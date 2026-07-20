import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Paginated } from '../types/patient';

/** Shared load/prev/next state for the paginated list cards. */
export abstract class PagedCard<T> {
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly page = signal<Paginated<T> | null>(null);
  protected limit = 25;

  protected abstract fetch(limit: number, offset: number): Observable<Paginated<T>>;

  load(offset = 0) {
    this.loading.set(true);
    this.error.set('');
    this.fetch(this.limit, offset).subscribe({
      next: (p) => {
        this.page.set(p);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'request failed');
        this.loading.set(false);
      },
    });
  }

  next() {
    const p = this.page();
    if (p?.hasMore) this.load(p.offset + p.limit);
  }

  prev() {
    const p = this.page();
    if (p && p.offset > 0) this.load(Math.max(0, p.offset - p.limit));
  }
}
