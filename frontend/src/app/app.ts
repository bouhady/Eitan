import { Component } from '@angular/core';
import { Ping } from './components/ping/ping';
import { PatientsCard } from './components/patients-card/patients-card';
import { HeartRateCard } from './components/heart-rate-card/heart-rate-card';
import { HighHeartRateCard } from './components/high-heart-rate-card/high-heart-rate-card';
import { AnalyticsCard } from './components/analytics-card/analytics-card';
import { TrackingCard } from './components/tracking-card/tracking-card';

@Component({
  selector: 'app-root',
  imports: [Ping, PatientsCard, HeartRateCard, HighHeartRateCard, AnalyticsCard, TrackingCard],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
