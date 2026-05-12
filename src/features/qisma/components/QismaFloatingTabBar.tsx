import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router, usePathname } from 'expo-router';
import { memo, useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QismaCenterFab } from '@/features/qisma/components/QismaCenterFab';
import { QismaSideTabButton } from '@/features/qisma/components/QismaSideTabButton';
import {
  QismaActivityGlyphIcon,
  QismaGroupsGlyphIcon,
  QismaHomeGlyphIcon,
  QismaUserGlyphIcon,
} from '@/features/qisma/components/QismaTabGlyphIcons';
import {
  QISMA_TAB_BAR_LAYOUT,
  getQismaTabBarHorizontalInset,
} from '@/features/qisma/constants/tabBarLayout';
import { radius, space, useThemeColors, useThemeMode } from '@/theme';

function findRoute(state: BottomTabBarProps['state'], name: string) {
  return state.routes.find((r) => r.name === name);
}

/** Floating glass pill + elevated “+” — Home, Groups, Activity, Profile. */
export const QismaFloatingTabBar = memo(function QismaFloatingTabBar({
  state,
  navigation,
  insets,
}: BottomTabBarProps) {
  const palette = useThemeColors();
  const mode = useThemeMode();
  const reduceMotion = useReducedMotion();
  const safe = useSafeAreaInsets();
  const pathname = usePathname();
  const createGroupActive = pathname.includes('create-group');

  const bottomPad = insets.bottom > 0 ? insets.bottom : safe.bottom;
  const hInset = getQismaTabBarHorizontalInset();

  const rHome = findRoute(state, 'index');
  const rGroups = findRoute(state, 'groups');
  const rActivity = findRoute(state, 'activity');
  /** `(tabs)/profile` — tolerate alternate keys if the navigator renames the screen. */
  const rProfile =
    findRoute(state, 'profile') ??
    state.routes.find((r) => typeof r.name === 'string' && r.name.includes('profile'));

  const emitNavigate = useCallback(
    (targetKey: string, routeName: string) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: targetKey,
        canPreventDefault: true,
      });
      if (!event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    },
    [navigation],
  );

  if (!rHome || !rGroups || !rActivity || !rProfile) {
    return null;
  }

  const idxHome = state.routes.indexOf(rHome);
  const idxGroups = state.routes.indexOf(rGroups);
  const idxActivity = state.routes.indexOf(rActivity);
  const idxProfile = state.routes.indexOf(rProfile);
  const focusedHome = state.index === idxHome;
  const focusedGroups = state.index === idxGroups;
  const focusedActivity = state.index === idxActivity;
  const focusedProfile = state.index === idxProfile;

  const { dockHeight, dockTopMargin, marginBelowDock, fabSize } = QISMA_TAB_BAR_LAYOUT;
  const blurIntensity = reduceMotion ? 50 : QISMA_TAB_BAR_LAYOUT.blurIntensity;
  const tint = mode === 'dark' ? 'dark' : 'light';
  const webScrim = mode === 'dark' ? 'rgba(0,0,0,0.78)' : 'rgba(248,248,248,0.82)';
  /** Higher = clearer dock surface; too low reads as washed-out over BlurView. */
  const glassOverlayOpacity = mode === 'dark' ? 0.48 : 0.34;

  return (
    <View
      pointerEvents="box-none"
      style={{
        paddingBottom: bottomPad + marginBelowDock,
        paddingHorizontal: hInset,
      }}
    >
      <View pointerEvents="box-none" style={{ height: dockTopMargin + dockHeight }}>
        <View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: dockTopMargin,
              height: dockHeight,
              borderRadius: radius.lg,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: palette.borderSubtle,
              overflow: 'hidden',
            },
          ]}
        >
          {Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: webScrim }]} />
          ) : (
            <BlurView
              intensity={blurIntensity}
              tint={tint}
              experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: palette.glassStrong, opacity: glassOverlayOpacity },
            ]}
          />
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'stretch',
              paddingHorizontal: space.gapSm,
              minHeight: dockHeight,
            }}
          >
            <QismaSideTabButton
              accessibilityLabel="Home"
              selected={focusedHome}
              onPress={() => {
                emitNavigate(rHome.key, rHome.name);
              }}
              icon={(c) => <QismaHomeGlyphIcon color={c} size={26} strokeWidth={1.5} />}
              activeColor={palette.textPrimary}
              idleColor={palette.textSecondary}
              reduceMotion={reduceMotion}
            />
            <QismaSideTabButton
              accessibilityLabel="Groups"
              selected={focusedGroups}
              onPress={() => {
                emitNavigate(rGroups.key, rGroups.name);
              }}
              icon={(c) => <QismaGroupsGlyphIcon color={c} size={26} strokeWidth={1.5} />}
              activeColor={palette.textPrimary}
              idleColor={palette.textSecondary}
              reduceMotion={reduceMotion}
            />
            <View style={{ width: fabSize }} />
            <QismaSideTabButton
              accessibilityLabel="Activity"
              selected={focusedActivity}
              onPress={() => {
                emitNavigate(rActivity.key, rActivity.name);
              }}
              icon={(c) => <QismaActivityGlyphIcon color={c} size={26} strokeWidth={1.5} />}
              activeColor={palette.textPrimary}
              idleColor={palette.textSecondary}
              reduceMotion={reduceMotion}
            />
            <QismaSideTabButton
              accessibilityLabel="Profile"
              selected={focusedProfile}
              onPress={() => {
                emitNavigate(rProfile.key, rProfile.name);
              }}
              icon={(c) => <QismaUserGlyphIcon color={c} size={26} strokeWidth={1.5} />}
              activeColor={palette.textPrimary}
              idleColor={palette.textSecondary}
              reduceMotion={reduceMotion}
            />
          </View>

          <View
            pointerEvents="box-none"
            style={[
              StyleSheet.absoluteFill,
              { alignItems: 'center', justifyContent: 'center', zIndex: 1 },
            ]}
          >
            <QismaCenterFab
              selected={createGroupActive}
              onPress={() => {
                if (createGroupActive) return;
                router.push('/home/create-group');
              }}
              palette={{
                accent: palette.accent,
                accentSoft: palette.accentSoft,
                textOnAccent: palette.textOnAccent,
                accentPress: palette.accentPress,
                border: palette.border,
              }}
              reduceMotion={reduceMotion}
            />
          </View>
        </View>
      </View>
    </View>
  );
});
