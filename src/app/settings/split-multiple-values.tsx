/**
 * Purpose: Lets users configure tag-based symbol splitting for artists/genres, unsplit artist exceptions, and artist display mode.
 * Caller: Settings split-multiple-values route.
 * Dependencies: HeroUI Native form controls, settings split config module/store, and indexer relation rebuild.
 * Main Functions: SplitMultipleValuesSettingsScreen(), SplitTagListEditor()
 * Side Effects: Persists split settings config, rebuilds split metadata relations, and refreshes indexed media state.
 */

import {
  Button,
  Description,
  Input,
  Label,
  PressableFeedback,
  TagGroup,
  TextField,
} from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalAddIcon from "@/components/icons/local/add"
import LocalTickIcon from "@/components/icons/local/tick"
import { rebuildSplitRelationsForConfig } from "@/modules/indexer/indexer.service"
import { setSplitMultipleValueConfig } from "@/modules/settings/split-multiple-values"
import { useSettingsStore } from "@/modules/settings/settings.store"
import { useThemeColors } from "@/modules/ui/theme"

type SplitMode = "original" | "split"

interface SplitTagListEditorProps {
  title: string
  description: string
  values: string[]
  placeholder: string
  addLabel: string
  removeLabel: string
  onChange: (values: string[]) => void
}

function normalizeValues(values: string[]) {
  const seen = new Set<string>()
  const next: string[] = []

  for (const value of values) {
    const item = value.trim()
    const key = item.toLowerCase()

    if (!item || seen.has(key)) {
      continue
    }

    seen.add(key)
    next.push(item)
  }

  return next
}

function SplitTagListEditor({
  title,
  description,
  values,
  placeholder,
  addLabel,
  removeLabel,
  onChange,
}: SplitTagListEditorProps) {
  const theme = useThemeColors()
  const [inputValue, setInputValue] = React.useState("")
  const trimmedInputValue = inputValue.trim()

  function addValue() {
    if (!trimmedInputValue) {
      return
    }

    const nextValues = normalizeValues([...values, trimmedInputValue])

    if (nextValues.length === values.length) {
      setInputValue("")
      return
    }

    setInputValue("")
    onChange(nextValues)
  }

  function removeValues(keys: Set<string | number>) {
    onChange(values.filter((item) => !keys.has(item)))
  }

  return (
    <View className="rounded-[28px] border border-border/60 bg-background px-5 py-4">
      <TextField>
        <Label>{title}</Label>
        <Description className="mb-3">{description}</Description>
        <TagGroup
          selectionMode="none"
          variant="surface"
          size="md"
          onRemove={removeValues}
        >
          <TagGroup.List className="mb-3 flex-row flex-wrap gap-2">
            {values.map((value) => (
              <TagGroup.Item key={value} id={value}>
                <TagGroup.ItemLabel>{value}</TagGroup.ItemLabel>
                <TagGroup.ItemRemoveButton
                  accessibilityLabel={`${removeLabel} ${value}`}
                />
              </TagGroup.Item>
            ))}
          </TagGroup.List>
        </TagGroup>
        <View className="flex-row items-center gap-2">
          <Input
            variant="secondary"
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={addValue}
            placeholder={placeholder}
            className="min-h-12 flex-1"
            returnKeyType="done"
          />
          <Button
            accessibilityLabel={addLabel}
            variant="secondary"
            isIconOnly
            isDisabled={!trimmedInputValue}
            className="h-12 w-12"
            onPress={addValue}
          >
            <LocalAddIcon
              fill="none"
              width={22}
              height={22}
              color={theme.foreground}
            />
          </Button>
        </View>
      </TextField>
    </View>
  )
}

export default function SplitMultipleValuesSettingsScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const config = useSettingsStore((state) => state.splitMultipleValueConfig)
  const [artistSplitMode, setArtistSplitMode] = React.useState<SplitMode>(
    config.artistSplitMode
  )

  React.useEffect(() => {
    setArtistSplitMode(config.artistSplitMode)
  }, [config])

  async function updateSplitConfig(next: {
    artistSplitSymbols?: string[]
    unsplitArtists?: string[]
    genreSplitSymbols?: string[]
    artistSplitMode?: SplitMode
  }) {
    const config = await setSplitMultipleValueConfig(next)
    await rebuildSplitRelationsForConfig(config)
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="gap-5 px-4 py-4">
        <SplitTagListEditor
          title={t("settings.library.artistSplitSymbols")}
          description={t("settings.library.artistSplitSymbolsDescription")}
          values={config.artistSplitSymbols}
          placeholder={t("settings.library.splitSymbolsPlaceholder")}
          addLabel={t("settings.library.addSplitSymbol")}
          removeLabel={t("settings.library.removeSplitSymbol")}
          onChange={(artistSplitSymbols) => {
            void updateSplitConfig({ artistSplitSymbols })
          }}
        />

        <SplitTagListEditor
          title={t("settings.library.unsplitArtists")}
          description={t("settings.library.unsplitArtistsDescription")}
          values={config.unsplitArtists}
          placeholder={t("settings.library.unsplitArtistsPlaceholder")}
          addLabel={t("settings.library.addUnsplitArtist")}
          removeLabel={t("settings.library.removeUnsplitArtist")}
          onChange={(unsplitArtists) => {
            void updateSplitConfig({ unsplitArtists })
          }}
        />

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

        <SplitTagListEditor
          title={t("settings.library.genreSplitSymbols")}
          description={t("settings.library.genreSplitSymbolsDescription")}
          values={config.genreSplitSymbols}
          placeholder={t("settings.library.splitSymbolsPlaceholder")}
          addLabel={t("settings.library.addSplitSymbol")}
          removeLabel={t("settings.library.removeSplitSymbol")}
          onChange={(genreSplitSymbols) => {
            void updateSplitConfig({ genreSplitSymbols })
          }}
        />
      </View>
    </ScrollView>
  )
}
