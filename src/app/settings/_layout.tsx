import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsLayout() {
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
                headerTitleAlign: 'center',
                contentStyle: { backgroundColor: theme.background },
                animation: 'default',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Settings",
                    headerLargeTitle: true,
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} hitSlop={20}>
                            <Ionicons name="close" size={24} color={theme.foreground} />
                        </Pressable>
                    ),
                }}
            />
            <Stack.Screen
                name="appearance"
                options={{
                    title: "Appearance",
                }}
            />
        </Stack>
    );
}
