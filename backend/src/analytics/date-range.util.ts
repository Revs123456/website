// IST-aligned date-range resolution for the analytics dashboard. Mirrors the
// IST convention already used by the engagement/streak system
// (engagement.constants.ts's istTodayDate) — this app treats IST as the
// canonical "day" for all activity, so analytics buckets the same way rather
// than introducing a second, UTC-based notion of "today".
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export type RangeKey =
  | 'today' | 'yesterday' | 'last7' | 'last30' | 'last90'
  | 'this_month' | 'last_month' | 'custom';

export interface ResolvedRange {
  start: Date;
  end: Date;
  /** The immediately-preceding period of equal length — for period-over-period comparison. */
  previousStart: Date;
  previousEnd: Date;
}

function istMidnightUtc(istYear: number, istMonth: number, istDate: number): Date {
  // Midnight IST expressed as the equivalent UTC instant.
  return new Date(Date.UTC(istYear, istMonth, istDate) - IST_OFFSET_MS);
}

function istPartsOf(date: Date): { y: number; m: number; d: number } {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return { y: ist.getUTCFullYear(), m: ist.getUTCMonth(), d: ist.getUTCDate() };
}

export function resolveDateRange(
  range: RangeKey,
  customStart?: string,
  customEnd?: string,
  now: Date = new Date(),
): ResolvedRange {
  const today = istPartsOf(now);
  const startOfToday = istMidnightUtc(today.y, today.m, today.d);

  let start: Date;
  let end: Date;

  switch (range) {
    case 'today':
      start = startOfToday;
      end = now;
      break;
    case 'yesterday': {
      const y = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      start = y;
      end = startOfToday;
      break;
    }
    case 'last7':
      start = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case 'last30':
      start = new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case 'last90':
      start = new Date(startOfToday.getTime() - 89 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case 'this_month':
      start = istMidnightUtc(today.y, today.m, 1);
      end = now;
      break;
    case 'last_month': {
      const firstOfThisMonth = istMidnightUtc(today.y, today.m, 1);
      const lastMonthYear = today.m === 0 ? today.y - 1 : today.y;
      const lastMonthMonth = today.m === 0 ? 11 : today.m - 1;
      start = istMidnightUtc(lastMonthYear, lastMonthMonth, 1);
      end = firstOfThisMonth;
      break;
    }
    case 'custom': {
      if (!customStart || !customEnd) throw new Error('custom range requires start and end');
      const s = customStart.split('-').map(Number);
      const e = customEnd.split('-').map(Number);
      start = istMidnightUtc(s[0], s[1] - 1, s[2]);
      // End is inclusive of the whole selected day.
      end = new Date(istMidnightUtc(e[0], e[1] - 1, e[2]).getTime() + 24 * 60 * 60 * 1000);
      break;
    }
    default:
      start = startOfToday;
      end = now;
  }

  const spanMs = end.getTime() - start.getTime();
  return {
    start,
    end,
    previousStart: new Date(start.getTime() - spanMs),
    previousEnd: start,
  };
}

/** Percent change from `prev` to `curr`, null when prev is 0 (undefined/meaningless %). */
export function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

/** Buckets a UTC instant into its IST calendar date string (YYYY-MM-DD). */
export function toIstDateKey(date: Date): string {
  const { y, m, d } = istPartsOf(date);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
