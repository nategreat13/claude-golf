import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import { COLORS } from '../../utils/colors';

interface AccuracyBarProps {
  onAccuracySet: (accuracy: number) => void;
  visible: boolean;
  speed: number; // 0-1, higher = easier (slower oscillation)
}

export default function AccuracyBar({ onAccuracySet, visible, speed }: AccuracyBarProps) {
  const position = useRef(new Animated.Value(0)).current; // 0 to 1
  const currentPos = useRef(0.5);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      position.setValue(0);
      currentPos.current = 0;

      position.addListener(({ value }) => {
        currentPos.current = value;
      });

      const duration = 300 + speed * 700;
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(position, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(position, {
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
      position.removeAllListeners();
    }

    return () => {
      animRef.current?.stop();
      position.removeAllListeners();
    };
  }, [visible, speed]);

  const handlePress = useCallback(() => {
    animRef.current?.stop();
    const deviation = (currentPos.current - 0.5) * 2;
    onAccuracySet(deviation);
  }, [onAccuracySet]);

  const markerLeft = position.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '96%'],
  });

  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={styles.label}>ACCURACY</Text>
      <View style={styles.barBackground}>
        {/* Perfect zone */}
        <View style={styles.perfectZone} />
        {/* Good zones */}
        <View style={[styles.goodZone, { left: '30%', width: '10%' }]} />
        <View style={[styles.goodZone, { right: '30%', width: '10%' }]} />
        {/* Marker */}
        <Animated.View style={[styles.marker, { left: markerLeft }]} />
      </View>
      <Text style={styles.tapText}>TAP!</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  label: {
    color: COLORS.ui.text,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  barBackground: {
    width: '100%',
    height: 36,
    backgroundColor: COLORS.accuracy.background,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  perfectZone: {
    position: 'absolute',
    left: '42%',
    width: '16%',
    height: '100%',
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
  },
  goodZone: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(255, 235, 59, 0.3)',
  },
  marker: {
    position: 'absolute',
    width: 4,
    height: '100%',
    backgroundColor: COLORS.accuracy.marker,
    borderRadius: 2,
  },
  tapText: {
    color: COLORS.ui.accent,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
