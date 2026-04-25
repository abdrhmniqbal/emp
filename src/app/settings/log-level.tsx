/**
 * Purpose: Renders logging verbosity preferences for debugging and diagnostics.
 * Caller: Settings log-level route.
 * Dependencies: HeroUI Native press feedback, logging store, settings store, theme colors.
 * Main Functions: LogLevelSettingsScreen()
 * Side Effects: Persists the selected application log level.
 */

import { PressableFeedback } from "heroui-native"
import { ScrollView, Text, View } from "react-native"

import LocalTickIcon from "@/components/icons/local/tick"
import { useThemeColors } from "@/modules/ui/theme"
import {
  type AppLogLevel,
  setAppLogLevel,
} from "@/modules/logging/logging.store"
import { useSettingsStore } from "@/modules/settings/settings.store"

interface LogLevelOption {
  label: string
  value: AppLogLevel
  description: string
}

const LOG_LEVEL_OPTIONS: LogLevelOption[] = [
  {
    label: "Minimal",
    value: "minimal",
    description: "Critical errors only.",
  },
  {
    label: "Extra",
    value: "extra",
    description: "Log everything.",
  },
]

export default function LogLevelSettingsScreen() {
  const theme = useThemeColors()
  const loggingLevel = useSettingsStore((state) => state.loggingConfig.level)

  async function handleSelect(level: AppLogLevel) {
    await setAppLogLevel(level)
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
          {LOG_LEVEL_OPTIONS.map((option, index) => (
            <PressableFeedback
              key={option.value}
              onPress={() => {
                void handleSelect(option.value)
              }}
              className={`flex-row items-center px-5 py-4 active:opacity-70 ${
                index > 0 ? "border-t border-border/60" : ""
              }`}
            >
              <View className="flex-1 gap-0.5 pr-2">
                <Text className="text-[16px] font-medium text-foreground">
                  {option.label}
                </Text>
                <Text className="text-[13px] leading-5 text-muted">
                  {option.description}
                </Text>
              </View>
              {loggingLevel === option.value ? (
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
