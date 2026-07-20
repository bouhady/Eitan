import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  protected readonly loading = signal(false);

  ping() {
    this.loading.set(true);
    this.http.get('http://localhost:3000/ping', { responseType: 'text' }).subscribe({
      next: (res) => this.done(res),
      error: () => this.done('request failed'),
    });
  }

  private done(msg: string) {
    this.loading.set(false);
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}
