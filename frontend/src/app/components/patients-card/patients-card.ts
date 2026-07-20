import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { Patient } from '../../types/patient';
import { PagedCard } from '../paged-card';

@Component({
  selector: 'app-patients-card',
  imports: [FormsModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './patients-card.html',
  styleUrl: '../analytics-card/analytics-card.css',
})
export class PatientsCard extends PagedCard<Patient> {
  private api = inject(ApiService);

  protected fetch(limit: number, offset: number) {
    return this.api.getPatients(limit, offset);
  }
}
