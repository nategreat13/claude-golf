import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { formatScore } from '../../game/scoring';
import { TERRAIN } from '../../data/terrainTypes';
import { TerrainType } from '../../types/terrain';
import { COLORS } from '../../utils/colors';

interface ScoreCardProps {
  strokes: number;
  par: number;
  holeName: string;
  distanceToPin: number;
  currentTerrain: TerrainType;
}

export default function ScoreCard({
  strokes,
  par,
  holeName,
  distanceToPin,
  currentTerrain,
}: ScoreCardProps) {
  const scoreStr = strokes === 0 ? '-' : formatScore(strokes, par);
  const scoreColor =
    strokes === 0
      ? COLORS.ui.text
      : strokes <= par
        ? COLORS.ui.primary
        : strokes <= par + 1
          ? COLORS.ui.accent
          : COLORS.ui.danger;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.holeName}>{holeName}</Text>
        <Text style={styles.parText}>Par {par}</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.strokeLabel}>Stroke</Text>
        <Text style={[styles.strokeCount, { color: scoreColor }]}>
          {strokes === 0 ? '-' : strokes}
        </Text>
        <Text style={[styles.scoreText, { color: scoreColor }]}>{scoreStr}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.distText}>{Math.round(distanceToPin)}y</Text>
        <Text style={[styles.terrainText, { color: TERRAIN[currentTerrain].color }]}>
          {TERRAIN[currentTerrain].label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  left: {
    alignItems: 'flex-start',
  },
  center: {
    alignItems: 'center',
  },
  right: {
    alignItems: 'flex-end',
  },
  holeName: {
    color: COLORS.ui.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  parText: {
    color: '#AAA',
    fontSize: 12,
  },
  strokeLabel: {
    color: '#AAA',
    fontSize: 10,
  },
  strokeCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distText: {
    color: COLORS.ui.text,
    fontSize: 14,
    fontWeight: '600',
  },
  terrainText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
