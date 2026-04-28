/**
 * Purpose: Renders app language selection settings.
 * Caller: Settings language route.
 * Dependencies: HeroUI Native ListGroup, react-i18next, localization settings service, settings store, theme colors.
 * Main Functions: LanguageSettingsScreen()
 * Side Effects: Persists the selected language and updates i18next language.
 */

import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
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
        <ListGroup >
          {languageOptions.map((option, index) => (
            <React.Fragment key={option.code}>
              {index > 0 && <Separator className="mx-4" />}
              <ListGroup.Item
                onPress={() => {
                  void setLanguageCode(option.code)
                }}
              >
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(option.labelKey)}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {t(option.nativeLabelKey)}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                {languageCode === option.code ? (
                  <ListGroup.ItemSuffix>
                    <LocalTickIcon
                      fill="none"
                      width={24}
                      height={24}
                      color={theme.accent}
                    />
                  </ListGroup.ItemSuffix>
                ) : null}
              </ListGroup.Item>
            </React.Fragment>
          ))}
        </ListGroup>
      </View>
    </ScrollView>
  )
}
