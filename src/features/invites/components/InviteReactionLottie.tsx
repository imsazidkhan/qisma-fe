import LottieView from 'lottie-react-native';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  INVITE_REACTION_FALLBACK,
  type InviteReactionKind,
} from '@/features/invites/constants/inviteReactionEmoji';

const acceptSource = require('../../../../assets/lottie/invite-accept.json');
const declineSource = require('../../../../assets/lottie/invite-decline.json');

const SOURCES = {
  accept: acceptSource,
  decline: declineSource,
} as const;

const DISPLAY_SIZE = 200;

export type InviteReactionLottieProps = {
  kind: InviteReactionKind;
  reduceMotion: boolean;
  loop?: boolean;
};

/**
 * Full-screen–style reaction: animated Lottie (Noto Emoji motion, Apache-2.0).
 * Web + reduce motion fall back to static emoji.
 */
export function InviteReactionLottie(props: InviteReactionLottieProps): ReactElement {
  const { kind, reduceMotion, loop = true } = props;
  const [useFallback, setUseFallback] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) setUseFallback(true);
  }, [reduceMotion]);

  const onAnimationFailure = useCallback(() => {
    setUseFallback(true);
  }, []);

  if (useFallback) {
    return (
      <Text style={styles.fallbackGlyph} accessibilityElementsHidden importantForAccessibility="no">
        {INVITE_REACTION_FALLBACK[kind]}
      </Text>
    );
  }

  return (
    <View
      style={styles.wrap}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityElementsHidden={false}
    >
      <LottieView
        source={SOURCES[kind]}
        autoPlay
        loop={loop}
        resizeMode="contain"
        renderMode="AUTOMATIC"
        speed={1}
        style={styles.lottie}
        onAnimationFailure={onAnimationFailure}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
  },
  fallbackGlyph: {
    fontSize: 88,
    lineHeight: 100,
    textAlign: 'center',
  },
});
