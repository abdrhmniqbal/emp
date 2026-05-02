/**
 * Purpose: Renders indexed-track player quick actions plus sleep timer controls for the full player.
 * Caller: Player route.
 * Dependencies: HeroUI Native sheet components, router navigation, player queue selector, player sleep timer service/store, playlist form draft store, playlist picker flow, artist hydration, and reusable artist picker sheet.
 * Main Functions: PlayerActionSheet()
 * Side Effects: Navigates to artist/album routes, opens playlist picker workflows, preloads queue tracks into playlist creation, and updates player sleep timer state.
 */

import type { SleepTimerMode, Track } from "@/modules/player/player.types"
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import {
  BottomSheet,
  Button,
  PressableFeedback,
  Slider,
  Switch,
  Toast,
  useToast,
} from "heroui-native"
import { useQueries } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { Platform, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { ArtistPickerSheet } from "@/components/blocks/artist-picker-sheet"
import { buildArtistPickerItems } from "@/components/blocks/artist-picker.utils"
import { PlaylistPickerSheet } from "@/components/blocks/playlist-picker-sheet"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { getArtistByName } from "@/modules/library/library.repository"
import {
  usePlayerQueue,
  useSleepTimerState,
} from "@/modules/player/player-selectors"
import {
  clearSleepTimer,
  setSleepTimerClock,
  setSleepTimerMinutes,
  setSleepTimerPlayCount,
  setSleepTimerTrackEnd,
} from "@/modules/player/sleep-timer.service"
import { usePlaylistPickerSelection } from "@/modules/playlist/playlist-picker-selection.hook"
import { setPlaylistFormDraft } from "@/modules/playlist/playlist-form-draft.store"

interface ArtistPickerSourceArtist {
  name: string
  artwork: string | null
  trackCount: number
}

interface PlayerActionSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  track: Track | null
  artistNames: string[]
  onNavigate?: () => void
}

const TIMER_MINUTES_MAX = 180
const PLAY_COUNT_MAX = 15

