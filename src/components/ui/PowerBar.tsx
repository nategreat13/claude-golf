import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import { COLORS } from '../../utils/colors';

interface PowerBarProps {
  onPowerSet: (power: number) => void;
  visible: boolean;
}

export default function PowerBar({ onPowerSet, visible }: PowerBarProps) {
  const power = useRef(new Animated.Value(0)).current;
  const currentPower = useRef(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      power.setValue(0);
      currentPower.current = 0;

      power.addListener(({ value }) => {
        currentPower.current = value;
      });

      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(power, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(power, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      );
      animRef.current = anim;
      anim.start();
    } else {
      animRef.current?.stop();
      power.removeAllListeners();
    }

    return () => {
      animRef.current?.stop();
      power.removeAllListeners();
    };
  }, [visible]);

  const handlePress = useCallback(() => {
    animRef.current?.stop();
    onPowerSet(currentPower.current);
  }, [onPowerSet]);

  const fillHeight = power.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const fillColor = power.interpolate({
    inputRange: [0, 0.4, 0.75, 1],
    outputRange: [COLORS.power.low, COLORS.power.low, COLORS.power.mid, COLORS.power.high],
  });

  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={styles.label}>POWER</Text>
      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            { height: fillHeight, backgroundColor: fillColor },
          ]}
        />
        <View style={[styles.sweetSpot, { bottom: '70%' }]} />
        <View style={[styles.sweetSpot, { bottom: '80%' }]} />
      </View>
      <Text style={styles.tapText}>TAP!</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 70,
    paddingVertical: 10,
  },
  label: {
    color: COLORS.ui.text,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  barBackground: {
    width: 40,
    height: 160,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: '#555',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  sweetSpot: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  tapText: {
    color: COLORS.ui.accent,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
