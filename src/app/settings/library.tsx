/**
 * Purpose: Renders library settings for scanning behavior, folder filters, duration filters, and reindexing.
 * Caller: Settings library route.
 * Dependencies: Expo Router, react-i18next, settings store, indexer services, settings row pattern, HeroUI Native dialog and switch.
 * Main Functions: LibrarySettingsScreen()
 * Side Effects: Persists library settings and can trigger a full library reindex.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button, Dialog } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import { SettingsRow } from "@/components/patterns/settings-row"
import {
  setAutoScanEnabled,
} from "@/modules/settings/auto-scan"
import { forceReindexLibrary } from "@/modules/indexer/indexer.service"
import { useIndexerStore } from "@/modules/indexer/indexer.store"
import {
  getTrackDurationFilterLabel,
} from "@/modules/settings/track-duration-filter"
import { useSettingsStore } from "@/modules/settings/settings.store"
import { Switch } from "heroui-native"

export default function LibrarySettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const autoScanEnabled = useSettingsStore((state) => state.autoScanEnabled)
  const trackDurationFilterConfig = useSettingsStore(
    (state) => state.trackDurationFilterConfig
  )
  const [showReindexDialog, setShowReindexDialog] = React.useState(false)

  function handleConfirmForceReindex() {
    setShowReindexDialog(false)
    void forceReindexLibrary(true)
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="gap-5 px-4 py-4">
          <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
            <SettingsRow
              title={t("settings.routes.folderFilters.title")}
              description={t("settings.library.folderFiltersDescription")}
              onPress={() => router.push("/settings/folder-filters")}
            />
            <SettingsRow
              title={t("settings.library.trackDurationFilter")}
              description={getTrackDurationFilterLabel(trackDurationFilterConfig)}
              onPress={() => router.push("/settings/track-duration-filter")}
              className="border-t border-border/60"
            />
            <SettingsRow
              title={t("settings.library.autoScan")}
              description={
                autoScanEnabled
                  ? t("settings.library.autoScanEnabled")
                  : t("settings.library.autoScanDisabled")
              }
              onPress={undefined}
              showChevron={false}
              rightContent={
                <Switch
                  isSelected={autoScanEnabled}
                  onSelectedChange={(isSelected) => {
                    void setAutoScanEnabled(isSelected)
                  }}
                />
              }
              className="border-t border-border/60"
            />
            <SettingsRow
              title={t("settings.library.reindexLibrary")}
              description={
                isIndexing
                  ? t("settings.library.reindexInProgress")
                  : t("settings.library.reindexDescription")
              }
              onPress={() => setShowReindexDialog(true)}
              showChevron={false}
              isDisabled={isIndexing}
              className="border-t border-border/60"
            />
          </View>
        </View>
      </ScrollView>

      <Dialog isOpen={showReindexDialog} onOpenChange={setShowReindexDialog}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>{t("settings.library.reindexDialogTitle")}</Dialog.Title>
              <Dialog.Description>
                {t("settings.library.reindexDialogDescription")}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                onPress={() => setShowReindexDialog(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button onPress={handleConfirmForceReindex}>
                {t("settings.library.reindexAction")}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
