import { Component } from '@angular/core';
import { Ping } from './components/ping/ping';
import { PatientsCard } from './components/patients-card/patients-card';
import { HeartRateCard } from './components/heart-rate-card/heart-rate-card';

@Component({
  selector: 'app-root',
  imports: [Ping, PatientsCard, HeartRateCard],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
