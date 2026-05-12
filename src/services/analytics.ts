/**
 * Structured analytics facade.
 *
 * NO PII. Phone numbers, OTPs, sessionIds, emails — none of it. If you need
 * to know "did the same user retry?", hash a stable id; never pass the raw.
 * Properties should be enums, counts, durations, and short flags.
 *
 * Events themselves should come from `@/constants/analyticsEvents` — never
 * inline strings. That gives one place to grep for the contract with the
 * data team.
 */

export type AnalyticsProps = Record<string, string | number | boolean | undefined | null>;

export const analytics = {
  track(event: string, props?: AnalyticsProps): void {
    if (__DEV__) {
      console.log(`[analytics] ${event}`, props ?? {});
    }
    // TODO(prod): forward to Mixpanel / Segment / Amplitude here.
  },
};

export const track = analytics.track;
