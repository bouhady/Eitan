import { BadRequestException } from '@nestjs/common';

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

/** Parse limit/offset query params with defaults; throws 400 on invalid values. */
export function parsePagination(limit?: string, offset?: string): { limit: number; offset: number } {
  const lim = limit === undefined ? DEFAULT_LIMIT : Number(limit);
  const off = offset === undefined ? 0 : Number(offset);
  if (!Number.isInteger(lim) || lim < 1 || lim > MAX_LIMIT) {
    throw new BadRequestException(`limit must be an integer between 1 and ${MAX_LIMIT}`);
  }
  if (!Number.isInteger(off) || off < 0) {
    throw new BadRequestException('offset must be a non-negative integer');
  }
  return { limit: lim, offset: off };
}
