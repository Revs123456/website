import { describe, expect, it } from 'vitest';
import { levelProgress, LEVEL_THRESHOLDS, LEVEL_NAMES } from '../api';

describe('levelProgress', () => {
  it('starts a brand-new user at level 1 with no progress', () => {
    const result = levelProgress(0);
    expect(result.level).toBe(1);
    expect(result.name).toBe(LEVEL_NAMES[0]);
    expect(result.xp_into_level).toBe(0);
    expect(result.progress_pct).toBe(0);
  });

  it('places xp exactly on a threshold at the start of that level', () => {
    const result = levelProgress(LEVEL_THRESHOLDS[2]); // 1500 → level 3
    expect(result.level).toBe(3);
    expect(result.xp_into_level).toBe(0);
  });

  it('computes progress toward the next threshold mid-level', () => {
    // Level 2 spans 100 → 500. 300 xp is 50% of the way through.
    const result = levelProgress(300);
    expect(result.level).toBe(2);
    expect(result.xp_into_level).toBe(200);
    expect(result.xp_to_next).toBe(200);
    expect(result.progress_pct).toBe(50);
  });

  it('caps out at the max level and reports 100% with nothing left to earn', () => {
    const maxThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const result = levelProgress(maxThreshold + 50_000);
    expect(result.is_max_level).toBe(true);
    expect(result.xp_to_next).toBe(0);
    expect(result.progress_pct).toBe(100);
  });
});
