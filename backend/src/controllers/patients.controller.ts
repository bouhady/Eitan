import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PatientsService } from '../services/patients.service';
import { PaginationDto } from '../dto/pagination.dto';
import { HighHeartRateEventsQueryDto } from '../dto/high-heart-rate-events-query.dto';
import { PatientAnalyticsQueryDto } from '../dto/patient-analytics-query.dto';

/** Thin HTTP layer: DTOs validate shape (global ValidationPipe), the service owns the flow. */
@Controller('api')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get('high-heart-rate-events')
  getHighHeartRateEvents(@Query() query: HighHeartRateEventsQueryDto) {
    return this.patients.getHighHeartRateEvents(query);
  }

  @Get('patient/:id/analytics')
  getAnalytics(@Param('id', ParseIntPipe) id: number, @Query() query: PatientAnalyticsQueryDto) {
    return this.patients.getAnalytics(id, query);
  }

  @Get('patient/:id/tracking')
  getTracking(@Param('id', ParseIntPipe) id: number) {
    return this.patients.getTracking(id);
  }
}
