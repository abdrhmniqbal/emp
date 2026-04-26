/**
 * Purpose: Renders audio playback preferences, including crossfade controls.
 * Caller: Settings audio route.
 * Dependencies: HeroUI Native switch and slider, settings row pattern, crossfade settings module.
 * Main Functions: AudioSettingsScreen()
 * Side Effects: Persists audio crossfade preferences in document storage.
 */

import { Slider, Switch } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"

import { SettingsRow } from "@/components/patterns/settings-row"
import { setCrossfadeConfig } from "@/modules/settings/audio-crossfade"
import { useSettingsStore } from "@/modules/settings/settings.store"

function getSliderNumericValue(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

export default function AudioSettingsScreen() {
  const crossfadeConfig = useSettingsStore((state) => state.crossfadeConfig)
  const [sliderValue, setSliderValue] = React.useState<number | null>(null)
  const resolvedSliderValue = sliderValue ?? crossfadeConfig.durationSeconds

  async function handleCrossfadeToggle(isEnabled: boolean) {
    setSliderValue(null)
    await setCrossfadeConfig({ isEnabled })
  }

  async function handleCrossfadeSlidingComplete(value: number) {
    await setCrossfadeConfig({
      isEnabled: true,
      durationSeconds: value,
    })
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="gap-5 px-4 py-4">
        <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
          <SettingsRow
            title="Crossfade"
            description={
              crossfadeConfig.isEnabled
                ? "Blend between songs during playback."
                : "Play each song with a clean transition."
            }
            onPress={undefined}
            showChevron={false}
            rightContent={
              <Switch
                isSelected={crossfadeConfig.isEnabled}
                onSelectedChange={(isSelected) => {
                  void handleCrossfadeToggle(isSelected)
                }}
              />
            }
          />
        </View>

        {crossfadeConfig.isEnabled ? (
          <View className="rounded-[28px] border border-border/60 bg-default/25 px-5 pt-4 pb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm text-muted">Duration</Text>
              <Text className="text-sm font-medium text-foreground">
                {Math.round(resolvedSliderValue)}s
              </Text>
            </View>
            <Slider
              minValue={1}
              maxValue={12}
              step={1}
              value={resolvedSliderValue}
              onChange={(value) => {
                setSliderValue(getSliderNumericValue(value))
              }}
              onChangeEnd={(value) => {
                void handleCrossfadeSlidingComplete(getSliderNumericValue(value))
              }}
            >
              <Slider.Track className="h-2 rounded-full bg-border">
                <Slider.Fill className="rounded-full bg-accent" />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
            <Text className="mt-2 text-xs text-muted">
              Choose how long the next track overlaps with the current one.
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}
