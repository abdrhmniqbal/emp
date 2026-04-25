/**
 * Purpose: Renders appearance preferences for choosing light, dark, or adaptive app theme behavior.
 * Caller: Settings appearance route.
 * Dependencies: Uniwind theme controls, local tick icon, theme colors.
 * Main Functions: AppearanceSettingsScreen()
 * Side Effects: Persists the selected Uniwind theme mode.
 */

import { PressableFeedback } from "heroui-native"
import { ScrollView, Text, View } from "react-native"
import { Uniwind, useUniwind } from "uniwind"

import LocalTickIcon from "@/components/icons/local/tick"
import { useThemeColors } from "@/modules/ui/theme"

type ThemeValue = "light" | "dark" | "system"

interface AppearanceOption {
  label: string
  value: ThemeValue
}

const APPEARANCE_OPTIONS: AppearanceOption[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
]

export default function AppearanceSettingsScreen() {
  const { theme: currentTheme, hasAdaptiveThemes } = useUniwind()
  const theme = useThemeColors()

  const currentMode: ThemeValue = hasAdaptiveThemes
    ? "system"
    : (currentTheme as ThemeValue)

  function handleThemeChange(value: ThemeValue) {
    Uniwind.setTheme(value)
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
          {APPEARANCE_OPTIONS.map((option, index) => (
            <PressableFeedback
              key={option.value}
              onPress={() => handleThemeChange(option.value)}
              className={`flex-row items-center px-5 py-4 active:opacity-70 ${
                index > 0 ? "border-t border-border/60" : ""
              }`}
            >
              <Text className="flex-1 text-[16px] font-medium text-foreground">
                {option.label}
              </Text>
              {currentMode === option.value && (
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
      </View>
    </ScrollView>
  )
}