function getSliderNumericValue(value: number | number[]) {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

function padTimeUnit(value: number) {
  return value.toString().padStart(2, "0")
}

function getSleepTimerSummary(
  t: ReturnType<typeof useTranslation>["t"],
  mode: SleepTimerMode,
  minutes: number,
  playCount: number,
  clockHour: number | null,
  clockMinute: number | null
) {
  if (mode === "minutes" && minutes > 0) {
    return t("player.sleepTimer.timerValueMinutes", { value: minutes })
  }

  if (mode === "playCount" && playCount > 0) {
    return t("player.sleepTimer.playCountValue", { value: playCount })
  }

  if (mode === "trackEnd") {
    return t("player.sleepTimer.endOfCurrentTrack")
  }

  if (
    mode === "clock" &&
    clockHour !== null &&
    clockMinute !== null
  ) {
    return t("player.sleepTimer.customTimeValue", {
      value: `${padTimeUnit(clockHour)}:${padTimeUnit(clockMinute)}`,
    })
  }

  return t("player.sleepTimer.off")
}

function getLockedMode({
  timerMinutes,
  playCount,
  endOfCurrentTrack,
  customTimeEnabled,
}: {
  timerMinutes: number
  playCount: number
  endOfCurrentTrack: boolean
  customTimeEnabled: boolean
}) {
  if (timerMinutes > 0) {
    return "minutes" as const
  }

  if (playCount > 0) {
    return "playCount" as const
  }

  if (endOfCurrentTrack) {
    return "trackEnd" as const
  }

  if (customTimeEnabled) {
    return "clock" as const
  }

  return null
}

function SleepTimerOption({
  title,
  description,
  disabled,
  children,
}: {
  title: string
  description: string
  disabled: boolean
  children?: React.ReactNode
}) {
  return (
    <View
      className={disabled ? "opacity-45" : ""}
      pointerEvents={disabled ? "none" : "auto"}
    >
      <View className="gap-2 rounded-lg px-1 py-2">
        <View className="gap-1">
          <Text className="text-base font-semibold text-foreground">
            {title}
          </Text>
          <Text className="text-sm text-muted">
            {description}
          </Text>
        </View>
        {children}
      </View>
    </View>
  )
}

export function PlayerActionSheet({
  visible,
  onOpenChange,
  track,
  artistNames,
  onNavigate,
}: PlayerActionSheetProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const queue = usePlayerQueue()
  const sleepTimer = useSleepTimerState()
  const canUseLibraryActions = Boolean(track && track.isExternal !== true)
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(0)
  const [playCount, setPlayCount] = useState(0)
  const [endOfCurrentTrack, setEndOfCurrentTrack] = useState(false)
  const [customTimeEnabled, setCustomTimeEnabled] = useState(false)
  const [customHour, setCustomHour] = useState(new Date().getHours())
  const [customMinute, setCustomMinute] = useState(new Date().getMinutes())
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false)

  useEffect(() => {
    const now = new Date()
    setTimerMinutes(sleepTimer.mode === "minutes" ? sleepTimer.minutes : 0)
    setPlayCount(sleepTimer.mode === "playCount" ? sleepTimer.playCount : 0)
    setEndOfCurrentTrack(sleepTimer.mode === "trackEnd")
    setCustomTimeEnabled(sleepTimer.mode === "clock")
    setCustomHour(
      sleepTimer.mode === "clock" && sleepTimer.clockHour !== null
        ? sleepTimer.clockHour
        : now.getHours()
    )
    setCustomMinute(
      sleepTimer.mode === "clock" && sleepTimer.clockMinute !== null
        ? sleepTimer.clockMinute
        : now.getMinutes()
    )
    setShowCustomTimePicker(
      sleepTimer.mode === "clock" && Platform.OS === "ios"
    )
  }, [sleepTimer])

  const customTimeDate = useMemo(() => {
    const date = new Date()
    date.setHours(customHour, customMinute, 0, 0)
    return date
  }, [customHour, customMinute])

  const normalizedArtistNames = useMemo(
    () =>
      canUseLibraryActions
        ? Array.from(
            new Set(
              artistNames
                .map((name) => name.trim())
                .filter((name) => name.length > 0)
            )
          )
        : [],
    [artistNames, canUseLibraryActions]
  )

  const resolvedArtistQueries = useQueries({
    queries: normalizedArtistNames.map((name) => ({
      queryKey: ["artists", "name", name.toLowerCase()] as const,
      enabled: canUseLibraryActions && name.length > 0,
      queryFn: async () => await getArtistByName(name),
    })),
  })

  const resolvedArtists = useMemo<ArtistPickerSourceArtist[]>(
    () =>
      resolvedArtistQueries
        .map((query, index) => {
          const name = normalizedArtistNames[index]
          if (!name) {
            return null
          }

          return {
            name,
            artwork: query.data?.artwork || null,
            trackCount: query.data?.trackCount || 0,
          }
        })
        .filter((artist): artist is ArtistPickerSourceArtist => Boolean(artist)),
    [normalizedArtistNames, resolvedArtistQueries]
  )

  const artistPickerSource = useMemo(() => {
    const artistsByName = new Map(
      resolvedArtists.map((artist) => [artist.name.trim().toLowerCase(), artist])
    )

    const buildArtist = (name: string) => {
      const matchedArtist = artistsByName.get(name.trim().toLowerCase())

      return {
        name,
        artwork: matchedArtist?.artwork || null,
        trackCount: matchedArtist?.trackCount || 0,
      }
    }

    return {
      artist: artistNames[0] ? buildArtist(artistNames[0]) : null,
      featuredArtists: artistNames.slice(1).map((name) => ({
        artist: buildArtist(name),
      })),
    }
  }, [artistNames, resolvedArtists])

  const artistPickerItems = useMemo(
    () =>
      buildArtistPickerItems(
        artistPickerSource,
        artistNames,
        (count) => t("library.count.track", { count })
      ),
    [artistNames, artistPickerSource, t]
  )

  const sleepTimerSummary = useMemo(
    () =>
      getSleepTimerSummary(
        t,
        sleepTimer.mode,
        sleepTimer.minutes,
        sleepTimer.playCount,
        sleepTimer.clockHour,
        sleepTimer.clockMinute
      ),
    [
      sleepTimer.clockHour,
      sleepTimer.clockMinute,
      sleepTimer.minutes,
      sleepTimer.mode,
      sleepTimer.playCount,
      t,
    ]
  )

  const lockedMode = getLockedMode({
    timerMinutes,
    playCount,
    endOfCurrentTrack,
    customTimeEnabled,
  })

  const showPlaylistToast = (title: string, description?: string) => {
    toast.show({
      duration: 1800,
      component: (props) => (
        <Toast {...props} variant="accent" placement="bottom">
          <Toast.Title className="text-sm font-semibold">{title}</Toast.Title>
          {description ? (
            <Toast.Description className="text-xs text-muted">
              {description}
            </Toast.Description>
          ) : null}
        </Toast>
      ),
    })
  }

  const handleOpenPlaylistPicker = () => {
    onOpenChange(false)
    setIsPlaylistPickerOpen(true)
  }

  const handleOpenSleepTimerSheet = () => {
    onOpenChange(false)
    setIsSleepTimerOpen(true)
  }

  const handleCustomTimePickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowCustomTimePicker(false)
    }

    if (event.type === "dismissed" || !selectedDate) {
      return
    }

    const nextHour = selectedDate.getHours()
    const nextMinute = selectedDate.getMinutes()

    setCustomHour(nextHour)
    setCustomMinute(nextMinute)
    setCustomTimeEnabled(true)
    setTimerMinutes(0)
    setPlayCount(0)
    setEndOfCurrentTrack(false)
    setSleepTimerClock(nextHour, nextMinute)
  }

  const handleOpenArtist = (artistName: string) => {
    const normalizedArtistName = artistName.trim()
    if (!normalizedArtistName) {
      return
    }

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    setIsArtistSelectionOpen(false)
    setIsSleepTimerOpen(false)
    onNavigate?.()
    router.dismissTo({
      pathname: "/artist/[name]",
      params: { name: normalizedArtistName },
    })
  }

  const handleOpenArtistChooser = () => {
    const normalized = artistNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    if (normalized.length === 0) {
      return
    }

    if (normalized.length === 1) {
      handleOpenArtist(normalized[0] || "")
      return
    }

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    setIsSleepTimerOpen(false)
    setIsArtistSelectionOpen(true)
  }

  const handleOpenAlbum = () => {
    const albumName = track?.album?.trim()
    if (!albumName) {
      return
    }

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    setIsSleepTimerOpen(false)
    onNavigate?.()
    router.dismissTo({
      pathname: "/album/[name]",
      params: {
        name: albumName,
        transitionId: resolveAlbumTransitionId({
          id: track?.albumId,
          title: albumName,
        }),
      },
    })
  }

  const handleCreatePlaylist = () => {
    setIsPlaylistPickerOpen(false)
    router.push("/playlist/form")
  }

  const handleSaveQueueToPlaylist = () => {
    const queueTrackIds = Array.from(
      new Set(
        (queue.length > 0 ? queue : [track])
          .filter((item): item is Track => Boolean(item) && !item.isExternal)
          .map((item) => item.id)
      )
    )

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    setIsArtistSelectionOpen(false)
    setIsSleepTimerOpen(false)
    setPlaylistFormDraft(queueTrackIds, "queue")
    onNavigate?.()
    router.dismissTo("/(main)/(library)/playlist/form")
  }

  const { isSelecting, handleSelectPlaylist } = usePlaylistPickerSelection({
    trackId: canUseLibraryActions ? track?.id : undefined,
    onSelectionApplied: () => {
      setIsPlaylistPickerOpen(false)
    },
    showPlaylistToast,
  })

  if (!track || !canUseLibraryActions) {
    return null
  }

  return (
    <>
      <BottomSheet isOpen={visible} onOpenChange={onOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            backgroundClassName="bg-surface"
            className="gap-1"
          >
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenSleepTimerSheet}
            >
              <Text className="text-base font-medium text-foreground">
                {t("player.sleepTimer.title")}
              </Text>
              <Text className="text-sm text-muted">
                {sleepTimerSummary}
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenArtistChooser}
            >
              <Text className="text-base font-medium text-foreground">
                {t("player.menu.goToArtist")}
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenAlbum}
            >
              <Text className="text-base font-medium text-foreground">
                {t("player.menu.goToAlbum")}
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenPlaylistPicker}
            >
              <Text className="text-base font-medium text-foreground">
                {t("track.addToPlaylist")}
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleSaveQueueToPlaylist}
            >
              <Text className="text-base font-medium text-foreground">
                {t("playlist.saveQueueToPlaylist")}
              </Text>
            </PressableFeedback>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={isSleepTimerOpen} onOpenChange={setIsSleepTimerOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            backgroundClassName="bg-surface"
            className="gap-4"
          >
            <BottomSheet.Title className="text-xl">
              {t("player.sleepTimer.title")}
            </BottomSheet.Title>

            <SleepTimerOption
              title={t("player.sleepTimer.timer")}
              description={t("player.sleepTimer.timerDescription")}
              disabled={lockedMode !== null && lockedMode !== "minutes"}
            >
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">
                    {t("player.sleepTimer.timerValue")}
                  </Text>
                  <Text className="text-sm text-muted">
                    {timerMinutes > 0
                      ? t("player.sleepTimer.timerValueMinutes", {
                          value: timerMinutes,
                        })
                      : t("player.sleepTimer.off")}
                  </Text>
                </View>
                <Slider
                  minValue={0}
                  maxValue={TIMER_MINUTES_MAX}
                  step={1}
                  value={timerMinutes}
                  onChange={(value) => {
                    setTimerMinutes(getSliderNumericValue(value))
                  }}
                  onChangeEnd={(value) => {
                    const nextMinutes = getSliderNumericValue(value)
                    setTimerMinutes(nextMinutes)
                    setPlayCount(0)
                    setEndOfCurrentTrack(false)
                    setCustomTimeEnabled(false)
                    setShowCustomTimePicker(false)
                    setSleepTimerMinutes(nextMinutes)
                  }}
                >
                  <Slider.Track className="h-2 rounded-full bg-border">
                    <Slider.Fill className="rounded-full bg-accent" />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
              </View>
            </SleepTimerOption>

            <SleepTimerOption
              title={t("player.sleepTimer.playCount")}
              description={t("player.sleepTimer.playCountDescription")}
              disabled={lockedMode !== null && lockedMode !== "playCount"}
            >
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">
                    {t("player.sleepTimer.playCountValueLabel")}
                  </Text>
                  <Text className="text-sm text-muted">
                    {playCount > 0
                      ? t("player.sleepTimer.playCountValue", {
                          value: playCount,
                        })
                      : t("player.sleepTimer.off")}
                  </Text>
                </View>
                <Slider
                  minValue={0}
                  maxValue={PLAY_COUNT_MAX}
                  step={1}
                  value={playCount}
                  onChange={(value) => {
                    setPlayCount(getSliderNumericValue(value))
                  }}
                  onChangeEnd={(value) => {
                    const nextPlayCount = getSliderNumericValue(value)
                    setTimerMinutes(0)
                    setPlayCount(nextPlayCount)
                    setEndOfCurrentTrack(false)
                    setCustomTimeEnabled(false)
                    setShowCustomTimePicker(false)
                    setSleepTimerPlayCount(nextPlayCount)
                  }}
                >
                  <Slider.Track className="h-2 rounded-full bg-border">
                    <Slider.Fill className="rounded-full bg-accent" />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
              </View>
            </SleepTimerOption>

            <SleepTimerOption
              title={t("player.sleepTimer.endOfCurrentTrack")}
              description={t("player.sleepTimer.endOfCurrentTrackDescription")}
              disabled={lockedMode !== null && lockedMode !== "trackEnd"}
            >
              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-sm text-muted">
                  {endOfCurrentTrack
                    ? t("player.sleepTimer.enabled")
                    : t("player.sleepTimer.off")}
                </Text>
                <Switch
                  isSelected={endOfCurrentTrack}
                  onSelectedChange={(isSelected) => {
                    if (!isSelected) {
                      setEndOfCurrentTrack(false)
                      clearSleepTimer()
                      return
                    }

                    setTimerMinutes(0)
                    setPlayCount(0)
                    setEndOfCurrentTrack(true)
                    setCustomTimeEnabled(false)
                    setShowCustomTimePicker(false)
                    setSleepTimerTrackEnd()
                  }}
                />
              </View>
            </SleepTimerOption>

            <SleepTimerOption
              title={t("player.sleepTimer.customTime")}
              description={t("player.sleepTimer.customTimeDescription")}
              disabled={lockedMode !== null && lockedMode !== "clock"}
            >
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">
                    {t("player.sleepTimer.customTimeValueLabel")}
                  </Text>
                  <Text className="text-sm text-muted">
                    {customTimeEnabled
                      ? t("player.sleepTimer.customTimeValue", {
                          value: `${padTimeUnit(customHour)}:${padTimeUnit(customMinute)}`,
                        })
                      : t("player.sleepTimer.off")}
                  </Text>
                </View>

                {!customTimeEnabled ? (
                  <Button
                    variant="secondary"
                    onPress={() => {
                      setTimerMinutes(0)
                      setPlayCount(0)
                      setEndOfCurrentTrack(false)
                      setCustomTimeEnabled(true)
                      if (Platform.OS === "ios") {
                        setShowCustomTimePicker(true)
                        setSleepTimerClock(customHour, customMinute)
                        return
                      }

                      setShowCustomTimePicker(true)
                    }}
                  >
                    {t("player.sleepTimer.setCustomTime")}
                  </Button>
                ) : (
                  <View className="gap-3">
                    <Button
                      variant="ghost"
                      onPress={() => {
                        setShowCustomTimePicker(true)
                      }}
                    >
                      {t("player.sleepTimer.setCustomTime")}
                    </Button>

                    {showCustomTimePicker ? (
                      <DateTimePicker
                        value={customTimeDate}
                        mode="time"
                        is24Hour
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleCustomTimePickerChange}
                      />
                    ) : null}

                    <Button
                      variant="danger"
                      onPress={() => {
                        setCustomTimeEnabled(false)
                        setShowCustomTimePicker(false)
                        clearSleepTimer()
                      }}
                    >
                      {t("player.sleepTimer.clearCustomTime")}
                    </Button>
                  </View>
                )}
              </View>
            </SleepTimerOption>

            <View className="flex-row gap-3">
              <Button
                variant="danger"
                className="flex-1"
                onPress={() => {
                  clearSleepTimer()
                  setIsSleepTimerOpen(false)
                }}
              >
                {t("player.sleepTimer.cancelTimer")}
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <PlaylistPickerSheet
        isOpen={isPlaylistPickerOpen}
        onOpenChange={setIsPlaylistPickerOpen}
        trackId={track.id}
        isSelecting={isSelecting}
        onCreatePlaylist={handleCreatePlaylist}
        onSelectPlaylist={(playlist) => {
          void handleSelectPlaylist(playlist)
        }}
      />

      <ArtistPickerSheet
        isOpen={isArtistSelectionOpen}
        onOpenChange={setIsArtistSelectionOpen}
        title={t("player.selectArtistTitle")}
        items={artistPickerItems}
        onSelectValue={(value) => {
          handleOpenArtist(value)
        }}
      />
    </>
  )
}
