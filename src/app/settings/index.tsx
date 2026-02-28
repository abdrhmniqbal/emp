import { useRouter } from "expo-router"
import { PressableFeedback } from "heroui-native"
import { ScrollView, Text, View } from "react-native"

import { useThemeColors } from "@/hooks/use-theme-colors"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"

interface SettingsCategoryItemProps {
  title: string
  description: string
  onPress: () => void
}

function SettingsCategoryItem({
  title,
  description,
  onPress,
}: SettingsCategoryItemProps) {
  const theme = useThemeColors()

  return (
    <PressableFeedback
      onPress={onPress}
      className="flex-row items-center bg-background px-6 py-4 active:opacity-70"
    >
      <View className="flex-1 gap-1">
        <Text className="text-[17px] font-normal text-foreground">{title}</Text>
        <Text className="text-[13px] leading-5 text-muted">{description}</Text>
      </View>
      <LocalChevronRightIcon
        fill="none"
        width={20}
        height={20}
        color={theme.muted}
      />
    </PressableFeedback>
  )
}

export default function SettingsScreen() {
  const router = useRouter()

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="py-2">
        <SettingsCategoryItem
          title="Appearance"
          description="Theme and visual preferences."
          onPress={() => router.push("/settings/appearance")}
        />
        <SettingsCategoryItem
          title="Library"
          description="Scanning, filters, and indexing behavior."
          onPress={() => router.push("/settings/library")}
        />
        <SettingsCategoryItem
          title="Advanced"
          description="System-level and troubleshooting settings."
          onPress={() => router.push("/settings/advanced")}
        />
        <SettingsCategoryItem
          title="About"
          description="App information and build details."
          onPress={() => router.push("/settings/about")}
        />
      </View>
    </ScrollView>
  )
}
