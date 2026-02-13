import { Stack, useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { View } from "react-native";
import { Button } from "heroui-native";
import LocalSettingsIcon from "@/components/icons/local/settings";

export default function SearchLayout() {
  const theme = useThemeColors();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.foreground,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Search",
          headerLargeTitle: true,
          headerTitleAlign: "left",
          headerRight: () => (
            <View className="flex-row gap-4 -mr-2">
              <Button
                onPress={() => router.push("/settings")}
                variant="ghost"
                isIconOnly
              >
                <LocalSettingsIcon
                  fill="none"
                  width={24}
                  height={24}
                  color={theme.foreground}
                />
              </Button>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="genre/[name]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="genre/albums"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="genre/top-tracks"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
