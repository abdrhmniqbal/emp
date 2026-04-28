/**
 * Purpose: Renders library settings for scanning behavior, split metadata preferences, folder and duration filters, and reindexing.
 * Caller: Settings library route.
 * Dependencies: Expo Router, react-i18next, settings store, indexer services, HeroUI Native ListGroup, dialog and switch.
 * Main Functions: LibrarySettingsScreen()
 * Side Effects: Persists library settings, shows a manual reindex dialog, and can trigger a full library reindex.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button, Dialog, ListGroup, Separator, Switch } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import { forceReindexLibrary } from "@/modules/indexer/indexer.service"
import { useIndexerStore } from "@/modules/indexer/indexer.store"
import { setAutoScanEnabled } from "@/modules/settings/auto-scan"
import { getTrackDurationFilterLabel } from "@/modules/settings/track-duration-filter"
import { useSettingsStore } from "@/modules/settings/settings.store"

export default function LibrarySettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const autoScanEnabled = useSettingsStore((state) => state.autoScanEnabled)
  const trackDurationFilterConfig = useSettingsStore(
    (state) => state.trackDurationFilterConfig
  )
  const splitMultipleValueConfig = useSettingsStore(
    (state) => state.splitMultipleValueConfig
  )
  const [showReindexDialog, setShowReindexDialog] = React.useState(false)

  function getSplitMultipleValuesSummary() {
    const modeLabel =
      splitMultipleValueConfig.artistSplitMode === "original"
        ? t("settings.library.artistSplitModeOriginal")
        : t("settings.library.artistSplitModeSplit")

    return t("settings.library.splitMultipleValuesSummary", {
      mode: modeLabel,
      artistSymbols: splitMultipleValueConfig.artistSplitSymbols.join(" "),
      genreSymbols: splitMultipleValueConfig.genreSplitSymbols.join(" "),
    })
  }

  function handleReindexDialogOpenChange(isOpen: boolean) {
    setShowReindexDialog(isOpen)
  }

  function handleReindexLater() {
    setShowReindexDialog(false)
  }

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
          <ListGroup>
            <ListGroup.Item onPress={() => router.push("/settings/folder-filters")}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.routes.folderFilters.title")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.library.folderFiltersDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => router.push("/settings/track-duration-filter")}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.library.trackDurationFilter")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {getTrackDurationFilterLabel(trackDurationFilterConfig)}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => router.push("/settings/split-multiple-values")}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.library.splitMultipleValues")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.library.artistSplitSymbolsDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.library.autoScan")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {autoScanEnabled
                    ? t("settings.library.autoScanEnabled")
                    : t("settings.library.autoScanDisabled")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Switch
                  isSelected={autoScanEnabled}
                  onSelectedChange={(isSelected) => {
                    void setAutoScanEnabled(isSelected)
                  }}
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item
              onPress={() => setShowReindexDialog(true)}
              disabled={isIndexing}
            >
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.library.reindexLibrary")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {isIndexing
                    ? t("settings.library.reindexInProgress")
                    : t("settings.library.reindexDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          </ListGroup>
        </View>
      </ScrollView>

      <Dialog
        isOpen={showReindexDialog}
        onOpenChange={handleReindexDialogOpenChange}
      >
        <Dialog.Portal>
          <Dialog.Overlay isCloseOnPress />
          <Dialog.Content className="gap-4" isSwipeable>
            <View className="gap-1.5">
              <Dialog.Title>
                {t("settings.library.reindexDialogTitle")}
              </Dialog.Title>
              <Dialog.Description>
                {t("settings.library.reindexDialogDescription")}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={handleReindexLater}>
                {t("settings.library.reindexLaterAction")}
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
