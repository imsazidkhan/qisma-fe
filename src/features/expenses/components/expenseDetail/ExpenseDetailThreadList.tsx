import { Image } from 'expo-image';
import type { TFunction } from 'i18next';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  ActivityIndicator,
  FlatList,
  InteractionManager,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { ThreadFloatingDayChip } from '@/features/expenses/components/expenseDetail/ThreadFloatingDayChip';
import { useExpenseCommentsInfinite } from '@/features/expenses/hooks/useExpenseCommentsInfinite';
import { expenseDetailScreenStyles as styles } from '@/features/expenses/screens/expenseDetailScreen.styles';
import type { ExpenseCommentEntry } from '@/features/expenses/types/expenseComment.types';
import { parseExpenseCommentApiError } from '@/features/expenses/utils/expenseCommentApiErrors';
import { mergeExpenseCommentInfinitePages } from '@/features/expenses/utils/expenseCommentCache';
import {
  buildExpenseCommentThreadRows,
  expenseCommentThreadRowToDayLabel,
  formatExpenseCommentThreadTime,
  type ExpenseCommentThreadListRow,
} from '@/features/expenses/utils/expenseCommentThreadLayout';
import { duration, easing, layoutGrid, textStyles, typography, useThemeColors } from '@/theme';

export type ExpenseDetailThreadListProps = {
  groupId: string;
  expenseId: string;
  /** When false, list stays mounted but comments are not fetched (overview tab). */
  fetchEnabled?: boolean;
  /**
   * Increment after a successful post; forces scroll to the bottom so the new message is visible.
   * Initial value 0 is ignored.
   */
  scrollToEndSignal?: number;
};

type ThreadMessageView = {
  key: string;
  userId: string;
  message: string;
  createdAt: string;
  authorName: string | undefined;
  avatarUrl: string | null;
  isOwn: boolean;
};

function expenseCommentEntryToThreadView(
  entry: ExpenseCommentEntry,
  currentUserId: string,
): ThreadMessageView {
  const name = entry.user.name?.trim();
  const username = entry.user.username?.trim();
  const authorName =
    name && name !== '' ? name : username && username !== '' ? `@${username}` : undefined;
  const rawAvatar = entry.user.avatar?.trim();
  const avatarUrl = rawAvatar && rawAvatar !== '' ? rawAvatar : null;
  return {
    key: entry.id,
    userId: entry.userId,
    message: entry.message,
    createdAt: entry.createdAt,
    authorName,
    avatarUrl,
    isOwn: currentUserId !== '' && entry.userId === currentUserId,
  };
}

const THREAD_DOT_COUNT = 28;

type ThreadDottedRuleProps = { label?: string };

