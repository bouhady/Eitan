import { Component, signal, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { HighHeartRateEvent } from '../../types/patient';

@Component({
  selector: 'app-high-heart-rate-card',
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './high-heart-rate-card.html',
})
export class HighHeartRateCard {
  private api = inject(ApiService);
  protected readonly loading = signal(false);
  protected readonly events = signal<HighHeartRateEvent[]>([]);
  protected readonly error = signal(false);
  protected readonly loaded = signal(false);

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api.getHighHeartRateEvents().subscribe({
      next: (rows) => {
        this.events.set(rows);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
