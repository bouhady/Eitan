import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { HeartRateReading } from '../../types/patient';
import { PagedCard } from '../paged-card';

@Component({
  selector: 'app-heart-rate-card',
  imports: [FormsModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './heart-rate-card.html',
  styleUrl: '../analytics-card/analytics-card.css',
})
export class HeartRateCard extends PagedCard<HeartRateReading> {
  private api = inject(ApiService);
  protected override limit = 3; // small default so paging is visible on the seed data

  protected fetch(limit: number, offset: number) {
    return this.api.getHeartRateReadings(limit, offset);
  }
}
