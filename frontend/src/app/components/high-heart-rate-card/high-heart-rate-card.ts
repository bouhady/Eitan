import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { HighHeartRateEvent } from '../../types/patient';
import { PagedCard } from '../paged-card';

@Component({
  selector: 'app-high-heart-rate-card',
  imports: [FormsModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './high-heart-rate-card.html',
  styleUrl: '../analytics-card/analytics-card.css',
})
export class HighHeartRateCard extends PagedCard<HighHeartRateEvent> {
  private api = inject(ApiService);
  protected threshold = 100;

  protected fetch(limit: number, offset: number) {
    return this.api.getHighHeartRateEvents(this.threshold, limit, offset);
  }
}
