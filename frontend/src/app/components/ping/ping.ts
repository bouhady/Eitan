import { Component, signal, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-ping',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './ping.html',
})
export class Ping {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  protected readonly loading = signal(false);

  ping() {
    this.loading.set(true);
    this.api.ping().subscribe({
      next: (res) => this.done(res),
      error: () => this.done('request failed'),
    });
  }

  private done(msg: string) {
    this.loading.set(false);
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}
