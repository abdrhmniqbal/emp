/**
 * Purpose: Lets users configure symbol-based splitting for artists/genres, unsplit artist exceptions, and artist display mode.
 * Caller: Settings split-multiple-values route.
 * Dependencies: React Native inputs, settings split config module/store, and split settings reindex prompt state.
 * Main Functions: SplitMultipleValuesSettingsScreen()
 * Side Effects: Persists split settings config and marks deferred library reindex prompt.
 */

import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, TextInput, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTickIcon from "@/components/icons/local/tick"
import { setSplitMultipleValueConfig } from "@/modules/settings/split-multiple-values"
import { useSettingsStore } from "@/modules/settings/settings.store"
import { markSplitSettingsReindexPrompt } from "@/modules/settings/split-settings-state"
import { useThemeColors } from "@/modules/ui/theme"

type SplitMode = "original" | "split"

function parseCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function toCommaText(values: string[]) {
  return values.join(", ")
}

export default function SplitMultipleValuesSettingsScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const config = useSettingsStore((state) => state.splitMultipleValueConfig)
  const [artistSymbolsInput, setArtistSymbolsInput] = React.useState(
    toCommaText(config.artistSplitSymbols)
  )
  const [unsplitArtistsInput, setUnsplitArtistsInput] = React.useState(
    toCommaText(config.unsplitArtists)
  )
  const [genreSymbolsInput, setGenreSymbolsInput] = React.useState(
    toCommaText(config.genreSplitSymbols)
  )
  const [artistSplitMode, setArtistSplitMode] = React.useState<SplitMode>(
    config.artistSplitMode
  )

  React.useEffect(() => {
    setArtistSymbolsInput(toCommaText(config.artistSplitSymbols))
    setUnsplitArtistsInput(toCommaText(config.unsplitArtists))
    setGenreSymbolsInput(toCommaText(config.genreSplitSymbols))
    setArtistSplitMode(config.artistSplitMode)
  }, [config])

  async function updateSplitConfig(next: {
    artistSplitSymbols?: string[]
    unsplitArtists?: string[]
    genreSplitSymbols?: string[]
    artistSplitMode?: SplitMode
  }) {
    await setSplitMultipleValueConfig(next)
    markSplitSettingsReindexPrompt()
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="gap-5 px-4 py-4">
        <View className="rounded-[28px] border border-border/60 bg-background px-5 py-4">
          <Text className="mb-2 text-[16px] font-medium text-foreground">
            {t("settings.library.artistSplitSymbols")}
          </Text>
          <Text className="mb-3 text-[13px] leading-5 text-muted">
            {t("settings.library.artistSplitSymbolsDescription")}
          </Text>
          <TextInput
            value={artistSymbolsInput}
            onChangeText={setArtistSymbolsInput}
            onBlur={() => {
              void updateSplitConfig({
                artistSplitSymbols: parseCommaSeparated(artistSymbolsInput),
              })
            }}
            placeholder={t("settings.library.splitSymbolsPlaceholder")}
            placeholderTextColor={theme.muted}
            className="rounded-xl border border-border/60 bg-default/25 px-4 py-3 text-foreground"
          />
        </View>

        <View className="rounded-[28px] border border-border/60 bg-background px-5 py-4">
          <Text className="mb-2 text-[16px] font-medium text-foreground">
            {t("settings.library.unsplitArtists")}
          </Text>
          <Text className="mb-3 text-[13px] leading-5 text-muted">
            {t("settings.library.unsplitArtistsDescription")}
          </Text>
          <TextInput
            value={unsplitArtistsInput}
            onChangeText={setUnsplitArtistsInput}
            onBlur={() => {
              void updateSplitConfig({
                unsplitArtists: parseCommaSeparated(unsplitArtistsInput),
              })
            }}
            placeholder={t("settings.library.unsplitArtistsPlaceholder")}
            placeholderTextColor={theme.muted}
            className="rounded-xl border border-border/60 bg-default/25 px-4 py-3 text-foreground"
          />
        </View>

        <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
          <Text className="px-5 pt-4 pb-2 text-[16px] font-medium text-foreground">
            {t("settings.library.artistSplitMode")}
          </Text>
          {(
            [
              {
                value: "split",
                titleKey: "settings.library.artistSplitModeSplit",
                descriptionKey:
                  "settings.library.artistSplitModeSplitDescription",
              },
              {
                value: "original",
                titleKey: "settings.library.artistSplitModeOriginal",
                descriptionKey:
                  "settings.library.artistSplitModeOriginalDescription",
              },
            ] as const
          ).map((option, index) => (
            <PressableFeedback
              key={option.value}
              className={`flex-row items-center px-5 py-4 active:opacity-70 ${
                index > 0 ? "border-t border-border/60" : ""
              }`}
              onPress={() => {
                setArtistSplitMode(option.value)
                void updateSplitConfig({ artistSplitMode: option.value })
              }}
            >
              <View className="flex-1 gap-0.5 pr-2">
                <Text className="text-[16px] font-medium text-foreground">
                  {t(option.titleKey)}
                </Text>
                <Text className="text-[13px] leading-5 text-muted">
                  {t(option.descriptionKey)}
                </Text>
              </View>
              {artistSplitMode === option.value ? (
                <LocalTickIcon
                  fill="none"
                  width={24}
                  height={24}
                  color={theme.accent}
                />
              ) : null}
            </PressableFeedback>
          ))}
        </View>

        <View className="rounded-[28px] border border-border/60 bg-background px-5 py-4">
          <Text className="mb-2 text-[16px] font-medium text-foreground">
            {t("settings.library.genreSplitSymbols")}
          </Text>
          <Text className="mb-3 text-[13px] leading-5 text-muted">
            {t("settings.library.genreSplitSymbolsDescription")}
          </Text>
          <TextInput
            value={genreSymbolsInput}
            onChangeText={setGenreSymbolsInput}
            onBlur={() => {
              void updateSplitConfig({
                genreSplitSymbols: parseCommaSeparated(genreSymbolsInput),
              })
            }}
            placeholder={t("settings.library.splitSymbolsPlaceholder")}
            placeholderTextColor={theme.muted}
            className="rounded-xl border border-border/60 bg-default/25 px-4 py-3 text-foreground"
          />
        </View>
      </View>
    </ScrollView>
  )
}
