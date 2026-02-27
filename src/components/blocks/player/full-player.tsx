import { useStore } from '@nanostores/react'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as React from 'react'
import { useEffect } from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { $isPlayerExpanded, $showPlayerQueue } from '@/hooks/scroll-bars.store'
import {
  $currentColors,
  updateColorsForImage,
} from '@/modules/player/player-colors.store'
import {
  $currentTime,
  $currentTrack,
  $duration,
  $isPlaying,
} from '@/modules/player/player.store'

import { AlbumArtView } from './album-art-view'
import { PlaybackControls } from './playback-controls'
import { PlayerFooter } from './player-footer'
import { PlayerHeader } from './player-header'
import { ProgressBar } from './progress-bar'
import { QueueView } from './queue-view'
import { TrackInfo } from './track-info'

const SCREEN_HEIGHT = Dimensions.get('window').height
const EXPAND_FROM_Y = 72
const OPEN_SPRING_CONFIG = {
  damping: 22,
  stiffness: 260,
  mass: 0.9,
}
const BACKGROUND_DARKEN_OVERLAY = 'rgba(0, 0, 0, 0.15)'

export function FullPlayer() {
  const router = useRouter()
  const isExpanded = useStore($isPlayerExpanded)
  const currentTrack = useStore($currentTrack)
  const isPlaying = useStore($isPlaying)
  const currentTimeVal = useStore($currentTime)
  const durationVal = useStore($duration)
  const showQueue = useStore($showPlayerQueue)
  const colors = useStore($currentColors)

  const translateY = useSharedValue(SCREEN_HEIGHT)

  useEffect(() => {
    updateColorsForImage(currentTrack?.image)
  }, [currentTrack?.image])

  useEffect(() => {
    if (isExpanded) {
      translateY.value = EXPAND_FROM_Y
      translateY.value = withSpring(0, OPEN_SPRING_CONFIG)
    }
    else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 })
    }
  }, [isExpanded, translateY])

  const closePlayer = () => {
    $isPlayerExpanded.set(false)
    $showPlayerQueue.set(false)
  }

  const handleArtistPress = () => {
    const artistName = currentTrack?.artist?.trim()
    if (!artistName) {
      return
    }

    closePlayer()
    router.push({
      pathname: '/(main)/(library)/artist/[name]',
      params: { name: artistName },
    })
  }

  const panGesture = Gesture.Pan()
    .activeOffsetY(20)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(closePlayer)()
      }
      else {
        translateY.value = withSpring(0, OPEN_SPRING_CONFIG)
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateY.value,
      [EXPAND_FROM_Y, 0],
      [0, 1],
      Extrapolation.CLAMP,
    )

    return {
      transform: [
        { translateY: translateY.value },
        {
          scale: interpolate(progress, [0, 1], [0.985, 1], Extrapolation.CLAMP),
        },
      ],
      borderRadius: interpolate(progress, [0, 1], [22, 0], Extrapolation.CLAMP),
      overflow: 'hidden',
    }
  })

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateY.value,
      [EXPAND_FROM_Y, 0],
      [0, 1],
      Extrapolation.CLAMP,
    )

    return {
      opacity: interpolate(progress, [0, 1], [0.65, 1], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(progress, [0, 1], [18, 0], Extrapolation.CLAMP),
        },
      ],
    }
  })

  if (!currentTrack)
    return null

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            zIndex: 1000,
          },
        ]}
      >
        <View className="relative flex-1">
          <LinearGradient
            colors={[colors.bg, colors.secondary, '#09090B']}
            locations={[0, 0.6, 1]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: BACKGROUND_DARKEN_OVERLAY }]}
          />

          <Animated.View
            style={contentAnimatedStyle}
            className="flex-1 justify-between px-6 pt-12 pb-16"
          >
            <PlayerHeader onClose={closePlayer} />

            {showQueue
              ? (
                  <QueueView currentTrack={currentTrack} />
                )
              : (
                  <AlbumArtView currentTrack={currentTrack} />
                )}

            <TrackInfo
              track={currentTrack}
              compact={showQueue}
              onPressArtist={handleArtistPress}
            />

            <ProgressBar
              currentTime={currentTimeVal}
              duration={durationVal}
              compact={showQueue}
            />

            <PlaybackControls isPlaying={isPlaying} compact={showQueue} />

            <PlayerFooter />
          </Animated.View>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}
