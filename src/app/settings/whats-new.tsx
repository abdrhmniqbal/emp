/**
 * Purpose: Shows GitHub release notes up to the installed app version.
 * Caller: About settings route.
 * Dependencies: TanStack Query, update service, update settings, HeroUI Native PressableFeedback, release notes markdown renderer, react-i18next.
 * Main Functions: WhatsNewSettingsScreen()
 * Side Effects: Fetches GitHub releases and opens release links externally.
 */

import { useQuery } from "@tanstack/react-query"
import { PressableFeedback } from "heroui-native"
import { Linking, ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { ReleaseNotesMarkdown } from "@/components/blocks/release-notes-markdown"
import { ensureAppUpdateConfigLoaded } from "@/modules/settings/app-updates"
import {
  getCurrentAppVersion,
  listReleaseNotesUntilCurrent,
} from "@/modules/updates/app-update.service"

function formatReleaseDate(value: string) {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString()
}

export default function WhatsNewSettingsScreen() {
  const { t } = useTranslation()
  const currentVersion = getCurrentAppVersion()
  const releaseNotesQuery = useQuery({
    queryKey: ["app-update-release-notes", currentVersion],
    queryFn: async () => {
      const settings = await ensureAppUpdateConfigLoaded()
      return listReleaseNotesUntilCurrent({
        currentVersion,
        includePrereleases: settings.includePrereleases,
      })
    },
  })

  const releaseNotes = releaseNotesQuery.data ?? []

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="gap-4 px-4 py-4">
        <Text className="text-sm leading-5 text-muted">
          {t("settings.about.whatsNewCurrentVersion", {
            version: currentVersion || t("common.unknown"),
          })}
        </Text>

        {releaseNotesQuery.isPending ? (
          <Text className="text-sm text-muted">
            {t("settings.about.whatsNewLoading")}
          </Text>
        ) : null}

        {!releaseNotesQuery.isPending && releaseNotes.length === 0 ? (
          <Text className="text-sm text-muted">
            {t("settings.about.whatsNewEmpty")}
          </Text>
        ) : null}

        {releaseNotes.map((release) => {
          const releaseDate = formatReleaseDate(release.publishedAt)
          return (
            <View
              key={release.version}
              className="border-b border-border pb-4"
            >
              <PressableFeedback
                onPress={() => {
                  if (release.htmlUrl) {
                    void Linking.openURL(release.htmlUrl)
                  }
                }}
              >
                <View>
                  <Text className="text-base font-semibold text-foreground">
                    {release.releaseName}
                  </Text>
                  <Text className="mt-1 text-xs text-muted">
                    {release.version}
                    {release.prerelease
                      ? ` · ${t("updates.previewRelease")}`
                      : ""}
                    {releaseDate ? ` · ${releaseDate}` : ""}
                  </Text>
                </View>
              </PressableFeedback>
              <View className="mt-3">
                <ReleaseNotesMarkdown
                  markdown={release.body.trim() || t("updates.noReleaseNotes")}
                />
              </View>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
