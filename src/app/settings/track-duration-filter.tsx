/**
 * Purpose: Renders minimum track-duration filtering controls for library indexing.
 * Caller: Settings track-duration-filter route.
 * Dependencies: HeroUI Native slider and press feedback, react-i18next, settings store, indexer service, theme colors.
 * Main Functions: TrackDurationFilterScreen()
 * Side Effects: Persists duration filter settings and triggers reindexing when values change.
 */

import { PressableFeedback, Slider } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTickIcon from "@/components/icons/local/tick"
import { useThemeColors } from "@/modules/ui/theme"
import {
  setTrackDurationFilterConfig,
  type TrackDurationFilterMode,
} from "@/modules/settings/track-duration-filter"
import { startIndexing } from "@/modules/indexer/indexer.service"
import { useIndexerStore } from "@/modules/indexer/indexer.store"
import { useSettingsStore } from "@/modules/settings/settings.store"

interface DurationOption {
  labelKey: string
  value: TrackDurationFilterMode
  descriptionKey?: string
}

const DURATION_OPTIONS: DurationOption[] = [
  {
    labelKey: "settings.trackDuration.noFilter",
    value: "off",
    descriptionKey: "settings.trackDuration.noFilterDescription",
  },
  {
    labelKey: "settings.trackDuration.min30",
    value: "min30s",
    descriptionKey: "settings.trackDuration.min30Description",
  },
  {
    labelKey: "settings.trackDuration.min60",
    value: "min60s",
    descriptionKey: "settings.trackDuration.min60Description",
  },
  {
    labelKey: "settings.trackDuration.min120",
    value: "min120s",
    descriptionKey: "settings.trackDuration.min120Description",
  },
  {
    labelKey: "settings.trackDuration.custom",
    value: "custom",
    descriptionKey: "settings.trackDuration.customDescription",
  },
]

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  if (total < 60) {
    return `${total}s`
  }

  const minutes = Math.floor(total / 60)
  const remainder = total % 60
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`
}

function getSliderNumericValue(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

export default function TrackDurationFilterScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const config = useSettingsStore(
    (state) => state.trackDurationFilterConfig
  )
  const [customSliderValue, setCustomSliderValue] = React.useState<
    number | null
  >(null)
  const resolvedCustomSliderValue =
    customSliderValue ?? config.customMinimumSeconds

  async function handleModeSelect(mode: TrackDurationFilterMode) {
    await setTrackDurationFilterConfig({ mode })

    if (mode !== "custom") {
      setCustomSliderValue(null)
      await startIndexing(false, true)
    }
  }

  async function handleCustomSlidingComplete(value: number) {
    await setTrackDurationFilterConfig({
      mode: "custom",
      customMinimumSeconds: value,
    })
    await startIndexing(false, true)
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
          {DURATION_OPTIONS.map((option, index) => (
            <PressableFeedback
              key={option.value}
              onPress={() => {
                void handleModeSelect(option.value)
              }}
              className={`flex-row items-center px-5 py-4 active:opacity-70 ${
                index > 0 ? "border-t border-border/60" : ""
              }`}
              isDisabled={isIndexing}
            >
              <View className="flex-1 gap-0.5 pr-2">
                <Text className="text-[16px] font-medium text-foreground">
                  {t(option.labelKey)}
                </Text>
                {option.descriptionKey ? (
                  <Text className="text-[13px] leading-5 text-muted">
                    {t(option.descriptionKey)}
                  </Text>
                ) : null}
              </View>
              {config.mode === option.value && (
                <LocalTickIcon
                  fill="none"
                  width={24}
                  height={24}
                  color={theme.accent}
                />
              )}
            </PressableFeedback>
          ))}
        </View>

        {config.mode === "custom" ? (
          <View className="rounded-[28px] border border-border/60 bg-default/25 px-5 pt-4 pb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm text-muted">
                {t("settings.trackDuration.minimumDuration")}
              </Text>
              <Text className="text-sm font-medium text-foreground">
                {formatDuration(resolvedCustomSliderValue)}
              </Text>
            </View>
            <Slider
              minValue={0}
              maxValue={600}
              step={5}
              value={resolvedCustomSliderValue}
              isDisabled={isIndexing}
              onChange={(value) => {
                setCustomSliderValue(getSliderNumericValue(value))
              }}
              onChangeEnd={(value) => {
                void handleCustomSlidingComplete(getSliderNumericValue(value))
              }}
            >
              <Slider.Track className="h-2 rounded-full bg-border">
                <Slider.Fill className="rounded-full bg-accent" />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
            <Text className="mt-2 text-xs text-muted">
              {t("settings.trackDuration.changesHint")}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}
