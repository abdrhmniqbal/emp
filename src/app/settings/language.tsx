/**
 * Purpose: Renders app language selection settings.
 * Caller: Settings language route.
 * Dependencies: HeroUI Native press feedback, react-i18next, localization settings service, settings store, theme colors.
 * Main Functions: LanguageSettingsScreen()
 * Side Effects: Persists the selected language and updates i18next language.
 */

import { PressableFeedback } from "heroui-native"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTickIcon from "@/components/icons/local/tick"
import {
  getLanguageOptions,
  setLanguageCode,
} from "@/modules/localization/language-settings"
import { useSettingsStore } from "@/modules/settings/settings.store"
import { useThemeColors } from "@/modules/ui/theme"

export default function LanguageSettingsScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const languageCode = useSettingsStore((state) => state.languageCode)
  const languageOptions = getLanguageOptions()

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="gap-5 px-4 py-4">
        <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
          {languageOptions.map((option, index) => (
            <PressableFeedback
              key={option.code}
              onPress={() => {
                void setLanguageCode(option.code)
              }}
              className={`flex-row items-center px-5 py-4 active:opacity-70 ${
                index > 0 ? "border-t border-border/60" : ""
              }`}
            >
              <View className="flex-1 gap-0.5 pr-2">
                <Text className="text-[16px] font-medium text-foreground">
                  {t(option.labelKey)}
                </Text>
                <Text className="text-[13px] leading-5 text-muted">
                  {t(option.nativeLabelKey)}
                </Text>
              </View>
              {languageCode === option.code ? (
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
      </View>
    </ScrollView>
  )
}