function ThreadDottedRule({ label }: ThreadDottedRuleProps): ReactElement {
  const palette = useThemeColors();
  const dots = Array.from({ length: THREAD_DOT_COUNT });

  if (label) {
    return (
      <View style={styles.threadDottedLabelRow}>
        <View style={styles.threadDottedFill}>
          {dots.slice(0, THREAD_DOT_COUNT / 2).map((_, i) => (
            <View
              key={`l-${i}`}
              style={[styles.threadDot, { backgroundColor: palette.borderStrong }]}
            />
          ))}
        </View>
        <Text
          style={[
            styles.monoMeta,
            {
              color: palette.textMuted,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
            },
          ]}
        >
          {label}
        </Text>
        <View style={styles.threadDottedFill}>
          {dots.slice(0, THREAD_DOT_COUNT / 2).map((_, i) => (
            <View
              key={`r-${i}`}
              style={[styles.threadDot, { backgroundColor: palette.borderStrong }]}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.threadDottedRow}>
      {dots.map((_, i) => (
        <View key={i} style={[styles.threadDot, { backgroundColor: palette.borderStrong }]} />
      ))}
    </View>
  );
}

type ThreadDayDividerProps = { label: string };

function ThreadDayDivider({ label }: ThreadDayDividerProps): ReactElement {
  return (
    <View accessibilityRole="header" accessibilityLabel={label}>
      <ThreadDottedRule label={label} />
    </View>
  );
}

type ThreadAvatarProps = {
  avatarUrl: string | null;
  fallbackLabel: string;
};

function ThreadAvatar({ avatarUrl, fallbackLabel }: ThreadAvatarProps): ReactElement {
  const palette = useThemeColors();
  const initial = fallbackLabel.replace(/^@/, '').trim().charAt(0).toUpperCase() || '·';

  return (
    <View
      style={[
        styles.threadAvatar,
        { borderColor: palette.borderSubtle, backgroundColor: palette.premiumCardSurface },
      ]}
    >
      {avatarUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={{ uri: avatarUrl }}
          style={styles.threadAvatarImg}
        />
      ) : (
        <Text style={[styles.threadAvatarInitial, { color: palette.textSecondary }]}>
          {initial}
        </Text>
      )}
    </View>
  );
}

type ThreadMessageItemProps = {
  view: ThreadMessageView;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  t: TFunction;
};

function ThreadBubbleWhatsAppFoot({
  isOwnLastInGroup,
  timeLabel,
  textMutedColor,
}: {
  isOwnLastInGroup: boolean;
  timeLabel: string;
  textMutedColor: string;
}): ReactElement | null {
  if (timeLabel === '' && !isOwnLastInGroup) {
    return null;
  }

  return (
    <View style={styles.threadBubbleFooter}>
      {timeLabel !== '' ? (
        <Text
          accessibilityLabel={timeLabel}
          style={[styles.threadBubbleClock, { color: textMutedColor }]}
        >
          {timeLabel}
        </Text>
      ) : null}
      {isOwnLastInGroup ? (
        <View style={styles.threadItemFootSelf}>
          <View style={[styles.threadSentDot, { backgroundColor: textMutedColor }]} />
          <View style={[styles.threadSentDot, { backgroundColor: textMutedColor }]} />
        </View>
      ) : null}
    </View>
  );
}

function ThreadMessageItem({
  view,
  isFirstInGroup,
  isLastInGroup,
  t,
}: ThreadMessageItemProps): ReactElement {
  const palette = useThemeColors();
  const fallback = view.authorName ?? t('expenses.detail.memberFallback');
  const timeLabel = view.createdAt ? formatExpenseCommentThreadTime(view.createdAt) : '';

  if (view.isOwn) {
    return (
      <View style={styles.threadItemRowSelf}>
        <View style={styles.threadItemContentSelf}>
          {isFirstInGroup ? (
            <View style={styles.threadItemHeaderSelf}>
              <Text style={[styles.threadItemAuthor, { color: palette.textSecondary }]}>
                {t('expenses.thread.youLabel')}
              </Text>
            </View>
          ) : null}
          <View
            style={[
              styles.threadBubbleSelf,
              { backgroundColor: palette.premiumCardSurface, borderColor: palette.borderSubtle },
            ]}
          >
            <View style={styles.threadBubbleInner}>
              <Text style={[styles.threadBubbleBody, { color: palette.expenseThreadBubbleText }]}>
                {view.message}
              </Text>
              <ThreadBubbleWhatsAppFoot
                isOwnLastInGroup={isLastInGroup}
                textMutedColor={palette.textMuted}
                timeLabel={timeLabel}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.threadItemRowOther}>
      <View style={styles.threadItemAvatarColumn}>
        {isFirstInGroup ? (
          <ThreadAvatar avatarUrl={view.avatarUrl} fallbackLabel={fallback} />
        ) : (
          <View style={[styles.threadItemConnector, { backgroundColor: palette.borderSubtle }]} />
        )}
      </View>
      <View style={styles.threadItemContentOther}>
        {isFirstInGroup ? (
          <View style={styles.threadItemHeaderOther}>
            <Text
              numberOfLines={1}
              style={[styles.threadItemAuthor, { color: palette.textSecondary }]}
            >
              {fallback}
            </Text>
          </View>
        ) : null}
        <View
          style={[
            styles.threadBubbleOther,
            { backgroundColor: palette.surfaceElevated, borderColor: palette.borderSubtle },
          ]}
        >
          <View style={styles.threadBubbleInner}>
            <Text style={[styles.threadBubbleBody, { color: palette.expenseThreadBubbleText }]}>
              {view.message}
            </Text>
            <ThreadBubbleWhatsAppFoot
              isOwnLastInGroup={false}
              textMutedColor={palette.textMuted}
              timeLabel={timeLabel}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const NEAR_BOTTOM_PX = 120;
const NEAR_TOP_PX = 88;

export function ExpenseDetailThreadList({
  groupId,
  expenseId,
  fetchEnabled = true,
  scrollToEndSignal = 0,
}: ExpenseDetailThreadListProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const { data: me } = useAuthMe();
  const currentUserId = me?.id?.trim() ?? '';
  const listRef = useRef<FlatList<ExpenseCommentThreadListRow>>(null);
  const contentHeightRef = useRef(0);
  const layoutHeightRef = useRef(0);
  /** Stick to bottom for newest messages unless the user scrolls up to read older. */
  const stickToBottomRef = useRef(true);
  const scrollYRef = useRef(0);
  /**
   * FlatList starts at y=0 before the first `scrollToEnd`; that frame falsely reads as
   * “not sticking to bottom” and used to spam `fetchNextPage`. Only trust scroll metrics
   * after we’ve anchored to the newest message.
   */
  const initialAnchorCompleteRef = useRef(false);

  const [floatingDayLabel, setFloatingDayLabel] = useState('');
  const floatingDayVisibility = useSharedValue(0);
  const floatingHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotionRef = useRef(false);

  /**
   * `scrollToEnd` often stops a few px short of the true max offset (rounding / hairlines).
   * Using measured content vs viewport + a tiny fudge matches chat “flush to bottom” UX.
   */
  const scrollToBottom = useCallback((animated: boolean) => {
    const list = listRef.current;
    if (!list) return;
    const contentH = contentHeightRef.current;
    const layoutH = layoutHeightRef.current;
    if (contentH > 0 && layoutH > 0 && contentH > layoutH + 0.5) {
      const fudgePx = 8;
      list.scrollToOffset({
        offset: Math.max(0, Math.ceil(contentH - layoutH + fudgePx)),
        animated,
      });
    } else {
      list.scrollToEnd({ animated });
    }
  }, []);

  const scrollToEndForced = useCallback(() => {
    scrollToBottom(true);
    requestAnimationFrame(() => {
      scrollToBottom(false);
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    });
  }, [scrollToBottom]);

  const prevFetchEnabledRef = useRef(false);
  const pendingThreadAnchorRef = useRef(false);

  /** Leaving thread tab clears viewport ref so the next `onLayout` is treated as afresh measurement. */
  useEffect(() => {
    if (!fetchEnabled) {
      layoutHeightRef.current = 0;
      prevFetchEnabledRef.current = false;
      pendingThreadAnchorRef.current = false;
      return;
    }
    if (!prevFetchEnabledRef.current) {
      pendingThreadAnchorRef.current = true;
      stickToBottomRef.current = true;
      initialAnchorCompleteRef.current = false;
    }
    prevFetchEnabledRef.current = true;
  }, [fetchEnabled]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduceMotionRef.current = v;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      reduceMotionRef.current = v;
    });
    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (floatingHideTimerRef.current) {
        clearTimeout(floatingHideTimerRef.current);
      }
    };
  }, []);

  const listQuery = useExpenseCommentsInfinite({
    groupId,
    expenseId,
    limit: 20,
    sort: 'desc',
    enabled: fetchEnabled,
  });

  const items = useMemo(
    () => mergeExpenseCommentInfinitePages(listQuery.data?.pages, 'desc'),
    [listQuery.data?.pages],
  );

  const rows = useMemo(() => buildExpenseCommentThreadRows(items, t), [items, t]);

  const hideFloatingDayChip = useCallback(() => {
    if (reduceMotionRef.current) {
      floatingDayVisibility.value = 0;
      return;
    }
    floatingDayVisibility.value = withTiming(0, {
      duration: duration.normal.ms,
      easing: easing.exit.rn,
    });
  }, [floatingDayVisibility]);

  const showFloatingDayChip = useCallback(() => {
    if (reduceMotionRef.current) {
      floatingDayVisibility.value = 1;
      return;
    }
    floatingDayVisibility.value = withTiming(1, {
      duration: duration.fast.ms,
      easing: easing.enter.rn,
    });
  }, [floatingDayVisibility]);

  const scheduleFloatingDayHide = useCallback(() => {
    if (floatingHideTimerRef.current) {
      clearTimeout(floatingHideTimerRef.current);
    }
    floatingHideTimerRef.current = setTimeout(() => {
      floatingHideTimerRef.current = null;
      hideFloatingDayChip();
    }, 1000);
  }, [hideFloatingDayChip]);

  const bumpFloatingDayChip = useCallback(() => {
    showFloatingDayChip();
    scheduleFloatingDayHide();
  }, [showFloatingDayChip, scheduleFloatingDayHide]);

  const rescheduleFloatingDayHideIfScrolledUp = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const y = contentOffset.y;
      const distanceFromBottom = contentSize.height - (y + layoutMeasurement.height);
      const scrollable = contentSize.height > layoutMeasurement.height + 2;
      if (
        fetchEnabled &&
        rows.length > 0 &&
        scrollable &&
        distanceFromBottom > NEAR_BOTTOM_PX
      ) {
        scheduleFloatingDayHide();
      }
    },
    [fetchEnabled, rows.length, scheduleFloatingDayHide],
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 15,
      waitForInteraction: false,
    }),
    [],
  );

  const onViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken<ExpenseCommentThreadListRow>[] }) => {
      if (!fetchEnabled || info.viewableItems.length === 0) return;
      let top: ViewToken<ExpenseCommentThreadListRow> | null = null;
      let topIndex = Infinity;
      for (const v of info.viewableItems) {
        if (v.index === null || v.index === undefined || v.index < 0) continue;
        if (!v.isViewable) continue;
        if (v.index < topIndex) {
          topIndex = v.index;
          top = v;
        }
      }
      if (top?.item == null) return;
      const label = expenseCommentThreadRowToDayLabel(top.item, t);
      setFloatingDayLabel((prev) => (prev === label ? prev : label));
    },
    [fetchEnabled, t],
  );

  const onViewableItemsChangedRef = useRef(onViewableItemsChanged);
  onViewableItemsChangedRef.current = onViewableItemsChanged;

  const onViewableItemsChangedStable = useRef(
    (info: {
      viewableItems: ViewToken<ExpenseCommentThreadListRow>[];
      changed: ViewToken<ExpenseCommentThreadListRow>[];
    }) => {
      onViewableItemsChangedRef.current(info);
    },
  ).current;

  useEffect(() => {
    if (!fetchEnabled || rows.length === 0) {
      if (floatingHideTimerRef.current) {
        clearTimeout(floatingHideTimerRef.current);
        floatingHideTimerRef.current = null;
      }
      if (rows.length === 0) {
        setFloatingDayLabel('');
      }
      if (reduceMotionRef.current) {
        floatingDayVisibility.value = 0;
      } else {
        floatingDayVisibility.value = withTiming(0, {
          duration: duration.fast.ms,
          easing: easing.exit.rn,
        });
      }
    }
  }, [fetchEnabled, rows.length, floatingDayVisibility]);

  /**
   * First thread open: `useLayoutEffect` often runs before the list reports full `contentSize`
   * (virtualized rows). Re-anchor after interactions + timers so the newest message is in view.
   */
  useEffect(() => {
    if (!fetchEnabled) return;
    if (rows.length === 0) return;
    if (!pendingThreadAnchorRef.current) return;

    let alive = true;
    const run = (): void => {
      if (!alive || !stickToBottomRef.current) return;
      scrollToEndForced();
    };

    run();
    const t0 = setTimeout(run, 80);
    const t1 = setTimeout(() => {
      if (!alive) return;
      run();
      pendingThreadAnchorRef.current = false;
    }, 200);
    const handle = InteractionManager.runAfterInteractions(run);

    return () => {
      alive = false;
      clearTimeout(t0);
      clearTimeout(t1);
      handle.cancel?.();
    };
  }, [fetchEnabled, rows.length, scrollToEndForced]);

  const snapToNewestVisually = useCallback(
    (animated = false) => {
      if (!stickToBottomRef.current) return;
      scrollToBottom(animated);
    },
    [scrollToBottom],
  );

  useEffect(() => {
    initialAnchorCompleteRef.current = false;
  }, [expenseId, groupId]);

  useEffect(() => {
    if (items.length === 0) {
      initialAnchorCompleteRef.current = false;
    }
  }, [items.length]);

  /**
   * Pin latest messages in view: `useLayoutEffect` runs before paint; follow-up passes catch
   * layout after the thread column becomes visible (`fetchEnabled`) and after row heights settle.
   * `maintainVisibleContentPosition` was fighting `scrollToEnd` here, so it is not used.
   */
  useLayoutEffect(() => {
    if (!fetchEnabled) return;
    if (rows.length === 0) return;
    if (!stickToBottomRef.current) return;

    let alive = true;
    const scheduleAnchor = () => {
      if (!alive) return;
      if (!stickToBottomRef.current) return;
      initialAnchorCompleteRef.current = true;
    };

    snapToNewestVisually(false);
    requestAnimationFrame(() => {
      if (!alive) return;
      snapToNewestVisually(false);
      requestAnimationFrame(() => {
        if (!alive) return;
        snapToNewestVisually(false);
        scheduleAnchor();
      });
    });

    const t1 = setTimeout(() => {
      if (!alive) return;
      snapToNewestVisually(false);
      scheduleAnchor();
    }, 120);

    const handle = InteractionManager.runAfterInteractions(() => {
      if (!alive) return;
      snapToNewestVisually(false);
      scheduleAnchor();
    });

    return () => {
      alive = false;
      clearTimeout(t1);
      handle.cancel?.();
    };
  }, [fetchEnabled, rows.length, snapToNewestVisually]);

  const messageGrouping = useMemo(() => {
    const m = new Map<string, { isFirstInGroup: boolean; isLastInGroup: boolean }>();
    const n = items.length;
    for (let i = 0; i < n; i++) {
      const entry = items[i];
      if (!entry) continue;
      const prev = i > 0 ? items[i - 1] : undefined;
      const next = i < n - 1 ? items[i + 1] : undefined;
      m.set(entry.id, {
        isFirstInGroup: !prev || prev.userId !== entry.userId,
        isLastInGroup: !next || next.userId !== entry.userId,
      });
    }
    return m;
  }, [items]);

  useEffect(() => {
    if (scrollToEndSignal === 0) return;
    stickToBottomRef.current = true;
    initialAnchorCompleteRef.current = false;
    let alive = true;
    let t3: ReturnType<typeof setTimeout> | undefined;
    void InteractionManager.runAfterInteractions(() => {
      if (!alive) return;
      scrollToEndForced();
      requestAnimationFrame(() => {
        if (!alive) return;
        scrollToEndForced();
      });
      /**
       * One more pass after layout + keyboard avoidance settle so the appended row is measured.
       */
      t3 = setTimeout(() => {
        if (!alive) return;
        scrollToEndForced();
      }, 160);
    });
    return () => {
      alive = false;
      if (t3 !== undefined) clearTimeout(t3);
    };
  }, [scrollToEndForced, scrollToEndSignal]);

  const listErrKind = listQuery.error ? parseExpenseCommentApiError(listQuery.error).kind : null;

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = listQuery;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      contentHeightRef.current = contentSize.height;
      const y = contentOffset.y;
      scrollYRef.current = y;
      if (!initialAnchorCompleteRef.current) {
        return;
      }
      const threshold = NEAR_BOTTOM_PX;
      const distanceFromBottom = contentSize.height - (y + layoutMeasurement.height);
      stickToBottomRef.current = distanceFromBottom <= threshold;

      const scrollable = contentSize.height > layoutMeasurement.height + 2;
      if (
        fetchEnabled &&
        rows.length > 0 &&
        scrollable &&
        distanceFromBottom > threshold
      ) {
        bumpFloatingDayChip();
      }

      const nearTop = y <= NEAR_TOP_PX;
      if (
        nearTop &&
        scrollable &&
        !stickToBottomRef.current &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        void fetchNextPage();
      }
    },
    [bumpFloatingDayChip, fetchEnabled, fetchNextPage, hasNextPage, isFetchingNextPage, rows.length],
  );

  const keyExtractor = useCallback((row: ExpenseCommentThreadListRow) => {
    if (row.kind === 'message') {
      return row.entry.id;
    }
    return `day:${row.dayKey}`;
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ExpenseCommentThreadListRow>) => {
      if (item.kind === 'dayDivider') {
        return <ThreadDayDivider label={item.label} />;
      }
      const proximity = messageGrouping.get(item.entry.id);
      const isFirstInGroup = proximity?.isFirstInGroup ?? true;
      const isLastInGroup = proximity?.isLastInGroup ?? true;
      const view = expenseCommentEntryToThreadView(item.entry, currentUserId);
      return (
        <ThreadMessageItem
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          t={t}
          view={view}
        />
      );
    },
    [currentUserId, messageGrouping, t],
  );

  const ListEmpty = useCallback(() => {
    if (listQuery.isLoading && items.length === 0) {
      return (
        <View style={[styles.threadEmptyShell, { paddingHorizontal: 0 }]}>
          <ActivityIndicator
            accessibilityLabel={t('expenses.comments.loadingA11y')}
            color={palette.iconMuted}
          />
        </View>
      );
    }
    if (listQuery.isError && items.length === 0) {
      const showRetry =
        listErrKind !== 'expense_not_found' &&
        listErrKind !== 'not_group_member' &&
        listErrKind !== 'invalid_cursor';
      return (
        <View style={[styles.threadEmptyShell, { gap: layoutGrid.sm, paddingHorizontal: 0 }]}>
          <Text style={[textStyles.body, { color: palette.errorText }]}>
            {listErrKind === 'expense_not_found'
              ? t('expenses.comments.expenseMissing')
              : listErrKind === 'not_group_member'
                ? t('expenses.comments.notMemberBody')
                : t('expenses.comments.listError')}
          </Text>
          {showRetry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('expenses.comments.retryA11y')}
              onPress={() => void listQuery.refetch()}
            >
              <Text style={[textStyles.label, { color: palette.accent }]}>
                {t('expenses.comments.retry')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      );
    }
    return (
      <View style={[styles.threadEmptyShell, { paddingHorizontal: 0 }]}>
        <Text
          style={[
            styles.monoMeta,
            {
              color: palette.textMuted,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
            },
          ]}
        >
          {t('expenses.thread.emptyEyebrow')}
        </Text>
        <Text style={[textStyles.body, { color: palette.textSecondary, textAlign: 'center' }]}>
          {t('expenses.thread.emptyBody')}
        </Text>
      </View>
    );
  }, [
    items.length,
    listErrKind,
    listQuery,
    palette.accent,
    palette.errorText,
    palette.iconMuted,
    palette.textMuted,
    palette.textSecondary,
    t,
  ]);

  const ListHeader = useCallback(() => {
    if (!listQuery.isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: layoutGrid.sm, alignItems: 'center' }}>
        <ActivityIndicator color={palette.iconMuted} />
      </View>
    );
  }, [listQuery.isFetchingNextPage, palette.iconMuted]);

  const handleListLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const nextH = e.nativeEvent.layout.height;
      const prevH = layoutHeightRef.current;
      layoutHeightRef.current = nextH;
      if (!fetchEnabled || rows.length === 0) return;
      if (!stickToBottomRef.current) return;
      if (prevH === 0 && nextH > 0) {
        requestAnimationFrame(() => {
          scrollToBottom(false);
          requestAnimationFrame(() => {
            scrollToBottom(false);
          });
        });
        return;
      }
      if (prevH > 0 && Math.abs(nextH - prevH) > 2) {
        requestAnimationFrame(() => {
          scrollToBottom(false);
        });
      }
    },
    [fetchEnabled, rows.length, scrollToBottom],
  );

  return (
    <View style={styles.threadListWrap}>
      <FlatList
        ref={listRef}
        ListEmptyComponent={ListEmpty}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.threadListContent,
          styles.detailScrollContentThread,
          items.length === 0 ? styles.threadListContentEmpty : undefined,
        ]}
        data={rows}
        ItemSeparatorComponent={() => <View style={{ height: layoutGrid.sm }} />}
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        onContentSizeChange={(_w, h) => {
          contentHeightRef.current = h;
          if (!fetchEnabled || rows.length === 0) return;
          if (!stickToBottomRef.current) return;
          snapToNewestVisually(false);
        }}
        onLayout={handleListLayout}
        onMomentumScrollEnd={rescheduleFloatingDayHideIfScrolledUp}
        onScroll={handleScroll}
        onScrollEndDrag={rescheduleFloatingDayHideIfScrolledUp}
        onViewableItemsChanged={onViewableItemsChangedStable}
        renderItem={renderItem}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.detailScrollFlex}
        viewabilityConfig={viewabilityConfig}
      />
      {fetchEnabled && rows.length > 0 && floatingDayLabel !== '' ? (
        <ThreadFloatingDayChip label={floatingDayLabel} visibility={floatingDayVisibility} />
      ) : null}
    </View>
  );
}
