import { describe, expect, it } from 'vitest';

import { callingCodeBucketForAnalytics } from '@/utils/e164Analytics';

describe('callingCodeBucketForAnalytics', () => {
  it('does not treat +91 subscriber digits as part of the calling code', () => {
    expect(callingCodeBucketForAnalytics('+919876543210')).toBe('+91');
  });

  it('handles NANP +1', () => {
    expect(callingCodeBucketForAnalytics('+12125551234')).toBe('+1');
  });

  it('uses 3-digit codes when leading digit is 3 and length supports it', () => {
    expect(callingCodeBucketForAnalytics('+358401234567')).toBe('+358');
  });
});
