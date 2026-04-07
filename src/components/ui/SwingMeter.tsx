import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';

const METER_SIZE = 130;
const CENTER_X = METER_SIZE / 2;
const CENTER_Y = METER_SIZE / 2 + 8;
const RADIUS = 48;
const START_ANGLE = -210;
const END_ANGLE = -330;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export interface SwingMeterHandle {
  stop: () => number;
}

interface SwingMeterProps {
  visible: boolean;
  label: string;
  speed?: number;
  distanceText?: string; // e.g. "360 yds" shown inside meter
}

const SwingMeter = forwardRef<SwingMeterHandle, SwingMeterProps>(
  ({ visible, label, speed = 0.6, distanceText }, ref) => {
    const progress = useRef(new Animated.Value(0)).current;
    const currentVal = useRef(0);
    const animRef = useRef<Animated.CompositeAnimation | null>(null);

    useImperativeHandle(ref, () => ({
      stop: () => {
        animRef.current?.stop();
        return currentVal.current;
      },
    }));

    useEffect(() => {
      if (visible) {
        progress.setValue(0);
        currentVal.current = 0;

        progress.addListener(({ value }) => {
          currentVal.current = value;
        });

        const duration = 600 + speed * 800;
        const anim = Animated.loop(
          Animated.sequence([
            Animated.timing(progress, {
              toValue: 1,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(progress, {
              toValue: 0,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ])
        );
        animRef.current = anim;
        anim.start();
      } else {
        animRef.current?.stop();
        progress.removeAllListeners();
      }
      return () => {
        animRef.current?.stop();
        progress.removeAllListeners();
      };
    }, [visible, speed]);

    if (!visible) return null;

    const ticks = [
      { value: 25, label: '25' },
      { value: 50, label: '50' },
      { value: 75, label: '75' },
      { value: 100, label: '100' },
    ];

    return (
      <View style={styles.container} pointerEvents="none">
        <Svg width={METER_SIZE} height={METER_SIZE * 0.7}>
          {/* Background track */}
          <Path
            d={describeArc(CENTER_X, CENTER_Y, RADIUS, START_ANGLE, END_ANGLE)}
            stroke="#222"
            strokeWidth={10}
            fill="none"
          />
          {/* Color segments */}
          <Path d={describeArc(CENTER_X, CENTER_Y, RADIUS, -210, -240)} stroke="#4CAF50" strokeWidth={10} fill="none" />
          <Path d={describeArc(CENTER_X, CENTER_Y, RADIUS, -240, -270)} stroke="#8BC34A" strokeWidth={10} fill="none" />
          <Path d={describeArc(CENTER_X, CENTER_Y, RADIUS, -270, -295)} stroke="#FFEB3B" strokeWidth={10} fill="none" />
          <Path d={describeArc(CENTER_X, CENTER_Y, RADIUS, -295, -315)} stroke="#FF9800" strokeWidth={10} fill="none" />
          <Path d={describeArc(CENTER_X, CENTER_Y, RADIUS, -315, -330)} stroke="#F44336" strokeWidth={10} fill="none" />

          {/* Tick marks */}
          {ticks.map(({ value, label: tickLabel }) => {
            const angle = START_ANGLE + ((END_ANGLE - START_ANGLE) * value) / 100;
            const inner = polarToCartesian(CENTER_X, CENTER_Y, RADIUS - 7, angle);
            const outer = polarToCartesian(CENTER_X, CENTER_Y, RADIUS + 4, angle);
            const lbl = polarToCartesian(CENTER_X, CENTER_Y, RADIUS + 14, angle);
            return (
              <G key={value}>
                <Line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#FFF" strokeWidth={2} />
                <SvgText
                  x={lbl.x}
                  y={lbl.y}
                  fill="#DDD"
                  fontSize={9}
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="central"
                >
                  {tickLabel}
                </SvgText>
              </G>
            );
          })}

          {/* Distance text inside the meter */}
          {distanceText && (
            <SvgText
              x={CENTER_X}
              y={CENTER_Y - 4}
              fill="#FFF"
              fontSize={11}
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {distanceText}
            </SvgText>
          )}

          {/* Center dot */}
          <Circle cx={CENTER_X} cy={CENTER_Y} r={3} fill="#FFF" />
        </Svg>

        {/* Animated needle */}
        <NeedleOverlay
          progress={progress}
          centerX={CENTER_X}
          centerY={CENTER_Y}
          radius={RADIUS}
          meterSize={METER_SIZE}
        />
      </View>
    );
  }
);

function NeedleOverlay({
  progress,
  centerX,
  centerY,
  radius,
  meterSize,
}: {
  progress: Animated.Value;
  centerX: number;
  centerY: number;
  radius: number;
  meterSize: number;
}) {
  const [angle, setAngle] = React.useState(START_ANGLE);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setAngle(START_ANGLE + (END_ANGLE - START_ANGLE) * value);
    });
    return () => progress.removeListener(id);
  }, [progress]);

  const needleEnd = polarToCartesian(centerX, centerY, radius - 8, angle);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={meterSize} height={meterSize * 0.7}>
        <Line
          x1={centerX}
          y1={centerY}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke="#FFF"
          strokeWidth={2.5}
        />
        <Circle cx={centerX} cy={centerY} r={3} fill="#FF5722" />
      </Svg>
    </View>
  );
}

export default SwingMeter;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
