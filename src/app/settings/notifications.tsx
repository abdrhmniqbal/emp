/**
 * Purpose: Renders notification preferences for indexing progress visibility.
 * Caller: Settings notifications route.
 * Dependencies: HeroUI Native switch, settings store, indexer notification service, settings row pattern.
 * Main Functions: NotificationSettingsScreen()
 * Side Effects: Persists notification preferences and may dismiss active indexing notifications.
 */

import { Switch } from "heroui-native"
import { ScrollView, View } from "react-native"

import { SettingsRow } from "@/components/patterns/settings-row"
import { dismissIndexerProgressNotification } from "@/modules/indexer/indexer-notification.service"
import { setIndexerNotificationsEnabled } from "@/modules/settings/indexer-notifications"
import { useSettingsStore } from "@/modules/settings/settings.store"

export default function NotificationSettingsScreen() {
  const indexerNotificationsEnabled = useSettingsStore(
    (state) => state.indexerNotificationsEnabled
  )

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
          <SettingsRow
            title="Indexer Notifications"
            description={
              indexerNotificationsEnabled
                ? "Show system notifications while indexing."
                : "Hide indexing notifications from your system tray."
            }
            onPress={undefined}
            showChevron={false}
            rightContent={
              <Switch
                isSelected={indexerNotificationsEnabled}
                onSelectedChange={(isSelected) => {
                  void setIndexerNotificationsEnabled(isSelected)

                  if (!isSelected) {
                    void dismissIndexerProgressNotification()
                  }
                }}
              />
            }
          />
        </View>
      </View>
    </ScrollView>
  )
}
