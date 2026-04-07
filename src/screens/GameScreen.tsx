import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  StatusBar,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import HoleRenderer from '../components/course/HoleRenderer';
import SwingMeter, { SwingMeterHandle } from '../components/ui/SwingMeter';
import { getClub, CLUBS } from '../data/clubs';
import { getTerrainAt } from '../game/terrain';
import { distance } from '../utils/geometry';
import { fitHoleInView, cameraFollowingBall } from '../utils/coordinates';
import { getScoreName } from '../game/scoring';
import { Point } from '../types/terrain';
import hole1 from '../data/holes/hole1';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GameScreen() {
  const store = useGameStore();
  const {
    hole,
    ballPosition,
    strokes,
    currentClub,
    phase,
    aimAngle,
    lastShotResult,
  } = store;

  const [animBallPos, setAnimBallPos] = useState<Point | null>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meterRef = useRef<SwingMeterHandle>(null);

  // Load hole on mount
  useEffect(() => {
    store.loadHole(hole1);
  }, []);

  // Shot animation
  const animateShot = useCallback(
    (endPos: Point, landedOn: string, isWater: boolean) => {
      const start = { ...useGameStore.getState().ballPosition };
      const duration = 1400;
      const startTime = Date.now();

      const tick = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - t) ** 3;

        setAnimBallPos({
          x: start.x + (endPos.x - start.x) * eased,
          y: start.y + (endPos.y - start.y) * eased,
        });

        if (t < 1) {
          animRef.current = setTimeout(tick, 16);
        } else {
          setAnimBallPos(null);
          store.finishShot(endPos, landedOn as any, isWater);
        }
      };
      tick();
    },
    [store]
  );

  useEffect(() => {
    if (phase === 'flying' && lastShotResult) {
      animateShot(
        lastShotResult.endPosition,
        lastShotResult.landedOn,
        lastShotResult.landedOn === 'water'
      );
    }
    return () => {
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, [phase, lastShotResult, animateShot]);

  // Unified swing button handler
  const handleSwingTap = useCallback(() => {
    const p = useGameStore.getState().phase;
    if (p === 'aiming') {
      store.startShot();
    } else if (p === 'power') {
      const val = meterRef.current?.stop() ?? 0.5;
      store.setPower(val);
    } else if (p === 'accuracy') {
      const val = meterRef.current?.stop() ?? 0.5;
      const deviation = (val - 0.5) * 2;
      store.setAccuracy(deviation);
    }
  }, [store]);

  const handleAimLeft = useCallback(() => {
    const s = useGameStore.getState();
    s.setAimAngle(s.aimAngle - 0.05);
  }, []);

  const handleAimRight = useCallback(() => {
    const s = useGameStore.getState();
    s.setAimAngle(s.aimAngle + 0.05);
  }, []);

  const handleClubPrev = useCallback(() => {
    const s = useGameStore.getState();
    const idx = CLUBS.findIndex((c) => c.id === s.currentClub);
    if (idx > 0) s.setClub(CLUBS[idx - 1].id);
  }, []);

  const handleClubNext = useCallback(() => {
    const s = useGameStore.getState();
    const idx = CLUBS.findIndex((c) => c.id === s.currentClub);
    if (idx < CLUBS.length - 1) s.setClub(CLUBS[idx + 1].id);
  }, []);

  const handleStartPlaying = useCallback(() => store.setPhase('aiming'), [store]);
  const handlePlayAgain = useCallback(() => store.reset(), [store]);

  if (!hole) return null;

  const club = getClub(currentClub);
  const currentTerrain = getTerrainAt(ballPosition, hole.terrain);
  const distToPin = distance(ballPosition, hole.pinPosition);

  // Format distance like Pixel Golf
  const distText = distToPin > 100
    ? `${Math.round(distToPin)} yds`
    : `${Math.round(distToPin * 3)} ft`;

  // Camera
  const camera =
    phase === 'overview'
      ? fitHoleInView(hole.bounds, SCREEN_WIDTH, SCREEN_HEIGHT)
      : cameraFollowingBall(ballPosition, hole.pinPosition, hole.bounds, SCREEN_WIDTH, SCREEN_HEIGHT);

  const showAimLine = phase === 'aiming';
  const isPlaying = phase !== 'overview' && phase !== 'holed_out';
  const showPower = phase === 'power';
  const showAccuracy = phase === 'accuracy';
  const showMeter = showPower || showAccuracy;
  const isAnimating = phase === 'flying' || phase === 'rolling';

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Full-screen course */}
      <HoleRenderer
        hole={hole}
        camera={camera}
        ballPosition={ballPosition}
        aimAngle={aimAngle}
        showAimLine={showAimLine}
        selectedClubMaxDist={club.maxDistance}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        animatedBallPosition={animBallPos}
        showBall={!isAnimating || !!animBallPos}
      />

      {/* === HUD overlays === */}

      {/* Top Left: Hole badge + par info */}
      {isPlaying && (
        <View style={styles.topLeft}>
          <View style={styles.row}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardText}>card</Text>
            </View>
            <View style={styles.holeBadge}>
              <Text style={styles.holeNum}>1</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>par {hole.par}</Text>
            <Text style={styles.infoText}>shot {strokes + (phase === 'aiming' || phase === 'power' || phase === 'accuracy' ? 1 : 0)}</Text>
            <Text style={styles.infoTextDim}>best -</Text>
          </View>
        </View>
      )}

      {/* Top Right: Distance + Wind */}
      {isPlaying && (
        <View style={styles.topRight}>
          <View style={styles.distBox}>
            <View style={styles.ballIcon}>
              <View style={styles.ballIconInner} />
            </View>
            <Text style={styles.distText}>{distText}</Text>
          </View>
          <View style={styles.windBox}>
            <Text style={styles.windLabel}>wind</Text>
            <Text style={styles.windVal}>0</Text>
          </View>
        </View>
      )}

      {/* Bottom Left: Aim + Club */}
      {isPlaying && !isAnimating && (
        <View style={styles.bottomLeft}>
          <View style={styles.aimRow}>
            <TouchableOpacity style={styles.orangeBtn} onPress={handleAimLeft}>
              <Text style={styles.btnText}>{'<'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.orangeBtn}>
              <Text style={styles.btnText}>aim</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.orangeBtn} onPress={handleAimRight}>
              <Text style={styles.btnText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.clubRow}>
            <TouchableOpacity style={styles.orangeBtnSm} onPress={handleClubPrev}>
              <Text style={styles.btnTextSm}>{'<'}</Text>
            </TouchableOpacity>
            <View style={styles.clubBox}>
              <Text style={styles.clubText}>{club.name.toLowerCase()}</Text>
            </View>
            <TouchableOpacity style={styles.orangeBtnSm} onPress={handleClubNext}>
              <Text style={styles.btnTextSm}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Right: Meter + Swing */}
      {isPlaying && !isAnimating && (
        <View style={styles.bottomRight}>
          <View style={styles.meterWrap}>
            <SwingMeter
              ref={meterRef}
              visible={showMeter}
              label={showPower ? 'POWER' : 'ACCURACY'}
              speed={showAccuracy ? club.accuracy : 0.6}
              distanceText={distText}
            />
          </View>
          <TouchableOpacity style={styles.swingBtn} onPress={handleSwingTap} activeOpacity={0.7}>
            <Text style={styles.swingText}>swing</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overview overlay */}
      {phase === 'overview' && (
        <View style={styles.overlayCenter}>
          <Text style={styles.overlayTitle}>{hole.name}</Text>
          <Text style={styles.overlaySubtitle}>Par {hole.par} · {Math.round(distToPin)} yards</Text>
          <TouchableOpacity style={styles.playBtn} onPress={handleStartPlaying}>
            <Text style={styles.playBtnText}>play</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Score overlay */}
      {phase === 'holed_out' && (
        <View style={styles.overlayCenter}>
          <Text style={styles.scoreText}>{getScoreName(strokes, hole.par)}</Text>
          <Text style={styles.scoreDetail}>{strokes} strokes · Par {hole.par}</Text>
          <TouchableOpacity style={styles.playBtn} onPress={handlePlayAgain}>
            <Text style={styles.playBtnText}>play again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a3a0f',
  },

  // Top Left HUD
  topLeft: {
    position: 'absolute',
    top: 12,
    left: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardBadge: {
    backgroundColor: '#E65100',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  cardText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  holeBadge: {
    backgroundColor: '#C62828',
    width: 20,
    height: 20,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holeNum: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(30,30,30,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  infoText: {
    color: '#EEE',
    fontSize: 12,
    fontFamily: 'Courier',
    fontWeight: '600',
  },
  infoTextDim: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Courier',
  },

  // Top Right HUD
  topRight: {
    position: 'absolute',
    top: 12,
    right: 8,
    alignItems: 'flex-end',
  },
  distBox: {
    backgroundColor: 'rgba(30,30,30,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ballIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballIconInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
  },
  distText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  windBox: {
    backgroundColor: 'rgba(30,30,30,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 2,
    marginTop: 3,
    alignItems: 'center',
  },
  windLabel: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'Courier',
  },
  windVal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },

  // Bottom Left Controls
  bottomLeft: {
    position: 'absolute',
    bottom: 24,
    left: 8,
    gap: 5,
  },
  aimRow: {
    flexDirection: 'row',
    gap: 3,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  orangeBtn: {
    backgroundColor: '#E65100',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  orangeBtnSm: {
    backgroundColor: '#E65100',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  btnTextSm: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  clubBox: {
    backgroundColor: 'rgba(30,30,30,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 3,
    minWidth: 72,
    alignItems: 'center',
  },
  clubText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },

  // Bottom Right Controls
  bottomRight: {
    position: 'absolute',
    bottom: 24,
    right: 8,
    alignItems: 'center',
  },
  meterWrap: {
    height: 95,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  swingBtn: {
    backgroundColor: '#E65100',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 3,
    minWidth: 90,
    alignItems: 'center',
  },
  swingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },

  // Overlays
  overlayCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlayTitle: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    fontFamily: 'Courier',
  },
  overlaySubtitle: {
    color: '#81C784',
    fontSize: 16,
    marginTop: 6,
    fontFamily: 'Courier',
  },
  playBtn: {
    backgroundColor: '#E65100',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 3,
    marginTop: 20,
  },
  playBtnText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  scoreText: {
    color: '#FFF',
    fontSize: 38,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    textAlign: 'center',
    fontFamily: 'Courier',
  },
  scoreDetail: {
    color: '#DDD',
    fontSize: 16,
    marginTop: 8,
    fontFamily: 'Courier',
  },
});
