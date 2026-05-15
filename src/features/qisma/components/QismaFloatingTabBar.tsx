import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { memo, useCallback } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '@/constants/routes';
import { QismaCenterFab } from '@/features/qisma/components/QismaCenterFab';
import { QismaSideTabButton } from '@/features/qisma/components/QismaSideTabButton';
import {
  QismaActivityGlyphIcon,
  QismaGroupsGlyphIcon,
  QismaHomeGlyphIcon,
  QismaInsightsGlyphIcon,
} from '@/features/qisma/components/QismaTabGlyphIcons';
import { QISMA_TAB_BAR_LAYOUT } from '@/features/qisma/constants/tabBarLayout';
import { radius, useThemeColors, useThemeMode } from '@/theme';

function findRoute(state: BottomTabBarProps['state'], name: string) {
  return state.routes.find((r) => r.name === name);
}

/**
 * Lastbench home tabs — balanced equal-width rail, soft FAB, calm hierarchy.
 */
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
  const { width: windowWidth } = useWindowDimensions();

  const bottomPad = insets.bottom > 0 ? insets.bottom : safe.bottom;

  const rHome = findRoute(state, 'index');
  const rGroups = findRoute(state, 'groups');
  const rActivity = findRoute(state, 'activity');
  const rInsights = findRoute(state, 'insights');

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

  if (!rHome || !rGroups || !rActivity || !rInsights) {
    return null;
  }

  const idxHome = state.routes.indexOf(rHome);
  const idxGroups = state.routes.indexOf(rGroups);
  const idxActivity = state.routes.indexOf(rActivity);
  const idxInsights = state.routes.indexOf(rInsights);
  const focusedHome = state.index === idxHome;
  const focusedGroups = state.index === idxGroups;
  const focusedActivity = state.index === idxActivity;
  const focusedInsights = state.index === idxInsights;

  const {
    dockHeight,
    dockTopMargin,
    marginBelowDock,
    fabSlotWidth,
    blurIntensity,
    dockPadH,
    dockPadTop,
    dockPadBottom,
    fabFloatAboveDock,
    tabGlyphSize,
    tabGlyphStroke,
  } = QISMA_TAB_BAR_LAYOUT;

  const blurIx = reduceMotion ? Math.round(blurIntensity * 1.05) : blurIntensity;
  const tint = mode === 'dark' ? 'dark' : 'light';
  const webScrim = mode === 'dark' ? 'rgba(26,26,26,0.92)' : 'rgba(250,250,250,0.96)';
  const glassOverlayOpacity = mode === 'dark' ? 0.44 : 0.22;

  const fabRouteActive = pathname.includes('/add-expense') || pathname.includes('create-group');

  const dockWidth = windowWidth * 0.92;

  const dockOuterShadow = Platform.select({
    ios:
      mode === 'light'
        ? {
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.04,
            shadowRadius: 20,
          }
        : {
            shadowColor: palette.shadowSoft,
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.12,
            shadowRadius: 28,
          },
    android: { elevation: mode === 'light' ? 5 : 8 },
    default:
      mode === 'light'
        ? {
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.045,
            shadowRadius: 18,
          }
        : {
            shadowColor: palette.shadowSoft,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.08,
            shadowRadius: 22,
          },
  });

  const dockInnerShadow =
    mode === 'dark'
      ? Platform.select({
          ios: {
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.1,
            shadowRadius: 14,
          },
          android: { elevation: 0 },
          default: {
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
          },
        })
      : Platform.select({
          ios: {
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 8,
          },
          android: { elevation: 0 },
          default: {
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 8,
          },
        });

  const dockBorderWidth = mode === 'light' ? 1 : StyleSheet.hairlineWidth;
  const dockHairline = mode === 'light' ? palette.floatingTabRailHairline : palette.borderSubtle;

  const inkActive = palette.floatingTabInkActive;
  const inkIdle = palette.floatingTabInkIdle;

  return (
    <View
      pointerEvents="box-none"
      style={{
        paddingBottom: bottomPad + marginBelowDock,
        alignItems: 'center',
      }}
    >
      <View
        pointerEvents="box-none"
        style={{
          width: dockWidth,
          height: dockTopMargin + dockHeight,
        }}
      >
        <View
          pointerEvents="box-none"
          style={[
            dockOuterShadow,
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: dockTopMargin,
              height: dockHeight,
              borderRadius: radius.tabBarDock,
            },
          ]}
        >
          <View
            pointerEvents="box-none"
            style={[
              dockInnerShadow,
              {
                flex: 1,
                borderRadius: radius.tabBarDock,
              },
            ]}
          >
            <View
              style={{
                flex: 1,
                borderRadius: radius.tabBarDock,
                overflow: 'hidden',
                borderWidth: dockBorderWidth,
                borderColor: dockHairline,
                backgroundColor:
                  Platform.OS === 'web'
                    ? mode === 'dark'
                      ? 'rgba(26,26,26,0.92)'
                      : 'rgba(250,250,250,0.98)'
                    : undefined,
              }}
            >
              {Platform.OS === 'web' ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: webScrim }]} />
              ) : (
                <BlurView
                  intensity={blurIx}
                  tint={tint}
                  experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: palette.glassStrong,
                    opacity: glassOverlayOpacity,
                    borderRadius: radius.tabBarDock,
                  },
                ]}
              />
              {mode === 'light' ? (
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
                  locations={[0, 1]}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    height: 14,
                    borderTopLeftRadius: radius.tabBarDock,
                    borderTopRightRadius: radius.tabBarDock,
                  }}
                />
              ) : null}
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  paddingHorizontal: dockPadH,
                  paddingTop: dockPadTop,
                  paddingBottom: dockPadBottom,
                }}
              >
                <QismaSideTabButton
                  accessibilityLabel="Home tab"
                  title="Home"
                  selected={focusedHome}
                  reduceMotion={!!reduceMotion}
                  onPress={() => {
                    emitNavigate(rHome.key, rHome.name);
                  }}
                  icon={(c) => (
                    <QismaHomeGlyphIcon
                      color={c}
                      size={tabGlyphSize}
                      strokeWidth={tabGlyphStroke}
                    />
                  )}
                  activeColor={inkActive}
                  idleColor={inkIdle}
                />
                <QismaSideTabButton
                  accessibilityLabel="Groups tab"
                  title="Groups"
                  selected={focusedGroups}
                  reduceMotion={!!reduceMotion}
                  onPress={() => {
                    emitNavigate(rGroups.key, rGroups.name);
                  }}
                  icon={(c) => (
                    <QismaGroupsGlyphIcon
                      color={c}
                      size={tabGlyphSize}
                      strokeWidth={tabGlyphStroke}
                    />
                  )}
                  activeColor={inkActive}
                  idleColor={inkIdle}
                />
                <View
                  pointerEvents="none"
                  style={{
                    width: fabSlotWidth,
                    flexShrink: 0,
                    flexGrow: 0,
                    alignItems: 'center',
                  }}
                />
                <QismaSideTabButton
                  accessibilityLabel="Activity tab"
                  title="Activity"
                  selected={focusedActivity}
                  reduceMotion={!!reduceMotion}
                  onPress={() => {
                    emitNavigate(rActivity.key, rActivity.name);
                  }}
                  icon={(c) => (
                    <QismaActivityGlyphIcon
                      color={c}
                      size={tabGlyphSize}
                      strokeWidth={tabGlyphStroke}
                    />
                  )}
                  activeColor={inkActive}
                  idleColor={inkIdle}
                />
                <QismaSideTabButton
                  accessibilityLabel="Insights tab"
                  title="Insights"
                  selected={focusedInsights}
                  reduceMotion={!!reduceMotion}
                  onPress={() => {
                    emitNavigate(rInsights.key, rInsights.name);
                  }}
                  icon={(c) => (
                    <QismaInsightsGlyphIcon
                      color={c}
                      size={tabGlyphSize}
                      strokeWidth={tabGlyphStroke}
                    />
                  )}
                  activeColor={inkActive}
                  idleColor={inkIdle}
                />
              </View>
            </View>
          </View>
        </View>
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: dockTopMargin,
            height: dockHeight,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            transform: [{ translateY: -fabFloatAboveDock }],
          }}
        >
          <QismaCenterFab
            active={fabRouteActive}
            reduceMotion={!!reduceMotion}
            onPress={() => {
              router.push(ROUTES.HOME_CREATE_GROUP);
            }}
          />
        </View>
      </View>
    </View>
  );
});
