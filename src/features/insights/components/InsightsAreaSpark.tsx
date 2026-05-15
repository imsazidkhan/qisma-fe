import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/** Series point for area charts — `amountMinor` is only used for relative scale. */
export type AreaSparkPoint = { xLabel: string; amountMinor: number };

export type AreaSparkScreenPoint = {
  x: number;
  y: number;
  xLabel: string;
  amountMinor: number;
};

export type AreaSparkLayout = {
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  innerW: number;
  innerH: number;
  bottomY: number;
  pts: readonly AreaSparkScreenPoint[];
};

export function computeAreaSparkLayout(
  data: readonly AreaSparkPoint[],
  width: number,
  height: number,
): AreaSparkLayout {
  const padL = 6;
  const padR = 6;
  const padT = 8;
  const padB = 6;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const maxVal = Math.max(1, ...data.map((d) => d.amountMinor));
  const pts = data.map((d, i) => {
    const x = padL + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padT + innerH - (d.amountMinor / maxVal) * innerH;
    return { x, y, xLabel: d.xLabel, amountMinor: d.amountMinor };
  });
  const bottomY = padT + innerH;
  return { padL, padR, padT, padB, innerW, innerH, bottomY, pts };
}

export type InsightsAreaSparkProps = {
  data: readonly AreaSparkPoint[];
  width: number;
  height: number;
  strokeColor: string;
  fillTop: string;
  fillBottom: string;
  gridColor: string;
  /** Unique per mount when multiple fills exist on one screen (SVG gradient id). */
  fillGradientId?: string;
};

function buildSmoothAreaPath(
  points: { x: number; y: number }[],
  bottomY: number,
): { line: string; area: string } {
  if (points.length === 0) {
    return { line: '', area: '' };
  }
  if (points.length === 1) {
    const p = points[0]!;
    const line = `M ${p.x} ${p.y} L ${p.x} ${bottomY}`;
    return { line, area: `M ${p.x} ${bottomY} L ${p.x} ${p.y} L ${p.x} ${bottomY} Z` };
  }

  const first = points[0]!;
  let lineD = `M ${first.x} ${first.y}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    lineD += ` Q ${p0.x} ${p0.y} ${mx} ${my}`;
  }
  const last = points[points.length - 1]!;
  lineD += ` T ${last.x} ${last.y}`;
  const areaD = `${lineD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  return { line: lineD, area: areaD };
}

export function InsightsAreaSpark({
  data,
  width,
  height,
  strokeColor,
  fillTop,
  fillBottom,
  gridColor,
  fillGradientId = 'insightAreaFill',
}: InsightsAreaSparkProps): ReactElement {
  const { padL, padR, padT, innerH, bottomY, pts } = computeAreaSparkLayout(data, width, height);
  const pathPts = pts.map((p) => ({ x: p.x, y: p.y }));
  const { line, area } = buildSmoothAreaPath(pathPts, bottomY);

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fillTop} stopOpacity="0.55" />
            <Stop offset="1" stopColor={fillBottom} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map((t) => {
          const y = padT + innerH * t;
          return (
            <Path
              key={t}
              d={`M ${padL} ${y} H ${width - padR}`}
              stroke={gridColor}
              strokeWidth={StyleSheet.hairlineWidth}
              opacity={0.35}
            />
          );
        })}
        {area ? <Path d={area} fill={`url(#${fillGradientId})`} /> : null}
        {line ? (
          <Path
            d={line}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
});
