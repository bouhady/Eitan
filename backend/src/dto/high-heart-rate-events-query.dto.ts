import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { HIGH_HEART_RATE_THRESHOLD } from '../db/db.service';

export class HighHeartRateEventsQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  threshold: number = HIGH_HEART_RATE_THRESHOLD;
}
