import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { duration, easing } from '@/theme/motion';

const W = 280;
const H = 220;

export type HomeEmptyHeroArtPalette = {
  surfaceRaised: string;
  surfaceFloating: string;
  surfaceElevated: string;
  surfaceOverlay: string;
  borderSubtle: string;
  accentSoft: string;
  textMuted: string;
  overlayStrong: string;
};

type HomeEmptyHeroArtProps = {
  palette: HomeEmptyHeroArtPalette;
};

export function HomeEmptyHeroArt({ palette }: HomeEmptyHeroArtProps) {
  const y = useSharedValue(0);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) setReduceMotionEnabled(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotionEnabled);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotionEnabled) {
      cancelAnimation(y);
      y.value = 0;
      return;
    }
    y.value = withRepeat(
      withSequence(
        withTiming(-5, {
          duration: duration.slower.ms,
          easing: easing.standard.rn,
        }),
        withTiming(0, {
          duration: duration.slower.ms,
          easing: easing.standard.rn,
        }),
      ),
      -1,
      false,
    );
  }, [reduceMotionEnabled, y]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <View style={styles.wrap} accessible={false} importantForAccessibility="no-hide-descendants">
      <Animated.View style={wrapStyle}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <RadialGradient id="heroGlow" cx="50%" cy="42%" r="58%">
              <Stop offset="0%" stopColor={palette.overlayStrong} stopOpacity={0.95} />
              <Stop offset="55%" stopColor={palette.surfaceElevated} stopOpacity={0.35} />
              <Stop offset="100%" stopColor={palette.surfaceRaised} stopOpacity={0} />
            </RadialGradient>
            <LinearGradient id="cardSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={palette.surfaceFloating} stopOpacity={1} />
              <Stop offset="100%" stopColor={palette.surfaceRaised} stopOpacity={0.92} />
            </LinearGradient>
            <LinearGradient id="slipGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={palette.surfaceFloating} />
              <Stop offset="100%" stopColor={palette.surfaceElevated} />
            </LinearGradient>
          </Defs>

          <Rect x={0} y={0} width={W} height={H} fill="url(#heroGlow)" />

          <G opacity={0.95}>
            <Rect
              x={154}
              y={118}
              width={96}
              height={62}
              rx={10}
              fill={palette.surfaceRaised}
              stroke={palette.borderSubtle}
              strokeWidth={1}
              opacity={0.85}
              transform="rotate(-8 202 149)"
            />
            <Rect
              x={40}
              y={124}
              width={104}
              height={68}
              rx={12}
              fill="url(#cardSheen)"
              stroke={palette.borderSubtle}
              strokeWidth={1}
            />
            <Rect
              x={168}
              y={44}
              width={72}
              height={96}
              rx={8}
              fill="url(#slipGrad)"
              stroke={palette.borderSubtle}
              strokeWidth={1}
              opacity={0.9}
              transform="rotate(6 204 92)"
            />
          </G>

          <Circle
            cx={210}
            cy={168}
            r={14}
            fill={palette.surfaceFloating}
            stroke={palette.borderSubtle}
            strokeWidth={1}
          />
          <Circle
            cx={228}
            cy={154}
            r={10}
            fill={palette.surfaceElevated}
            stroke={palette.borderSubtle}
            strokeWidth={1}
          />

          <Ellipse cx={118} cy={188} rx={56} ry={10} fill={palette.accentSoft} opacity={0.35} />

          <G opacity={0.75}>
            <Rect x={62} y={152} width={36} height={4} rx={2} fill={palette.textMuted} />
            <Rect
              x={62}
              y={160}
              width={52}
              height={4}
              rx={2}
              fill={palette.textMuted}
              opacity={0.55}
            />
            <Rect
              x={62}
              y={168}
              width={44}
              height={4}
              rx={2}
              fill={palette.textMuted}
              opacity={0.35}
            />
          </G>

          <Circle
            cx={76}
            cy={72}
            r={22}
            fill={palette.surfaceOverlay}
            stroke={palette.borderSubtle}
            strokeWidth={1}
          />
          <Circle
            cx={100}
            cy={64}
            r={14}
            fill={palette.surfaceFloating}
            stroke={palette.borderSubtle}
            strokeWidth={1}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
