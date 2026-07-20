import { Component, signal, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { HeartRateReading } from '../../types/patient';

@Component({
  selector: 'app-heart-rate-card',
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './heart-rate-card.html',
})
export class HeartRateCard {
  private api = inject(ApiService);
  protected readonly loading = signal(false);
  protected readonly readings = signal<HeartRateReading[]>([]);
  protected readonly error = signal(false);

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api.getHeartRateReadings().subscribe({
      next: (rows) => {
        this.readings.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
