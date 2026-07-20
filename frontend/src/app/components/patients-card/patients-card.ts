import { Component, signal, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { Patient } from '../../types/patient';

@Component({
  selector: 'app-patients-card',
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './patients-card.html',
})
export class PatientsCard {
  private api = inject(ApiService);
  protected readonly loading = signal(false);
  protected readonly patients = signal<Patient[]>([]);
  protected readonly error = signal(false);

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api.getPatients().subscribe({
      next: (rows) => {
        this.patients.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
