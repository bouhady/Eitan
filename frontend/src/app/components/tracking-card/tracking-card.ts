import { Component, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { PatientRequestTracking } from '../../types/patient';

@Component({
  selector: 'app-tracking-card',
  imports: [DatePipe, FormsModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './tracking-card.html',
  styleUrl: '../analytics-card/analytics-card.css',
})
export class TrackingCard {
  private api = inject(ApiService);
  protected readonly loading = signal(false);
  protected readonly result = signal<PatientRequestTracking | null>(null);
  protected readonly error = signal('');

  protected patientId = 1;

  load() {
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);
    this.api.getPatientTracking(this.patientId).subscribe({
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
