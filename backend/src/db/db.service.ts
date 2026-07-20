import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Patient, HeartRateReading } from '../types/patient';

@Injectable()
export class DbService {
  private pool = new Pool(); // reads PGHOST/PGUSER/PGPASSWORD/PGDATABASE from env

  async getPatients(): Promise<Patient[]> {
    const { rows } = await this.pool.query('SELECT * FROM patients');
    return rows as Patient[];
  }

  async getHeartRateReadings(): Promise<HeartRateReading[]> {
    const { rows } = await this.pool.query('SELECT * FROM "heartRateReadings"');
    return rows as HeartRateReading[];
  }
}
