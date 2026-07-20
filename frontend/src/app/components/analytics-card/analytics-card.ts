import { Component, signal, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { HeartRateAnalytics } from '../../types/patient';

@Component({
  selector: 'app-analytics-card',
  imports: [DecimalPipe, FormsModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './analytics-card.html',
  styleUrl: './analytics-card.css',
})
export class AnalyticsCard {
  private api = inject(ApiService);
  protected readonly loading = signal(false);
  protected readonly result = signal<HeartRateAnalytics | null>(null);
  protected readonly error = signal('');

  // prefilled to match the seed data range
  protected patientId = 1;
  protected from = '2024-03-01T00:00';
  protected to = '2024-03-03T00:00';

  load() {
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);
    this.api
      .getPatientAnalytics(
        this.patientId,
        new Date(this.from).toISOString(),
        new Date(this.to).toISOString(),
      )
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'request failed');
          this.loading.set(false);
        },
      });
  }
}
