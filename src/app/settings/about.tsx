/**
 * Purpose: Renders app metadata and links to the project repository.
 * Caller: Settings about route.
 * Dependencies: Expo application metadata, Expo image, react-i18next, React Native linking, HeroUI Native ListGroup.
 * Main Functions: AboutSettingsScreen()
 * Side Effects: Opens the external project repository in the browser.
 */

import * as Application from "expo-application"
import Constants from "expo-constants"
import { Image } from "expo-image"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { ListGroup } from "heroui-native"
import { Linking, ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import appIcon from "@/assets/icon.png"

export default function AboutSettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const appName = Constants.expoConfig?.name || "Startune Music"
  const version =
    Application.nativeApplicationVersion ||
    Constants.nativeAppVersion ||
    Constants.expoConfig?.version
  const repositoryUrl = "https://github.com/abdrhmniqbal/startune-music"

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <View className="flex-row items-center gap-6 bg-background px-2 py-1">
          <Image
            source={appIcon}
            style={{ width: 64, height: 64 }}
            contentFit="contain"
          />
          <View className="flex-1">
            <Text className="text-[17px] font-normal text-foreground">
              {appName}
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-muted">
              v{version || t("common.unknown")}
            </Text>
          </View>
        </View>

        <ListGroup >
          <ListGroup.Item
            onPress={() => {
              void Linking.openURL(repositoryUrl)
            }}
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.about.github")}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.about.repositoryDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <ListGroup.Item
            onPress={() => {
              router.push("/settings/open-source-licenses")
            }}
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.about.openSourceLicenses", {
                  defaultValue: "Open Source Licenses",
                })}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.about.openSourceLicensesDescription", {
                  defaultValue: "Third-party packages and license texts.",
                })}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </View>
    </ScrollView>
  )
}
