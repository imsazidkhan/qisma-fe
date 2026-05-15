import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { ExpenseFeedParticipantFace } from '@/features/expenses/utils/expenseFeedRowFormat';
import { borderWidth, platformShadow, radius, spacing, typography } from '@/theme';
import type { useThemeColors } from '@/theme';

/** Wallet-style faces — 28 dp; ~29% overlap between faces; **`+N`** disc spaced (no overlap into bubble). */
export const EXPENSE_FEED_AVATAR_SIZE = spacing['7'];
/** Veloraq feed caps stacked faces at **2** (`splitParticipantPreview`); overflow → **`+N`**. */
export const EXPENSE_FEED_AVATAR_MAX_VISIBLE = 2;
const OVERLAP = spacing['2'];
/** Gap between last overlapping face and **`+N`** — matches Wallet / Linear column read. */
const OVERFLOW_LEADING_GAP = spacing['1.5'];
/** Keep count disc above overlapping rings. */
const OVERFLOW_Z_INDEX = 8;

export type MemberAvatarStackProps = {
  faces: ExpenseFeedParticipantFace[];
  participantTotal: number | null;
  palette: ReturnType<typeof useThemeColors>;
  /** Ring stroke — match card face (`palette.cardBackground`, typically white on light slabs). */
  avatarRingSurface?: string;
};

type AvatarSlot =
  | { kind: 'face'; face: ExpenseFeedParticipantFace }
  | { kind: 'placeholder'; key: string };

export function MemberAvatarStack({
  faces,
  participantTotal,
  palette,
  avatarRingSurface,
}: MemberAvatarStackProps): ReactElement | null {
  const unique = dedupeFaces(faces);
  const maxShown = EXPENSE_FEED_AVATAR_MAX_VISIBLE;
  const shownFaces = unique.slice(0, maxShown);
  const previewFaceCount = unique.length;
  const reportedTotal =
    typeof participantTotal === 'number' && participantTotal > 0 ? participantTotal : null;
  /** Prefer server count when present; else infer from preview rows so capped faces still get +N. */
  const total =
    reportedTotal !== null ? Math.max(reportedTotal, previewFaceCount) : previewFaceCount;

  let slots: AvatarSlot[];
  if (shownFaces.length > 0) {
    slots = shownFaces.map((face) => ({ kind: 'face', face }));
  } else if (total > 0) {
    const n = Math.min(maxShown, total);
    slots = Array.from({ length: n }, (_, i) => ({
      kind: 'placeholder',
      key: `feed-participant-slot-${String(i)}`,
    }));
  } else {
    return null;
  }

  const overflow = Math.max(0, total - slots.length);

  const ringBorder = avatarRingSurface ?? palette.white;

  const soloStackCue = slots.length === 1 && overflow === 0 && slots[0]!.kind === 'face';

  const facesWidth = EXPENSE_FEED_AVATAR_SIZE + OVERLAP * Math.max(0, slots.length - 1);
  const stackWidth =
    facesWidth + (overflow > 0 ? OVERFLOW_LEADING_GAP + EXPENSE_FEED_AVATAR_SIZE : 0);

  const ringShadow = platformShadow('expenseLedgerAvatarMicro');

  const renderAvatarBody = (face: ExpenseFeedParticipantFace): ReactElement =>
    face.avatarUrl ? (
      <Image
        accessibilityIgnoresInvertColors
        contentFit="cover"
        source={{ uri: face.avatarUrl }}
        style={styles.img}
      />
    ) : (
      <Text
        style={[
          styles.initial,
          {
            color: palette.textSecondary,
            ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
          },
        ]}
      >
        {(face.name.trim().slice(0, 1) || '?').toUpperCase()}
      </Text>
    );

  const faceRingStyle = (marginLeft: number, z?: number): ViewStyle => ({
    marginLeft,
    zIndex: z ?? 0,
    borderColor: ringBorder,
    backgroundColor: palette.surfaceFloating,
    ...ringShadow,
  });

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${String(total)} people`}
      style={[styles.row, { width: stackWidth }]}
    >
      {soloStackCue ? (
        <>
          <View
            style={[
              styles.ring,
              faceRingStyle(0, 0),
              { backgroundColor: palette.expenseLedgerOverflowBubble },
            ]}
          />
          <View style={[styles.ring, faceRingStyle(-OVERLAP, 1)]}>
            {renderAvatarBody((slots[0] as Extract<AvatarSlot, { kind: 'face' }>).face)}
          </View>
        </>
      ) : (
        slots.map((slot, index) => (
          <View
            key={slot.kind === 'face' ? slot.face.id : slot.key}
            style={[styles.ring, faceRingStyle(index === 0 ? 0 : -OVERLAP, index)]}
          >
            {slot.kind === 'face' ? renderAvatarBody(slot.face) : null}
          </View>
        ))
      )}
      {overflow > 0 ? (
        <View
          style={[
            styles.overflowBubble,
            ringShadow,
            {
              marginLeft: OVERFLOW_LEADING_GAP,
              borderColor: ringBorder,
              backgroundColor: palette.expenseLedgerOverflowBubble,
              zIndex: OVERFLOW_Z_INDEX,
            },
          ]}
        >
          <Text
            style={[
              styles.overflowText,
              {
                color: palette.expenseLedgerOverflowInk,
                ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
              },
            ]}
          >
            +{overflow}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function dedupeFaces(faces: ExpenseFeedParticipantFace[]): ExpenseFeedParticipantFace[] {
  const seen = new Set<string>();
  const out: ExpenseFeedParticipantFace[] = [];
  for (const f of faces) {
    const id = f.id.trim().toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(f);
  }
  return out;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexShrink: 0,
  },
  ring: {
    width: EXPENSE_FEED_AVATAR_SIZE,
    height: EXPENSE_FEED_AVATAR_SIZE,
    borderRadius: radius.full,
    borderWidth: borderWidth.thick,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: EXPENSE_FEED_AVATAR_SIZE,
    height: EXPENSE_FEED_AVATAR_SIZE,
  },
  initial: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
  },
  overflowBubble: {
    width: EXPENSE_FEED_AVATAR_SIZE,
    height: EXPENSE_FEED_AVATAR_SIZE,
    borderRadius: radius.full,
    borderWidth: borderWidth.thick,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.screenSection,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: spacing['4'],
    letterSpacing: typography.letterSpacing.ledgerCaption,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
