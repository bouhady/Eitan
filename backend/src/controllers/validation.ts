import { BadRequestException } from '@nestjs/common';

// strict ISO 8601: date, or date-time with optional ms and Z/offset
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;

/** Throws 400 unless value is a valid ISO 8601 date/date-time string. */
export function assertIsoDate(value: string | undefined, name: string): string {
  if (!value || !ISO_DATE_RE.test(value) || isNaN(Date.parse(value))) {
    throw new BadRequestException(`${name} must be a valid ISO 8601 date`);
  }
  return value;
}
