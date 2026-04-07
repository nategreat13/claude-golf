import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { CLUBS } from '../../data/clubs';
import { TerrainType } from '../../types/terrain';
import { COLORS } from '../../utils/colors';

interface ClubSelectorProps {
  selectedClub: string;
  onSelectClub: (clubId: string) => void;
  currentTerrain: TerrainType;
  disabled: boolean;
}

export default function ClubSelector({
  selectedClub,
  onSelectClub,
  currentTerrain,
  disabled,
}: ClubSelectorProps) {
  return (
    <View style={styles.container}>
      {CLUBS.map((club) => {
        const isSelected = club.id === selectedClub;
        const canUse = club.canUseFrom.includes(currentTerrain);

        return (
          <TouchableOpacity
            key={club.id}
            style={[
              styles.clubButton,
              isSelected && styles.selected,
              !canUse && styles.disabled,
            ]}
            onPress={() => canUse && !disabled && onSelectClub(club.id)}
            disabled={!canUse || disabled}
            activeOpacity={0.7}
          >
            <Text style={[styles.clubName, isSelected && styles.selectedText]}>
              {club.name}
            </Text>
            <Text style={[styles.clubDist, isSelected && styles.selectedText]}>
              {club.maxDistance}y
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clubButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.ui.card,
    borderWidth: 2,
    borderColor: COLORS.ui.cardBorder,
    alignItems: 'center',
    minWidth: 70,
  },
  selected: {
    borderColor: COLORS.ui.primary,
    backgroundColor: '#1a3a1a',
  },
  disabled: {
    opacity: 0.35,
  },
  clubName: {
    color: COLORS.ui.text,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedText: {
    color: COLORS.ui.primary,
  },
  clubDist: {
    color: '#999',
    fontSize: 11,
    marginTop: 2,
  },
});
