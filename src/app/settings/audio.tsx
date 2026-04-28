/**
 * Purpose: Renders audio playback preferences, including crossfade controls.
 * Caller: Settings audio route.
 * Dependencies: HeroUI Native ListGroup, switch and slider, react-i18next, crossfade settings module.
 * Main Functions: AudioSettingsScreen()
 * Side Effects: Persists audio crossfade preferences in document storage.
 */

import { ListGroup, Separator, Slider, Switch } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { setCrossfadeConfig } from "@/modules/settings/audio-crossfade"
import { useSettingsStore } from "@/modules/settings/settings.store"

function getSliderNumericValue(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

export default function AudioSettingsScreen() {
  const { t } = useTranslation()
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
        <ListGroup >
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.audio.crossfade")}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {crossfadeConfig.isEnabled
                  ? t("settings.audio.crossfadeEnabled")
                  : t("settings.audio.crossfadeDisabled")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch
                isSelected={crossfadeConfig.isEnabled}
                onSelectedChange={(isSelected) => {
                  void handleCrossfadeToggle(isSelected)
                }}
              />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          {crossfadeConfig.isEnabled ? (
            <>
              <Separator className="mx-4" />
              <ListGroup.Item>
                <ListGroup.ItemContent>
                  <View className="mb-3 flex-row items-center justify-between">
                    <ListGroup.ItemTitle>
                      {t("settings.audio.duration")}
                    </ListGroup.ItemTitle>
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
                    {t("settings.audio.durationHint")}
                  </Text>
                </ListGroup.ItemContent>
              </ListGroup.Item>
            </>
          ) : null}
        </ListGroup>
      </View>
    </ScrollView>
  )
}
